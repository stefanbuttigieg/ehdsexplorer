import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ApiLog {
  id: string;
  api_key_id: string | null;
  user_id: string | null;
  endpoint: string;
  method: string;
  country_code: string | null;
  obligation_id: string | null;
  status_code: number;
  response_message: string | null;
  ip_address: string | null;
  user_agent: string | null;
  request_body: Record<string, unknown> | null;
  created_at: string;
}

export interface ApiLogWithDetails extends ApiLog {
  profile?: {
    display_name: string | null;
    email: string | null;
  };
  api_key?: {
    name: string;
    key_prefix: string;
  };
}

export const useApiLogs = (filters?: {
  userId?: string;
  apiKeyId?: string;
  statusCode?: number;
  limit?: number;
}) => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const limit = filters?.limit || 100;

  // Fetch logs (admin sees all, users see their own)
  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['api-logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('api_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters?.apiKeyId) {
        query = query.eq('api_key_id', filters.apiKeyId);
      }

      if (filters?.statusCode) {
        query = query.eq('status_code', filters.statusCode);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch additional details for each log
      const logsWithDetails: ApiLogWithDetails[] = await Promise.all(
        (data || []).map(async (log) => {
          let profile = undefined;
          let apiKey = undefined;

          if (log.user_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('display_name, email')
              .eq('user_id', log.user_id)
              .maybeSingle();
            profile = profileData || undefined;
          }

          if (log.api_key_id) {
            const { data: keyData } = await supabase
              .from('api_keys')
              .select('name, key_prefix')
              .eq('id', log.api_key_id)
              .maybeSingle();
            apiKey = keyData || undefined;
          }

          return {
            ...log,
            profile,
            api_key: apiKey,
          } as ApiLogWithDetails;
        })
      );

      return logsWithDetails;
    },
    enabled: !!user,
  });

  // Get log statistics
  const { data: stats } = useQuery({
    queryKey: ['api-logs-stats'],
    queryFn: async () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get counts for different time periods
      const { data: last24h } = await supabase
        .from('api_logs')
        .select('id', { count: 'exact' })
        .gte('created_at', oneDayAgo.toISOString());

      const { data: lastWeek } = await supabase
        .from('api_logs')
        .select('id', { count: 'exact' })
        .gte('created_at', oneWeekAgo.toISOString());

      const { data: errors24h } = await supabase
        .from('api_logs')
        .select('id', { count: 'exact' })
        .gte('created_at', oneDayAgo.toISOString())
        .gte('status_code', 400);

      return {
        requestsLast24h: last24h?.length || 0,
        requestsLastWeek: lastWeek?.length || 0,
        errorsLast24h: errors24h?.length || 0,
      };
    },
    enabled: !!user && (isAdmin || isSuperAdmin),
  });

  return {
    logs,
    isLoading,
    refetch,
    stats,
    isAdmin: isAdmin || isSuperAdmin,
  };
};
