import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DataTable {
  id: string;
  implementing_act_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface DataColumn {
  id: string;
  table_id: string;
  name: string;
  column_key: string;
  sort_order: number;
}

export interface DataRow {
  id: string;
  table_id: string;
  values: Record<string, string>;
  sort_order: number;
}

export function useDataTables(implementingActId: string) {
  return useQuery({
    queryKey: ["ia-data-tables", implementingActId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("implementing_act_data_tables")
        .select("*")
        .eq("implementing_act_id", implementingActId)
        .order("sort_order");
      if (error) throw error;
      return data as DataTable[];
    },
    enabled: !!implementingActId,
  });
}

export function usePublishedDataTables(implementingActId: string) {
  return useQuery({
    queryKey: ["ia-data-tables-published", implementingActId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("implementing_act_data_tables")
        .select("*")
        .eq("implementing_act_id", implementingActId)
        .eq("is_published", true)
        .order("sort_order");
      if (error) throw error;
      return data as DataTable[];
    },
    enabled: !!implementingActId,
  });
}

export function useDataColumns(tableId: string) {
  return useQuery({
    queryKey: ["ia-data-columns", tableId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("implementing_act_data_columns")
        .select("*")
        .eq("table_id", tableId)
        .order("sort_order");
      if (error) throw error;
      return data as DataColumn[];
    },
    enabled: !!tableId,
  });
}

export function useDataRows(tableId: string) {
  return useQuery({
    queryKey: ["ia-data-rows", tableId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("implementing_act_data_rows")
        .select("*")
        .eq("table_id", tableId)
        .order("sort_order");
      if (error) throw error;
      return data as DataRow[];
    },
    enabled: !!tableId,
  });
}

export function useDataTableMutations(implementingActId: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["ia-data-tables", implementingActId] });
    qc.invalidateQueries({ queryKey: ["ia-data-tables-published", implementingActId] });
  };

  const createTable = useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      const { data, error } = await supabase
        .from("implementing_act_data_tables")
        .insert({ implementing_act_id: implementingActId, name: input.name, description: input.description || null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const updateTable = useMutation({
    mutationFn: async (input: { id: string; name?: string; description?: string; is_published?: boolean; sort_order?: number }) => {
      const { id, ...rest } = input;
      const { error } = await supabase.from("implementing_act_data_tables").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteTable = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("implementing_act_data_tables").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  /** Split a table: rows from `fromIndex` onward move into a new hidden table with the same columns. */
  const splitTable = useMutation({
    mutationFn: async (input: { table: DataTable; rowIds: string[]; fromIndex: number; newName: string }) => {
      const moving = input.rowIds.slice(input.fromIndex);
      if (input.fromIndex < 1 || moving.length === 0) throw new Error("Choose a row after the first one to split at.");
      const { data: cols, error: colErr } = await supabase
        .from("implementing_act_data_columns").select("name, column_key, sort_order").eq("table_id", input.table.id);
      if (colErr) throw colErr;
      const { data: created, error: tErr } = await supabase
        .from("implementing_act_data_tables")
        .insert({
          implementing_act_id: implementingActId,
          name: input.newName,
          description: input.table.description,
          is_published: false,
          sort_order: (input.table.sort_order ?? 0) + 1,
        })
        .select().single();
      if (tErr) throw tErr;
      try {
        if (cols && cols.length) {
          const { error } = await supabase.from("implementing_act_data_columns")
            .insert(cols.map((c) => ({ ...c, table_id: created.id })));
          if (error) throw error;
        }
        for (let i = 0; i < moving.length; i++) {
          const { error } = await supabase.from("implementing_act_data_rows")
            .update({ table_id: created.id, sort_order: i }).eq("id", moving[i]).eq("table_id", input.table.id);
          if (error) throw error;
        }
      } catch (e) {
        // Put any moved rows back and remove the half-made table.
        await supabase.from("implementing_act_data_rows").update({ table_id: input.table.id }).eq("table_id", created.id);
        await supabase.from("implementing_act_data_tables").delete().eq("id", created.id);
        throw e;
      }
      return created;
    },
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["ia-data-rows"] });
      qc.invalidateQueries({ queryKey: ["ia-data-columns"] });
    },
  });

  const reorderTables = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      for (let i = 0; i < orderedIds.length; i++) {
        const { error } = await supabase.from("implementing_act_data_tables").update({ sort_order: i }).eq("id", orderedIds[i]);
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
    onError: invalidate,
  });

  return { createTable, updateTable, deleteTable, splitTable, reorderTables };
}

export function useDataColumnMutations(tableId: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["ia-data-columns", tableId] });
    qc.invalidateQueries({ queryKey: ["ia-data-rows", tableId] });
  };

  const createColumn = useMutation({
    mutationFn: async (input: { name: string; column_key: string; sort_order?: number }) => {
      const { error } = await supabase
        .from("implementing_act_data_columns")
        .insert({ table_id: tableId, ...input });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateColumn = useMutation({
    mutationFn: async (input: { id: string; name?: string; column_key?: string }) => {
      const { id, ...rest } = input;
      const { error } = await supabase.from("implementing_act_data_columns").update(rest).eq("id", id).eq("table_id", tableId).select("id").single();
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteColumn = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("implementing_act_data_columns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { createColumn, updateColumn, deleteColumn };
}

export function useDataRowMutations(tableId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["ia-data-rows", tableId] });

  const createRow = useMutation({
    mutationFn: async (input: { values: Record<string, string>; sort_order?: number }) => {
      const { error } = await supabase
        .from("implementing_act_data_rows")
        .insert({ table_id: tableId, values: input.values, sort_order: input.sort_order || 0 });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateRow = useMutation({
    mutationFn: async (input: { id: string; values: Record<string, string> }) => {
      const { error } = await supabase.from("implementing_act_data_rows").update({ values: input.values }).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteRow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("implementing_act_data_rows").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const reorderRows = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const results = await Promise.all(
        orderedIds.map((id, i) => supabase.from("implementing_act_data_rows").update({ sort_order: i }).eq("id", id)),
      );
      const failed = results.find(r => r.error);
      if (failed?.error) throw failed.error;
    },
    onSettled: invalidate,
  });

  return { createRow, updateRow, deleteRow, reorderRows };
}
