import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Users, ArrowLeft, Shield, ShieldCheck, Trash2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { format } from "date-fns";

interface UserWithRoles {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  roles: Array<{ id: string; role: "admin" | "editor" }>;
}

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [addRoleDialogOpen, setAddRoleDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<"admin" | "editor">("editor");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/admin/auth");
    }
  }, [user, isAdmin, authLoading, navigate]);

  // Fetch all profiles with their roles
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Then get all roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles: UserWithRoles[] = (profiles || []).map((profile) => ({
        id: profile.user_id,
        email: profile.email,
        display_name: profile.display_name,
        created_at: profile.created_at,
        roles: (roles || [])
          .filter((r) => r.user_id === profile.user_id)
          .map((r) => ({ id: r.id, role: r.role as "admin" | "editor" })),
      }));

      return usersWithRoles;
    },
    enabled: !!user && isAdmin,
  });

  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddRole = async () => {
    if (!selectedUserId) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("user_roles").insert({
        user_id: selectedUserId,
        role: selectedRole,
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Role already exists",
            description: "This user already has this role.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({ title: "Success", description: "Role added successfully" });
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        setAddRoleDialogOpen(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add role",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    if (!confirm("Are you sure you want to remove this role?")) return;

    try {
      const { error } = await supabase.from("user_roles").delete().eq("id", roleId);

      if (error) throw error;

      toast({ title: "Success", description: "Role removed successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove role",
        variant: "destructive",
      });
    }
  };

  const openAddRoleDialog = (userId: string) => {
    setSelectedUserId(userId);
    setSelectedRole("editor");
    setAddRoleDialogOpen(true);
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="p-6 max-w-4xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto animate-fade-in">
        <div className="mb-6">
          <Link to="/admin">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              <h1 className="text-2xl font-bold font-serif">User Management</h1>
            </div>
          </div>
          <p className="text-muted-foreground mt-1">
            Manage user roles and permissions
          </p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by email or name..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {searchQuery ? "No users match your search." : "No users found."}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((userItem) => (
              <Card key={userItem.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">
                          {userItem.display_name || userItem.email || "Unknown User"}
                        </h3>
                        {userItem.id === user?.id && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {userItem.email}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {userItem.roles.length === 0 ? (
                          <span className="text-sm text-muted-foreground">No special roles</span>
                        ) : (
                          userItem.roles.map((role) => (
                            <Badge
                              key={role.id}
                              variant={role.role === "admin" ? "default" : "secondary"}
                              className="flex items-center gap-1"
                            >
                              {role.role === "admin" ? (
                                <ShieldCheck className="h-3 w-3" />
                              ) : (
                                <Shield className="h-3 w-3" />
                              )}
                              {role.role}
                              {userItem.id !== user?.id && (
                                <button
                                  onClick={() => handleRemoveRole(role.id)}
                                  className="ml-1 hover:bg-background/20 rounded-full p-0.5"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </Badge>
                          ))
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Joined: {format(new Date(userItem.created_at), "PPp")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {userItem.id !== user?.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAddRoleDialog(userItem.id)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Role
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={addRoleDialogOpen} onOpenChange={setAddRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Role</DialogTitle>
              <DialogDescription>
                Assign a role to this user. Admins have full access, editors can manage content.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as "admin" | "editor")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Editor - Can manage content
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Admin - Full access
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddRoleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddRole} disabled={isSubmitting}>
                Add Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminUsersPage;
