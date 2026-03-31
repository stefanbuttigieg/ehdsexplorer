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

  return { createTable, updateTable, deleteTable };
}

export function useDataColumnMutations(tableId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["ia-data-columns", tableId] });

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
      const { error } = await supabase.from("implementing_act_data_columns").update(rest).eq("id", id);
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

  return { createRow, updateRow, deleteRow };
}
