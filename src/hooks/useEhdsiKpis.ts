import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EhdsiKpiStaging {
  id: string;
  country_code: string;
  country_name: string;
  kpi_id: string;
  kpi_name: string;
  kpi_category: string;
  value: number | null;
  unit: string | null;
  reference_date: string | null;
  raw_data: Record<string, unknown> | null;
  source_url: string | null;
  fetched_at: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EhdsiKpiData {
  id: string;
  country_code: string;
  country_name: string;
  kpi_id: string;
  kpi_name: string;
  kpi_category: string;
  value: number | null;
  unit: string | null;
  reference_date: string | null;
  raw_data: Record<string, unknown> | null;
  source_url: string | null;
  approved_at: string;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EhdsiSyncHistory {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: "running" | "completed" | "failed";
  records_fetched: number;
  records_new: number;
  error_message: string | null;
  triggered_by: string;
}

export const useEhdsiStagingData = (status?: "pending" | "approved" | "rejected") => {
  return useQuery({
    queryKey: ["ehdsi-staging", status],
    queryFn: async () => {
      let query = supabase
        .from("ehdsi_kpi_staging")
        .select("*")
        .order("fetched_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as EhdsiKpiStaging[];
    },
  });
};

export const useEhdsiPublishedData = () => {
  return useQuery({
    queryKey: ["ehdsi-published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ehdsi_kpi_data")
        .select("*")
        .order("country_name");

      if (error) throw error;
      return data as EhdsiKpiData[];
    },
  });
};

export const useEhdsiSyncHistory = () => {
  return useQuery({
    queryKey: ["ehdsi-sync-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ehdsi_sync_history")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as EhdsiSyncHistory[];
    },
  });
};

export const useApproveKpiData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      stagingIds,
      userId,
    }: {
      stagingIds: string[];
      userId: string;
    }) => {
      // Get staging records
      const { data: stagingRecords, error: fetchError } = await supabase
        .from("ehdsi_kpi_staging")
        .select("*")
        .in("id", stagingIds);

      if (fetchError) throw fetchError;
      if (!stagingRecords?.length) throw new Error("No records found");

      // Insert into published table
      const publishRecords = stagingRecords.map((r) => ({
        country_code: r.country_code,
        country_name: r.country_name,
        kpi_id: r.kpi_id,
        kpi_name: r.kpi_name,
        kpi_category: r.kpi_category,
        value: r.value,
        unit: r.unit,
        reference_date: r.reference_date,
        raw_data: r.raw_data,
        source_url: r.source_url,
        approved_by: userId,
      }));

      const { error: insertError } = await supabase
        .from("ehdsi_kpi_data")
        .upsert(publishRecords, {
          onConflict: "country_code,kpi_id,reference_date",
        });

      if (insertError) throw insertError;

      // Update staging status
      const { error: updateError } = await supabase
        .from("ehdsi_kpi_staging")
        .update({
          status: "approved",
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
        })
        .in("id", stagingIds);

      if (updateError) throw updateError;

      return { approved: stagingIds.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ehdsi-staging"] });
      queryClient.invalidateQueries({ queryKey: ["ehdsi-published"] });
    },
  });
};

export const useRejectKpiData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      stagingIds,
      userId,
      notes,
    }: {
      stagingIds: string[];
      userId: string;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from("ehdsi_kpi_staging")
        .update({
          status: "rejected",
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
          review_notes: notes,
        })
        .in("id", stagingIds);

      if (error) throw error;
      return { rejected: stagingIds.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ehdsi-staging"] });
    },
  });
};

export const useTriggerEhdsiSync = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("sync-ehdsi-kpis", {
        body: { manual: true },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ehdsi-staging"] });
      queryClient.invalidateQueries({ queryKey: ["ehdsi-sync-history"] });
    },
  });
};

// Helper to get KPI data by country
export const getKpisByCountry = (
  data: EhdsiKpiData[],
  countryCode: string
): EhdsiKpiData[] => {
  return data.filter((d) => d.country_code === countryCode);
};

// Helper to get latest value for a specific KPI
export const getLatestKpiValue = (
  data: EhdsiKpiData[],
  countryCode: string,
  kpiId: string
): number | null => {
  const record = data.find(
    (d) => d.country_code === countryCode && d.kpi_id === kpiId
  );
  return record?.value ?? null;
};
