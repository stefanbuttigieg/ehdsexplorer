import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FaqDataTable {
  id: string;
  faq_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface FaqDataColumn {
  id: string;
  table_id: string;
  name: string;
  column_key: string;
  sort_order: number;
}

export interface FaqDataRow {
  id: string;
  table_id: string;
  values: Record<string, string>;
  sort_order: number;
}

export function useFaqDataTables(faqId: string) {
  return useQuery({
    queryKey: ["faq-data-tables", faqId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ehds_faq_data_tables")
        .select("*")
        .eq("faq_id", faqId)
        .order("sort_order");
      if (error) throw error;
      return data as FaqDataTable[];
    },
    enabled: !!faqId,
  });
}

export function usePublishedFaqDataTables(faqId: string) {
  return useQuery({
    queryKey: ["faq-data-tables-published", faqId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ehds_faq_data_tables")
        .select("*")
        .eq("faq_id", faqId)
        .eq("is_published", true)
        .order("sort_order");
      if (error) throw error;
      return data as FaqDataTable[];
    },
    enabled: !!faqId,
  });
}

export function useFaqDataColumns(tableId: string) {
  return useQuery({
    queryKey: ["faq-data-columns", tableId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ehds_faq_data_columns")
        .select("*")
        .eq("table_id", tableId)
        .order("sort_order");
      if (error) throw error;
      return data as FaqDataColumn[];
    },
    enabled: !!tableId,
  });
}

export function useFaqDataRows(tableId: string) {
  return useQuery({
    queryKey: ["faq-data-rows", tableId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ehds_faq_data_rows")
        .select("*")
        .eq("table_id", tableId)
        .order("sort_order");
      if (error) throw error;
      return data as FaqDataRow[];
    },
    enabled: !!tableId,
  });
}

export function useFaqDataTableMutations(faqId: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["faq-data-tables", faqId] });
    qc.invalidateQueries({ queryKey: ["faq-data-tables-published", faqId] });
  };

  const createTable = useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      const { data, error } = await supabase
        .from("ehds_faq_data_tables")
        .insert({ faq_id: faqId, name: input.name, description: input.description || null })
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
      const { error } = await supabase.from("ehds_faq_data_tables").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteTable = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ehds_faq_data_tables").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { createTable, updateTable, deleteTable };
}

export function useFaqDataColumnMutations(tableId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["faq-data-columns", tableId] });

  const createColumn = useMutation({
    mutationFn: async (input: { name: string; column_key: string; sort_order?: number }) => {
      const { error } = await supabase
        .from("ehds_faq_data_columns")
        .insert({ table_id: tableId, ...input });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateColumn = useMutation({
    mutationFn: async (input: { id: string; name?: string; column_key?: string }) => {
      const { id, ...rest } = input;
      const { error } = await supabase.from("ehds_faq_data_columns").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteColumn = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ehds_faq_data_columns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { createColumn, updateColumn, deleteColumn };
}

export function useFaqDataRowMutations(tableId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["faq-data-rows", tableId] });

  const createRow = useMutation({
    mutationFn: async (input: { values: Record<string, string>; sort_order?: number }) => {
      const { error } = await supabase
        .from("ehds_faq_data_rows")
        .insert({ table_id: tableId, values: input.values, sort_order: input.sort_order || 0 });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateRow = useMutation({
    mutationFn: async (input: { id: string; values: Record<string, string> }) => {
      const { error } = await supabase.from("ehds_faq_data_rows").update({ values: input.values }).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteRow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ehds_faq_data_rows").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { createRow, updateRow, deleteRow };
}
