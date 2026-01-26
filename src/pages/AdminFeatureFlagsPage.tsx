import { useState } from 'react';
import { ToggleLeft, ToggleRight, Plus, Trash2, Edit2, Flag } from 'lucide-react';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { AdminPageLayout, AdminPageLoading } from '@/components/admin/AdminPageLayout';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function AdminFeatureFlagsPage() {
  const { shouldRender, loading } = useAdminGuard({ requireSuperAdmin: true });
  const { flags, isLoading, toggleFlag, createFlag, deleteFlag, updateFlag } = useFeatureFlags();
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<{ id: string; name: string; description: string } | null>(null);
  const [newFlag, setNewFlag] = useState({ id: '', name: '', description: '' });

  if (loading || isLoading) return <AdminPageLoading />;
  if (!shouldRender) return null;

  const handleAddFlag = () => {
    if (!newFlag.id || !newFlag.name) return;
    
    // Convert name to snake_case for id if not provided
    const id = newFlag.id || newFlag.name.toLowerCase().replace(/\s+/g, '_');
    
    createFlag.mutate(
      { id, name: newFlag.name, description: newFlag.description || undefined },
      {
        onSuccess: () => {
          setAddDialogOpen(false);
          setNewFlag({ id: '', name: '', description: '' });
        },
      }
    );
  };

  const handleEditFlag = () => {
    if (!editingFlag) return;
    
    updateFlag.mutate(
      { id: editingFlag.id, name: editingFlag.name, description: editingFlag.description },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setEditingFlag(null);
        },
      }
    );
  };

  const enabledCount = flags.filter(f => f.is_enabled).length;
  const disabledCount = flags.filter(f => !f.is_enabled).length;

  return (
    <AdminPageLayout
      title="Feature Flags"
      description="Toggle features on/off across the site"
      actions={
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 px-2 sm:px-3">
              <Plus className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline text-xs">Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Feature Flag</DialogTitle>
              <DialogDescription>
                Create a new feature flag to control site functionality.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="flag-id">ID (snake_case)</Label>
                <Input
                  id="flag-id"
                  placeholder="e.g. new_feature"
                  value={newFlag.id}
                  onChange={(e) => setNewFlag({ ...newFlag, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="flag-name">Display Name</Label>
                <Input
                  id="flag-name"
                  placeholder="e.g. New Feature"
                  value={newFlag.name}
                  onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="flag-description">Description</Label>
                <Textarea
                  id="flag-description"
                  placeholder="What does this feature do?"
                  value={newFlag.description}
                  onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddFlag}
                disabled={!newFlag.id || !newFlag.name || createFlag.isPending}
              >
                Add Flag
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Total Flags</CardDescription>
            <CardTitle className="text-2xl">{flags.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs flex items-center gap-1">
              <ToggleRight className="h-3 w-3 text-primary" /> Enabled
            </CardDescription>
            <CardTitle className="text-2xl text-primary">{enabledCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs flex items-center gap-1">
              <ToggleLeft className="h-3 w-3 text-muted-foreground" /> Disabled
            </CardDescription>
            <CardTitle className="text-2xl text-muted-foreground">{disabledCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Feature Flags List */}
      <div className="grid gap-3">
        {flags.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Flag className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No Feature Flags</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first feature flag to start controlling site features.
              </p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Feature Flag
              </Button>
            </CardContent>
          </Card>
        ) : (
          flags.map((flag) => (
            <Card key={flag.id} className={!flag.is_enabled ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium">{flag.name}</h3>
                      <Badge variant={flag.is_enabled ? 'default' : 'secondary'} className="text-xs">
                        {flag.is_enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded hidden sm:inline">
                        {flag.id}
                      </code>
                    </div>
                    {flag.description && (
                      <p className="text-sm text-muted-foreground mt-1">{flag.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingFlag({ id: flag.id, name: flag.name, description: flag.description || '' });
                        setEditDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Feature Flag?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the "{flag.name}" feature flag.
                            Make sure no code is still using this flag.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteFlag.mutate(flag.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Switch
                      checked={flag.is_enabled}
                      onCheckedChange={(checked) => toggleFlag.mutate({ id: flag.id, is_enabled: checked })}
                      disabled={toggleFlag.isPending}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Feature Flag</DialogTitle>
            <DialogDescription>
              Update the display name and description.
            </DialogDescription>
          </DialogHeader>
          {editingFlag && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>ID</Label>
                <code className="text-sm bg-muted px-2 py-1 rounded">{editingFlag.id}</code>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Display Name</Label>
                <Input
                  id="edit-name"
                  value={editingFlag.name}
                  onChange={(e) => setEditingFlag({ ...editingFlag, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingFlag.description}
                  onChange={(e) => setEditingFlag({ ...editingFlag, description: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditFlag} disabled={updateFlag.isPending}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
}
