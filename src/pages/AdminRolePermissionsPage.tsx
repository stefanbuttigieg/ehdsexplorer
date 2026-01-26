import { useState } from 'react';
import { Shield, Check, X, Info, Plus } from 'lucide-react';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { AdminPageLayout, AdminPageLoading } from '@/components/admin/AdminPageLayout';
import { useRolePermissions, CONTENT_TYPES, ROLES, AppRole } from '@/hooks/useRolePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function AdminRolePermissionsPage() {
  const { shouldRender, loading, isSuperAdmin } = useAdminGuard({ requireSuperAdmin: true });
  const { 
    permissions, 
    permissionsByRole, 
    isLoading, 
    updatePermission,
    createPermission 
  } = useRolePermissions();
  
  const [selectedRole, setSelectedRole] = useState<AppRole>('admin');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newPermission, setNewPermission] = useState({
    role: 'editor' as AppRole,
    content_type: '',
    can_create: false,
    can_edit: false,
    can_delete: false,
    can_publish: false,
  });

  if (loading || isLoading) return <AdminPageLoading />;
  if (!shouldRender) return null;

  const rolePermissions = permissionsByRole[selectedRole] || [];
  
  // Get content types that don't have permissions for a role
  const missingContentTypes = CONTENT_TYPES.filter(
    ct => !permissions.find(p => p.role === newPermission.role && p.content_type === ct.id)
  );

  const handleTogglePermission = (
    permissionId: string,
    field: 'can_create' | 'can_edit' | 'can_delete' | 'can_publish',
    currentValue: boolean
  ) => {
    if (selectedRole === 'super_admin') {
      return; // Super admin permissions can't be changed
    }
    
    updatePermission.mutate({
      id: permissionId,
      [field]: !currentValue,
    });
  };

  const handleAddPermission = () => {
    if (!newPermission.content_type) return;
    
    createPermission.mutate(newPermission, {
      onSuccess: () => {
        setAddDialogOpen(false);
        setNewPermission({
          role: 'editor',
          content_type: '',
          can_create: false,
          can_edit: false,
          can_delete: false,
          can_publish: false,
        });
      },
    });
  };

  const getContentTypeLabel = (contentType: string) => {
    return CONTENT_TYPES.find(ct => ct.id === contentType)?.label || contentType;
  };

  const PermissionCell = ({ 
    enabled, 
    disabled,
    onToggle 
  }: { 
    enabled: boolean; 
    disabled?: boolean;
    onToggle: () => void;
  }) => (
    <div className="flex justify-center">
      {disabled ? (
        <Tooltip>
          <TooltipTrigger>
            <Check className="h-5 w-5 text-primary" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Super Admin has all permissions</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          disabled={updatePermission.isPending}
        />
      )}
    </div>
  );

  return (
    <AdminPageLayout
      title="Role Permissions"
      description="Manage granular permissions for each role"
      actions={
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Permission</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Permission</DialogTitle>
              <DialogDescription>
                Create a new permission for a role and content type combination.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newPermission.role}
                  onValueChange={(value: AppRole) => {
                    setNewPermission({ ...newPermission, role: value, content_type: '' });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.filter(r => r.id !== 'super_admin').map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content_type">Content Type</Label>
                <Select
                  value={newPermission.content_type}
                  onValueChange={(value) => setNewPermission({ ...newPermission, content_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    {missingContentTypes.map((ct) => (
                      <SelectItem key={ct.id} value={ct.id}>
                        {ct.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3">
                <Label>Permissions</Label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="can_create"
                      checked={newPermission.can_create}
                      onCheckedChange={(checked) =>
                        setNewPermission({ ...newPermission, can_create: !!checked })
                      }
                    />
                    <label htmlFor="can_create" className="text-sm">Create</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="can_edit"
                      checked={newPermission.can_edit}
                      onCheckedChange={(checked) =>
                        setNewPermission({ ...newPermission, can_edit: !!checked })
                      }
                    />
                    <label htmlFor="can_edit" className="text-sm">Edit</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="can_delete"
                      checked={newPermission.can_delete}
                      onCheckedChange={(checked) =>
                        setNewPermission({ ...newPermission, can_delete: !!checked })
                      }
                    />
                    <label htmlFor="can_delete" className="text-sm">Delete</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="can_publish"
                      checked={newPermission.can_publish}
                      onCheckedChange={(checked) =>
                        setNewPermission({ ...newPermission, can_publish: !!checked })
                      }
                    />
                    <label htmlFor="can_publish" className="text-sm">Publish</label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddPermission}
                disabled={!newPermission.content_type || createPermission.isPending}
              >
                Add Permission
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      {/* Role Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {ROLES.map((role) => {
          const rolePerms = permissionsByRole[role.id] || [];
          const totalPerms = rolePerms.length;
          const fullAccessCount = rolePerms.filter(
            p => p.can_create && p.can_edit && p.can_delete && p.can_publish
          ).length;
          
          return (
            <Card 
              key={role.id}
              className={`cursor-pointer transition-all ${
                selectedRole === role.id 
                  ? 'ring-2 ring-primary' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedRole(role.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {role.label}
                  </CardTitle>
                  {role.id === 'super_admin' && (
                    <Badge variant="secondary" className="text-xs">
                      Unrestricted
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs">
                  {role.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="font-medium">{totalPerms}</span>
                    <span className="text-muted-foreground ml-1">content types</span>
                  </div>
                  <div>
                    <span className="font-medium">{fullAccessCount}</span>
                    <span className="text-muted-foreground ml-1">full access</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Permissions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {ROLES.find(r => r.id === selectedRole)?.label} Permissions
              </CardTitle>
              <CardDescription>
                {selectedRole === 'super_admin' 
                  ? 'Super Admin has unrestricted access to all content types'
                  : 'Toggle permissions for each content type'
                }
              </CardDescription>
            </div>
            {selectedRole === 'super_admin' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                <span className="hidden sm:inline">Super Admin permissions cannot be modified</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Content Type</TableHead>
                  <TableHead className="text-center w-24">Create</TableHead>
                  <TableHead className="text-center w-24">Edit</TableHead>
                  <TableHead className="text-center w-24">Delete</TableHead>
                  <TableHead className="text-center w-24">Publish</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rolePermissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No permissions configured for this role
                    </TableCell>
                  </TableRow>
                ) : (
                  rolePermissions.map((perm) => (
                    <TableRow key={perm.id}>
                      <TableCell className="font-medium">
                        {getContentTypeLabel(perm.content_type)}
                      </TableCell>
                      <TableCell>
                        <PermissionCell
                          enabled={perm.can_create}
                          disabled={selectedRole === 'super_admin'}
                          onToggle={() => handleTogglePermission(perm.id, 'can_create', perm.can_create)}
                        />
                      </TableCell>
                      <TableCell>
                        <PermissionCell
                          enabled={perm.can_edit}
                          disabled={selectedRole === 'super_admin'}
                          onToggle={() => handleTogglePermission(perm.id, 'can_edit', perm.can_edit)}
                        />
                      </TableCell>
                      <TableCell>
                        <PermissionCell
                          enabled={perm.can_delete}
                          disabled={selectedRole === 'super_admin'}
                          onToggle={() => handleTogglePermission(perm.id, 'can_delete', perm.can_delete)}
                        />
                      </TableCell>
                      <TableCell>
                        <PermissionCell
                          enabled={perm.can_publish}
                          disabled={selectedRole === 'super_admin'}
                          onToggle={() => handleTogglePermission(perm.id, 'can_publish', perm.can_publish)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Permission Legend */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm">Permission Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">Create</Badge>
              <span className="text-muted-foreground">Add new items</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">Edit</Badge>
              <span className="text-muted-foreground">Modify existing items</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">Delete</Badge>
              <span className="text-muted-foreground">Remove items</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">Publish</Badge>
              <span className="text-muted-foreground">Make items public</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
}
