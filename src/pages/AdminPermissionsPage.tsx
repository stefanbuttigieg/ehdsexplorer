import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Check, X, Loader2, Info } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRolePermissions, useUpdateRolePermission, CONTENT_TYPES, ROLES, AppRole } from '@/hooks/useRolePermissions';

const AdminPermissionsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, isSuperAdmin } = useAuth();
  const { data: permissions, isLoading } = useRolePermissions();
  const updateMutation = useUpdateRolePermission();
  const [selectedRole, setSelectedRole] = useState<AppRole>('admin');

  if (authLoading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (!user || !isSuperAdmin) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Role Permissions</h1>
          </div>
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Only Super Admins can manage role permissions. Contact a Super Admin if you need access.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  const rolePermissions = permissions?.filter(p => p.role === selectedRole) || [];

  const handleTogglePermission = async (
    permissionId: string,
    field: 'can_create' | 'can_edit' | 'can_delete' | 'can_publish',
    currentValue: boolean
  ) => {
    try {
      await updateMutation.mutateAsync({
        id: permissionId,
        [field]: !currentValue,
      });
      toast({
        title: "Permission Updated",
        description: "The permission has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPermissionForContentType = (contentType: string) => {
    return rolePermissions.find(p => p.content_type === contentType);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Role Permissions</h1>
            <p className="text-muted-foreground">Configure what each role can do</p>
          </div>
        </div>

        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Super Admins</strong> always have full access to everything including user management and system settings. 
            This page configures permissions for <strong>Admin</strong> and <strong>Editor</strong> roles only.
          </AlertDescription>
        </Alert>

        <Tabs value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            {ROLES.filter(r => r.id !== 'super_admin').map((role) => (
              <TabsTrigger key={role.id} value={role.id} className="gap-2">
                <Shield className="h-4 w-4" />
                {role.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {ROLES.filter(r => r.id !== 'super_admin').map((role) => (
            <TabsContent key={role.id} value={role.id}>
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {role.label}
                    <Badge variant="outline">{role.id}</Badge>
                  </CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
              </Card>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-4 font-medium">Content Type</th>
                            <th className="text-center p-4 font-medium w-24">Create</th>
                            <th className="text-center p-4 font-medium w-24">Edit</th>
                            <th className="text-center p-4 font-medium w-24">Delete</th>
                            <th className="text-center p-4 font-medium w-24">Publish</th>
                          </tr>
                        </thead>
                        <tbody>
                          {CONTENT_TYPES.map((contentType) => {
                            const permission = getPermissionForContentType(contentType.id);
                            if (!permission) return null;
                            
                            return (
                              <tr key={contentType.id} className="border-b last:border-0 hover:bg-muted/50">
                                <td className="p-4 font-medium">{contentType.label}</td>
                                <td className="text-center p-4">
                                  <Switch
                                    checked={permission.can_create}
                                    onCheckedChange={() => handleTogglePermission(permission.id, 'can_create', permission.can_create)}
                                    disabled={updateMutation.isPending}
                                  />
                                </td>
                                <td className="text-center p-4">
                                  <Switch
                                    checked={permission.can_edit}
                                    onCheckedChange={() => handleTogglePermission(permission.id, 'can_edit', permission.can_edit)}
                                    disabled={updateMutation.isPending}
                                  />
                                </td>
                                <td className="text-center p-4">
                                  <Switch
                                    checked={permission.can_delete}
                                    onCheckedChange={() => handleTogglePermission(permission.id, 'can_delete', permission.can_delete)}
                                    disabled={updateMutation.isPending}
                                  />
                                </td>
                                <td className="text-center p-4">
                                  <Switch
                                    checked={permission.can_publish}
                                    onCheckedChange={() => handleTogglePermission(permission.id, 'can_publish', permission.can_publish)}
                                    disabled={updateMutation.isPending}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminPermissionsPage;
