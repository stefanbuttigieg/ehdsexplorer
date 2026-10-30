import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, RefreshCw, Calendar, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { newestMeetings, isMeetingCacheStale, MEETING_PREVIEW_LIMIT } from '@/lib/comitology-meetings';

export function ComitologyUpdatesCard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoFetched, setAutoFetched] = useState(false);

  const { data: updates = [], refetch, isLoading } = useQuery({
    queryKey: ['comitology-updates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comitology_updates')
        .select('*')
        .like('source_url', 'https://ec.europa.eu/transparency/comitology-register/screen/meetings/%')
        .order('scraped_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const isStale = isMeetingCacheStale(updates);

  const handleRefreshSilent = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-comitology');
      if (!error && data?.success) {
        await refetch();
      }
    } catch {
      // Silent fail for auto-fetch
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // Auto-refresh if stale, only once per mount
  useEffect(() => {
    if (isStale && !isRefreshing && !autoFetched && !isLoading) {
      setAutoFetched(true);
      handleRefreshSilent();
    }
  }, [isStale, isRefreshing, autoFetched, isLoading, handleRefreshSilent]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-comitology');
      if (error) throw error;
      if (data?.success) {
        toast.success(`Found ${data.data?.total || 0} committee meetings`);
        await refetch();
      } else {
        throw new Error(data?.error || 'Failed to scrape');
      }
    } catch (err) {
      toast.error('Failed to fetch updates: ' + (err as Error).message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const allMeetings = newestMeetings(updates);
  const meetings = allMeetings.slice(0, MEETING_PREVIEW_LIMIT);

  return (
    <Card className="mb-6 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            EHDS Committee Meetings
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} aria-label="Refresh committee meetings" title="Refresh committee meetings">
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <a
              href="https://ec.europa.eu/transparency/comitology-register/screen/committees/C131500"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                Full Register <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </a>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {allMeetings.length > 0 && <p className="text-xs text-muted-foreground mb-2">Latest {meetings.length} of {allMeetings.length} meetings</p>}
        {meetings.length > 0 ? (
          <div className="space-y-2">
            {meetings.map(m => (
              <a
                key={m.meeting_code}
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium break-words group-hover:text-primary transition-colors">
                    {m.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-xs">{m.meeting_code}</Badge>
                    <span className="text-xs text-muted-foreground">{m.date}</span>
                  </div>
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground">
            {isRefreshing || isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading committee meetings…</span>
              </div>
            ) : (
              <p>No committee meetings found. <Button variant="link" size="sm" onClick={handleRefresh} className="px-0">Refresh</Button></p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
