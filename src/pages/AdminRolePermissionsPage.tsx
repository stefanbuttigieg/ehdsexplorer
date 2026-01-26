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
            <Button size="sm" className="h-8 px-2 sm:px-3">
              <Plus className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline text-xs">Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg">
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
      {/* Role Overview Cards - Horizontal scroll on mobile */}
      <div className="flex gap-3 overflow-x-auto pb-2 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:overflow-visible">
        {ROLES.map((role) => {
          const rolePerms = permissionsByRole[role.id] || [];
          const totalPerms = rolePerms.length;
          const fullAccessCount = rolePerms.filter(
            p => p.can_create && p.can_edit && p.can_delete && p.can_publish
          ).length;
          
          return (
            <Card 
              key={role.id}
              className={`cursor-pointer transition-all flex-shrink-0 w-[200px] sm:w-auto ${
                selectedRole === role.id 
                  ? 'ring-2 ring-primary' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedRole(role.id)}
            >
              <CardHeader className="p-3 sm:p-4 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm sm:text-base flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">{role.label}</span>
                  </CardTitle>
                  {role.id === 'super_admin' && (
                    <span className="text-[10px] sm:text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-md whitespace-nowrap">
                      Unrestricted
                    </span>
                  )}
                </div>
                <CardDescription className="text-[10px] sm:text-xs line-clamp-2">
                  {role.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="flex gap-3 text-xs sm:text-sm">
                  <div>
                    <span className="font-medium">{totalPerms}</span>
                    <span className="text-muted-foreground ml-1">types</span>
                  </div>
                  <div>
                    <span className="font-medium">{fullAccessCount}</span>
                    <span className="text-muted-foreground ml-1">full</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Permissions Table */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                {ROLES.find(r => r.id === selectedRole)?.label} Permissions
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {selectedRole === 'super_admin' 
                  ? 'Super Admin has unrestricted access'
                  : 'Toggle permissions for each content type'
                }
              </CardDescription>
            </div>
            {selectedRole === 'super_admin' && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Cannot be modified</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px] sm:min-w-[150px] text-xs sm:text-sm pl-4 sm:pl-4">Content Type</TableHead>
                  <TableHead className="text-center w-16 sm:w-24 text-xs sm:text-sm">Create</TableHead>
                  <TableHead className="text-center w-16 sm:w-24 text-xs sm:text-sm">Edit</TableHead>
                  <TableHead className="text-center w-16 sm:w-24 text-xs sm:text-sm">Delete</TableHead>
                  <TableHead className="text-center w-16 sm:w-24 text-xs sm:text-sm pr-4 sm:pr-4">Publish</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rolePermissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8 text-sm">
                      No permissions configured for this role
                    </TableCell>
                  </TableRow>
                ) : (
                  rolePermissions.map((perm) => (
                    <TableRow key={perm.id}>
                      <TableCell className="font-medium text-xs sm:text-sm pl-4 sm:pl-4">
                        {getContentTypeLabel(perm.content_type)}
                      </TableCell>
                      <TableCell className="p-2 sm:p-4">
                        <PermissionCell
                          enabled={perm.can_create}
                          disabled={selectedRole === 'super_admin'}
                          onToggle={() => handleTogglePermission(perm.id, 'can_create', perm.can_create)}
                        />
                      </TableCell>
                      <TableCell className="p-2 sm:p-4">
                        <PermissionCell
                          enabled={perm.can_edit}
                          disabled={selectedRole === 'super_admin'}
                          onToggle={() => handleTogglePermission(perm.id, 'can_edit', perm.can_edit)}
                        />
                      </TableCell>
                      <TableCell className="p-2 sm:p-4">
                        <PermissionCell
                          enabled={perm.can_delete}
                          disabled={selectedRole === 'super_admin'}
                          onToggle={() => handleTogglePermission(perm.id, 'can_delete', perm.can_delete)}
                        />
                      </TableCell>
                      <TableCell className="p-2 sm:p-4 pr-4 sm:pr-4">
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

      {/* Permission Legend - Hidden on mobile to save space */}
      <Card className="mt-4 sm:mt-6 hidden sm:block">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xs sm:text-sm">Permission Types</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5">
              <span className="border rounded px-1.5 py-0.5 text-[10px] sm:text-xs">Create</span>
              <span className="text-muted-foreground">Add new</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="border rounded px-1.5 py-0.5 text-[10px] sm:text-xs">Edit</span>
              <span className="text-muted-foreground">Modify</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="border rounded px-1.5 py-0.5 text-[10px] sm:text-xs">Delete</span>
              <span className="text-muted-foreground">Remove</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="border rounded px-1.5 py-0.5 text-[10px] sm:text-xs">Publish</span>
              <span className="text-muted-foreground">Make public</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
}
