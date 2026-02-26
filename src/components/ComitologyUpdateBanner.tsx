import { useState } from "react";
import { ExternalLink, RefreshCw, ChevronDown, ChevronUp, Newspaper, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLatestComitologyUpdate, useRefreshComitologyUpdate } from "@/hooks/useComitologyUpdates";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";

export const ComitologyUpdateBanner = () => {
  const { data: update, isLoading } = useLatestComitologyUpdate();
  const refreshMutation = useRefreshComitologyUpdate();
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (isLoading) return null;

  return (
    <Card className="mb-6 border-accent/30 bg-accent/5">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Newspaper className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-semibold text-sm">EU Comitology Register — Latest Update</span>
                {update && (
                  <Badge variant="outline" className="text-xs">
                    {formatDistanceToNow(new Date(update.scraped_at), { addSuffix: true })}
                  </Badge>
                )}
              </div>

              {update ? (
                <>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {update.summary?.split('\n').slice(0, 2).join(' ').substring(0, 200)}
                    {(update.summary?.length || 0) > 200 ? '…' : ''}
                  </p>

                  {expanded && update.scraped_content && (
                    <div className="mt-3 prose prose-sm max-w-none dark:prose-invert max-h-64 overflow-y-auto border rounded-md p-3 bg-background">
                      <ReactMarkdown>
                        {update.scraped_content}
                      </ReactMarkdown>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setExpanded(!expanded)}
                    >
                      {expanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                      {expanded ? 'Collapse' : 'View Full Update'}
                    </Button>
                    {update.source_url && (
                      <a href={update.source_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open Register
                        </Button>
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => refreshMutation.mutate()}
                      disabled={refreshMutation.isPending}
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
                      {refreshMutation.isPending ? 'Refreshing…' : 'Refresh'}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground">No updates scraped yet.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => refreshMutation.mutate()}
                    disabled={refreshMutation.isPending}
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
                    {refreshMutation.isPending ? 'Fetching…' : 'Fetch Latest'}
                  </Button>
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0 opacity-60 hover:opacity-100"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
