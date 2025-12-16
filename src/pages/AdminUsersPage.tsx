import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Users, ArrowLeft, Shield, ShieldCheck, Trash2, Plus, Search, Mail, Clock, AlertCircle, CheckCircle2, XCircle, RefreshCw, TestTube2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { format } from "date-fns";

type AppRole = "super_admin" | "admin" | "editor";

interface UserWithRoles {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  roles: Array<{ id: string; role: AppRole }>;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [addRoleDialogOpen, setAddRoleDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("editor");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("editor");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/admin/auth");
    }
  }, [user, isAdmin, authLoading, navigate]);

  // Fetch all profiles with their roles
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRoles[] = (profiles || []).map((profile) => ({
        id: profile.user_id,
        email: profile.email,
        display_name: profile.display_name,
        created_at: profile.created_at,
        roles: (roles || [])
          .filter((r) => r.user_id === profile.user_id)
          .map((r) => ({ id: r.id, role: r.role as AppRole })),
      }));

      return usersWithRoles;
    },
    enabled: !!user && isAdmin,
  });

  // Fetch invitations
  const { data: invitations = [], isLoading: invitationsLoading, refetch: refetchInvitations } = useQuery({
    queryKey: ["admin-invitations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_invitations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Invitation[];
    },
    enabled: !!user && isAdmin,
  });

  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInvitations = invitations.filter(
    (inv) => inv.email.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({ title: "Error", description: "Email is required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-invite", {
        body: {
          email: inviteEmail.trim(),
          role: inviteRole,
          inviterEmail: user?.email || "Admin",
        },
      });

      if (error) throw error;

      // Check if email failed but invitation was created
      if (data && !data.success && data.invitationId) {
        toast({
          title: "Invitation created",
          description: data.message || "Email delivery failed - please verify your Resend domain.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Invitation sent!",
          description: `An invitation email has been sent to ${inviteEmail}`,
        });
      }

      // Refresh invitations list
      queryClient.invalidateQueries({ queryKey: ["admin-invitations"] });
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("editor");
    } catch (error: any) {
      console.error("Invite error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    if (!confirm("Are you sure you want to delete this invitation?")) return;

    try {
      const { error } = await supabase
        .from("user_invitations")
        .delete()
        .eq("id", invitationId);

      if (error) throw error;

      toast({ title: "Success", description: "Invitation deleted" });
      queryClient.invalidateQueries({ queryKey: ["admin-invitations"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete invitation",
        variant: "destructive",
      });
    }
  };

  const handleResendInvitation = async (invitation: Invitation) => {
    setIsSubmitting(true);
    try {
      // First delete the old invitation
      await supabase.from("user_invitations").delete().eq("id", invitation.id);

      // Then send a new one
      const { data, error } = await supabase.functions.invoke("send-invite", {
        body: {
          email: invitation.email,
          role: invitation.role,
          inviterEmail: user?.email || "Admin",
        },
      });

      if (error) throw error;

      if (data && !data.success) {
        toast({
          title: "Invitation created",
          description: data.message || "Email delivery failed - please verify your Resend domain.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Invitation resent!",
          description: `A new invitation has been sent to ${invitation.email}`,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["admin-invitations"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend invitation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestEmail = async () => {
    setIsTestingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("test-email");

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Test email sent!",
          description: data.message || `Check your inbox at ${user?.email}`,
        });
      } else {
        toast({
          title: "Email test failed",
          description: data?.error || "Email delivery failed. Please verify your Resend domain at resend.com/domains",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Test email error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send test email",
        variant: "destructive",
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Sent
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="outline" className="border-green-600 text-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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

  const pendingInvitations = invitations.filter(inv => inv.status !== "accepted");
  const failedInvitations = invitations.filter(inv => inv.status === "failed");

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
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handleTestEmail}
                disabled={isTestingEmail}
              >
                <TestTube2 className="h-4 w-4 mr-2" />
                {isTestingEmail ? "Sending..." : "Test Email"}
              </Button>
              <Button onClick={() => setInviteDialogOpen(true)}>
                <Mail className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground mt-1">
            Manage user roles and pending invitations
          </p>
        </div>

        {/* Warning about failed invitations */}
        {failedInvitations.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Email Delivery Issue</AlertTitle>
            <AlertDescription>
              {failedInvitations.length} invitation(s) failed to send. This is likely because your Resend domain is not verified. 
              Please visit <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="underline font-medium">resend.com/domains</a> to verify your domain.
            </AlertDescription>
          </Alert>
        )}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users or invitations by email..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">
              Active Users
              <Badge variant="secondary" className="ml-2">{users.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="invitations">
              Invitations
              {pendingInvitations.length > 0 && (
                <Badge variant="default" className="ml-2">{pendingInvitations.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
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
                                  variant={role.role === "super_admin" ? "destructive" : role.role === "admin" ? "default" : "secondary"}
                                  className="flex items-center gap-1"
                                >
                                  {role.role === "super_admin" ? (
                                    <ShieldCheck className="h-3 w-3" />
                                  ) : role.role === "admin" ? (
                                    <ShieldCheck className="h-3 w-3" />
                                  ) : (
                                    <Shield className="h-3 w-3" />
                                  )}
                                  {role.role === "super_admin" ? "Super Admin" : role.role}
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
          </TabsContent>

          <TabsContent value="invitations">
            <div className="flex justify-end mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetchInvitations()}
                disabled={invitationsLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${invitationsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {invitationsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : filteredInvitations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  {searchQuery ? "No invitations match your search." : "No invitations sent yet."}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredInvitations.map((invitation) => (
                  <Card key={invitation.id} className={invitation.status === "failed" ? "border-destructive/50" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{invitation.email}</h3>
                            {getStatusBadge(invitation.status)}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {invitation.role === "super_admin" ? (
                                <ShieldCheck className="h-3 w-3 mr-1" />
                              ) : invitation.role === "admin" ? (
                                <ShieldCheck className="h-3 w-3 mr-1" />
                              ) : (
                                <Shield className="h-3 w-3 mr-1" />
                              )}
                              {invitation.role === "super_admin" ? "Super Admin" : invitation.role}
                            </Badge>
                          </div>
                          {invitation.error_message && (
                            <p className="text-sm text-destructive mb-2">
                              Error: {invitation.error_message}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Invited: {format(new Date(invitation.created_at), "PPp")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {invitation.status === "failed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResendInvitation(invitation)}
                              disabled={isSubmitting}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Resend
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteInvitation(invitation.id)}
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
          </TabsContent>
        </Tabs>

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
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
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
                    {isSuperAdmin && (
                      <SelectItem value="super_admin">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-destructive" />
                          Super Admin - System control
                        </div>
                      </SelectItem>
                    )}
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

        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite User</DialogTitle>
              <DialogDescription>
                Send an email invitation to a new user to join the admin team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="invite-role">Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
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
                    {isSuperAdmin && (
                      <SelectItem value="super_admin">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-destructive" />
                          Super Admin - System control
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendInvite} disabled={isSubmitting}>
                <Mail className="h-4 w-4 mr-2" />
                {isSubmitting ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminUsersPage;
