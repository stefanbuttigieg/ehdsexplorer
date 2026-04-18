import { useState } from 'react';
import { AdminPageLayout } from '@/components/admin/AdminPageLayout';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { useEuRegulationUpdates } from '@/hooks/useEuRegulationUpdates';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, ExternalLink, Eye, Trash2, Settings, Clock, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  reviewed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  dismissed: 'bg-muted text-muted-foreground',
  actioned: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

export default function AdminEuRegulationUpdatesPage() {
  const { shouldRender, isLoading: authLoading } = useAdminGuard({ requireAdmin: true });
  const {
    updates, isLoading, config, configLoading,
    updateStatus, deleteUpdate, updateConfig, triggerManualCheck, newCount,
  } = useEuRegulationUpdates();

  const [selectedUpdate, setSelectedUpdate] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [configCheckTimes, setConfigCheckTimes] = useState('');
  const [configTargetUrl, setConfigTargetUrl] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  if (authLoading || !shouldRender) return null;

  const filteredUpdates = statusFilter === 'all'
    ? updates
    : updates.filter(u => u.status === statusFilter);

  return (
    <AdminPageLayout
      title="EU Regulation Updates"
      description="Monitor changes on the EU Better Regulation page for EHDS dataset descriptions"
      actions={
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
          >
            <Settings className="h-4 w-4 mr-1" /> Settings
          </Button>
          <Button
            size="sm"
            onClick={() => triggerManualCheck.mutate()}
            disabled={triggerManualCheck.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${triggerManualCheck.isPending ? 'animate-spin' : ''}`} />
            Check Now
          </Button>
        </div>
      }
    >
      {/* Config Panel */}
      {showConfig && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" /> Check Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {configLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : config ? (
              <>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Enabled:</span>
                  <Switch
                    checked={config.is_enabled}
                    onCheckedChange={(checked) => updateConfig.mutate({ is_enabled: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" /> Target URL
                  </label>
                  <Input value={config.target_url} disabled className="text-xs" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Check Times (comma-separated, e.g. 08:00,12:00,18:00)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      defaultValue={config.check_times?.join(', ')}
                      onChange={(e) => setConfigCheckTimes(e.target.value)}
                      placeholder="08:00, 12:00, 18:00"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const times = configCheckTimes
                          .split(',')
                          .map(t => t.trim())
                          .filter(Boolean);
                        if (times.length > 0) updateConfig.mutate({ check_times: times });
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </div>
                {config.last_checked_at && (
                  <p className="text-xs text-muted-foreground">
                    Last checked: {format(new Date(config.last_checked_at), 'PPpp')}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No configuration found.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold">{updates.length}</div>
            <div className="text-xs text-muted-foreground">Total Updates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{newCount}</div>
            <div className="text-xs text-muted-foreground">New</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold text-green-600">
              {updates.filter(u => u.status === 'reviewed').length}
            </div>
            <div className="text-xs text-muted-foreground">Reviewed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {updates.filter(u => u.status === 'actioned').length}
            </div>
            <div className="text-xs text-muted-foreground">Actioned</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-medium">Filter:</span>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
            <SelectItem value="actioned">Actioned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Updates List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : filteredUpdates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {updates.length === 0
              ? 'No updates detected yet. Click "Check Now" to run the first check.'
              : 'No updates match the current filter.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredUpdates.map((update) => (
            <Card key={update.id} className={update.status === 'new' ? 'border-blue-300 dark:border-blue-700' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge className={statusColors[update.status] || ''}>
                        {update.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(update.detected_at), 'PPpp')}
                      </span>
                    </div>
                    <h3 className="font-medium text-sm truncate">{update.title}</h3>
                    {update.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {update.description}
                      </p>
                    )}
                    {update.review_notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        Notes: {update.review_notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => window.open(update.source_url, '_blank')}
                      title="Open source"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedUpdate(update);
                            setReviewNotes(update.review_notes || '');
                          }}
                          title="Review"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{update.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Badge className={statusColors[update.status] || ''}>
                              {update.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Detected: {format(new Date(update.detected_at), 'PPpp')}
                            </span>
                          </div>
                          {update.description && (
                            <p className="text-sm">{update.description}</p>
                          )}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Scraped Content Preview</label>
                            <div className="bg-muted p-3 rounded text-xs max-h-60 overflow-y-auto whitespace-pre-wrap">
                              {update.scraped_content?.substring(0, 3000) || 'No content'}
                              {(update.scraped_content?.length || 0) > 3000 && '...'}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Review Notes</label>
                            <Textarea
                              value={reviewNotes}
                              onChange={(e) => setReviewNotes(e.target.value)}
                              placeholder="Add notes about this update..."
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus.mutate({
                                id: update.id,
                                status: 'reviewed',
                                review_notes: reviewNotes,
                              })}
                            >
                              Mark Reviewed
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => updateStatus.mutate({
                                id: update.id,
                                status: 'actioned',
                                review_notes: reviewNotes,
                              })}
                            >
                              Mark Actioned
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateStatus.mutate({
                                id: update.id,
                                status: 'dismissed',
                                review_notes: reviewNotes,
                              })}
                            >
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteUpdate.mutate(update.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminPageLayout>
  );
}
