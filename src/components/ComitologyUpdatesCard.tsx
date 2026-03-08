import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, RefreshCw, Calendar, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ComitologyMeeting {
  meeting_code: string;
  title: string;
  date: string;
  committee: string;
  url: string;
}

export function ComitologyUpdatesCard() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: updates = [], refetch } = useQuery({
    queryKey: ['comitology-updates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comitology_updates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

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

  // Parse scraped_content to get structured meeting data
  const meetings: ComitologyMeeting[] = updates
    .map(u => {
      try {
        return JSON.parse(u.scraped_content || '{}') as ComitologyMeeting;
      } catch {
        return null;
      }
    })
    .filter((m): m is ComitologyMeeting => m !== null && !!m.meeting_code);

  return (
    <Card className="mb-6 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            EHDS Committee Meetings
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
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
        {meetings.length > 0 ? (
          <div className="space-y-2">
            {meetings.map((m, i) => (
              <a
                key={i}
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {m.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
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
            <p>No committee meetings loaded yet.</p>
            <Button variant="link" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              Click to fetch latest updates
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
