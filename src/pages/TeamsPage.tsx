import { useState } from "react";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTeams, useTeamMembers, TeamRole, TeamWithMembership } from "@/hooks/useTeams";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Users, Settings, MoreVertical, UserPlus, Crown, Shield, User, Eye, LogOut, Trash2, Pencil, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import TeamActivityFeed from "@/components/TeamActivityFeed";

const roleIcons: Record<TeamRole, React.ElementType> = {
  owner: Crown,
  admin: Shield,
  member: User,
  viewer: Eye,
};

const roleLabels: Record<TeamRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

const roleBadgeVariants: Record<TeamRole, "default" | "secondary" | "outline"> = {
  owner: "default",
  admin: "secondary",
  member: "outline",
  viewer: "outline",
};

const TeamsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { teams, teamsLoading, createTeam, updateTeam, deleteTeam } = useTeams();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamWithMembership | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamWithMembership | null>(null);
  const [deleteConfirmTeam, setDeleteConfirmTeam] = useState<TeamWithMembership | null>(null);
  
  // Create team form
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");

  // Invite member form
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("member");

  const { 
    members, 
    membersLoading, 
    inviteMember, 
    updateMemberRole, 
    removeMember, 
    leaveTeam,
    currentUserId 
  } = useTeamMembers(selectedTeam?.id || null);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    
    await createTeam.mutateAsync({
      name: newTeamName.trim(),
      description: newTeamDescription.trim() || undefined,
    });
    
    setNewTeamName("");
    setNewTeamDescription("");
    setCreateDialogOpen(false);
  };

  const handleUpdateTeam = async () => {
    if (!editingTeam || !newTeamName.trim()) return;
    
    await updateTeam.mutateAsync({
      id: editingTeam.id,
      name: newTeamName.trim(),
      description: newTeamDescription.trim() || undefined,
    });
    
    setNewTeamName("");
    setNewTeamDescription("");
    setEditingTeam(null);
  };

  const handleDeleteTeam = async () => {
    if (!deleteConfirmTeam) return;
    await deleteTeam.mutateAsync(deleteConfirmTeam.id);
    setDeleteConfirmTeam(null);
    if (selectedTeam?.id === deleteConfirmTeam.id) {
      setSelectedTeam(null);
    }
  };

  const handleInviteMember = async () => {
    if (!selectedTeam || !inviteEmail.trim()) return;
    
    await inviteMember.mutateAsync({
      teamId: selectedTeam.id,
      email: inviteEmail.trim(),
      role: inviteRole,
    });
    
    setInviteEmail("");
    setInviteRole("member");
    setInviteDialogOpen(false);
  };

  const canManageTeam = (team: TeamWithMembership) => {
    return team.membership?.role === 'owner' || team.membership?.role === 'admin';
  };

  const canDeleteTeam = (team: TeamWithMembership) => {
    return team.membership?.role === 'owner';
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container max-w-6xl py-8">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <Helmet>
          <title>Teams - EHDS Explorer</title>
        </Helmet>
        <div className="container max-w-6xl py-8">
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Sign in to access Teams</h2>
              <p className="text-muted-foreground mb-4">
                Create and join teams to collaborate on annotations, notes, and bookmarks.
              </p>
              <Link to="/admin/auth">
                <Button>Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>Teams - EHDS Explorer</title>
        <meta name="description" content="Manage your teams and collaborate with others" />
      </Helmet>

      <div className="container max-w-6xl py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Teams</h1>
            <p className="text-muted-foreground">Create and manage collaborative workspaces</p>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Team</DialogTitle>
                <DialogDescription>
                  Teams allow you to collaborate on annotations, notes, and bookmarks with others.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input
                    id="team-name"
                    placeholder="Enter team name"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-description">Description (optional)</Label>
                  <Textarea
                    id="team-description"
                    placeholder="What is this team for?"
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTeam} disabled={!newTeamName.trim() || createTeam.isPending}>
                  {createTeam.isPending ? "Creating..." : "Create Team"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {teamsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : teams.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No teams yet</h2>
              <p className="text-muted-foreground mb-4">
                Create your first team to start collaborating with others.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Team
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Teams List */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="font-semibold text-lg">Your Teams</h2>
              {teams.map((team) => {
                const RoleIcon = roleIcons[team.membership?.role || 'member'];
                return (
                  <Card 
                    key={team.id} 
                    className={`cursor-pointer transition-colors hover:bg-accent/50 ${selectedTeam?.id === team.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedTeam(team)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {team.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base">{team.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={roleBadgeVariants[team.membership?.role || 'member']} className="text-xs">
                                <RoleIcon className="h-3 w-3 mr-1" />
                                {roleLabels[team.membership?.role || 'member']}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {team.member_count} member{team.member_count !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canManageTeam(team) && (
                              <>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setNewTeamName(team.name);
                                  setNewTeamDescription(team.description || "");
                                  setEditingTeam(team);
                                }}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit Team
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {!canDeleteTeam(team) && (
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  leaveTeam.mutate(team.id);
                                }}
                              >
                                <LogOut className="h-4 w-4 mr-2" />
                                Leave Team
                              </DropdownMenuItem>
                            )}
                            {canDeleteTeam(team) && (
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmTeam(team);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Team
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    {team.description && (
                      <CardContent className="pt-0">
                        <CardDescription className="line-clamp-2">{team.description}</CardDescription>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>

            {/* Team Details */}
            <div className="lg:col-span-2">
              {selectedTeam ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedTeam.name}</CardTitle>
                        {selectedTeam.description && (
                          <CardDescription>{selectedTeam.description}</CardDescription>
                        )}
                      </div>
                      {canManageTeam(selectedTeam) && (
                        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                          <DialogTrigger asChild>
                            <Button>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Invite Member
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Invite a Member</DialogTitle>
                              <DialogDescription>
                                Invite someone to join {selectedTeam.name}. They must have an account to be added.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="invite-email">Email Address</Label>
                                <Input
                                  id="invite-email"
                                  type="email"
                                  placeholder="colleague@example.com"
                                  value={inviteEmail}
                                  onChange={(e) => setInviteEmail(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="invite-role">Role</Label>
                                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as TeamRole)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">Admin - Can manage members</SelectItem>
                                    <SelectItem value="member">Member - Can share content</SelectItem>
                                    <SelectItem value="viewer">Viewer - Can view shared content</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleInviteMember} disabled={!inviteEmail.trim() || inviteMember.isPending}>
                                {inviteMember.isPending ? "Inviting..." : "Send Invite"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="members">
                      <TabsList>
                        <TabsTrigger value="members">Members</TabsTrigger>
                        <TabsTrigger value="activity">
                          <Activity className="h-4 w-4 mr-1" />
                          Activity
                        </TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="members" className="mt-4">
                        {membersLoading ? (
                          <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                              <Skeleton key={i} className="h-16" />
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {members.map((member) => {
                              const MemberRoleIcon = roleIcons[member.role];
                              const isCurrentUser = member.user_id === currentUserId;
                              const canEditMember = canManageTeam(selectedTeam) && !isCurrentUser && member.role !== 'owner';
                              
                              return (
                                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                                  <div className="flex items-center gap-3">
                                    <Avatar>
                                      <AvatarFallback>
                                        {(member.profile?.display_name || member.profile?.email || '?').charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium">
                                        {member.profile?.display_name || member.profile?.email || 'Unknown User'}
                                        {isCurrentUser && <span className="text-muted-foreground ml-2">(you)</span>}
                                      </p>
                                      {member.profile?.email && member.profile?.display_name && (
                                        <p className="text-sm text-muted-foreground">{member.profile.email}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {canEditMember ? (
                                      <Select 
                                        value={member.role} 
                                        onValueChange={(v) => updateMemberRole.mutate({
                                          teamId: selectedTeam.id,
                                          userId: member.user_id,
                                          role: v as TeamRole,
                                        })}
                                      >
                                        <SelectTrigger className="w-32">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="admin">Admin</SelectItem>
                                          <SelectItem value="member">Member</SelectItem>
                                          <SelectItem value="viewer">Viewer</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <Badge variant={roleBadgeVariants[member.role]}>
                                        <MemberRoleIcon className="h-3 w-3 mr-1" />
                                        {roleLabels[member.role]}
                                      </Badge>
                                    )}
                                    {canEditMember && (
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => removeMember.mutate({ teamId: selectedTeam.id, userId: member.user_id })}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="activity" className="mt-4">
                        <TeamActivityFeed teamId={selectedTeam.id} />
                      </TabsContent>
                      
                      <TabsContent value="settings" className="mt-4">
                        {canManageTeam(selectedTeam) ? (
                          <div className="space-y-4">
                            <div className="p-4 border rounded-lg">
                              <h3 className="font-medium mb-2">Team Information</h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                Update your team's name and description.
                              </p>
                              <Button 
                                variant="outline"
                                onClick={() => {
                                  setNewTeamName(selectedTeam.name);
                                  setNewTeamDescription(selectedTeam.description || "");
                                  setEditingTeam(selectedTeam);
                                }}
                              >
                                <Settings className="h-4 w-4 mr-2" />
                                Edit Team Settings
                              </Button>
                            </div>
                            {canDeleteTeam(selectedTeam) && (
                              <div className="p-4 border border-destructive/50 rounded-lg">
                                <h3 className="font-medium text-destructive mb-2">Danger Zone</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                  Deleting a team is permanent and cannot be undone. All shared content will be removed.
                                </p>
                                <Button 
                                  variant="destructive"
                                  onClick={() => setDeleteConfirmTeam(selectedTeam)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Team
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-8">
                            Only team owners and admins can manage settings.
                          </p>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center py-12">
                  <CardContent className="text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Select a team</h3>
                    <p className="text-muted-foreground">
                      Choose a team from the list to view members and settings
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Edit Team Dialog */}
        <Dialog open={!!editingTeam} onOpenChange={(open) => !open && setEditingTeam(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team</DialogTitle>
              <DialogDescription>
                Update your team's information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-team-name">Team Name</Label>
                <Input
                  id="edit-team-name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-team-description">Description</Label>
                <Textarea
                  id="edit-team-description"
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTeam(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateTeam} disabled={!newTeamName.trim() || updateTeam.isPending}>
                {updateTeam.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteConfirmTeam} onOpenChange={(open) => !open && setDeleteConfirmTeam(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Team</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteConfirmTeam?.name}"? This action cannot be undone. 
                All shared annotations, notes, and bookmarks will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDeleteTeam}
              >
                Delete Team
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default TeamsPage;
