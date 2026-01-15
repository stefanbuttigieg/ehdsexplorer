import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Lock, Mail, Calendar, Shield, Trophy, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AchievementsGrid } from "@/components/achievements/AchievementsGrid";
import { AchievementProgress } from "@/components/achievements/AchievementProgress";
import { AchievementBadge } from "@/components/achievements/AchievementBadge";
import { useAchievements } from "@/hooks/useAchievements";
import { AchievementTier } from "@/data/achievements";

const ProfilePage = () => {
  const { user, session, loading, isAdmin, isEditor } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { userAchievements, definitions, isLoggedIn } = useAchievements();

  const activeTab = searchParams.get("tab") || "profile";

  const [displayName, setDisplayName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/admin/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching profile:", error);
        } else if (data) {
          setDisplayName(data.display_name || "");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setProfileLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim() })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your display name has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newEmail.trim()) return;

    if (newEmail.trim().toLowerCase() === user.email?.toLowerCase()) {
      toast({
        title: "Same email",
        description: "Please enter a different email address.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail.trim(),
      });

      if (error) throw error;

      toast({
        title: "Confirmation email sent",
        description: "Please check your new email address to confirm the change.",
      });

      setNewEmail("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update email",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both password fields match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke("update-own-password", {
        body: { newPassword },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (loading || profileLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown";

  // Get recent unlocks (last 5)
  const recentUnlocks = [...userAchievements]
    .sort((a, b) => new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime())
    .slice(0, 5)
    .map(ua => {
      const def = definitions.find(d => d.id === ua.achievement_id);
      return def ? { ...def, unlockedAt: ua.unlocked_at } : null;
    })
    .filter(Boolean);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <Layout>
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and track your achievements
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile Settings
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Achievements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
          {/* Account Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>Your account details and roles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Member since:</span>
                <span className="text-sm text-muted-foreground">{createdAt}</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Roles:</span>
                <div className="flex gap-2">
                  {isAdmin && <Badge variant="default">Admin</Badge>}
                  {isEditor && !isAdmin && <Badge variant="secondary">Editor</Badge>}
                  {!isAdmin && !isEditor && <Badge variant="outline">User</Badge>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Update your display name</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                  />
                </div>
                <Button type="submit" disabled={isUpdatingProfile}>
                  {isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Email Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Change Email
              </CardTitle>
              <CardDescription>
                Update your email address. A confirmation link will be sent to your new email.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentEmail">Current Email</Label>
                  <Input
                    id="currentEmail"
                    type="email"
                    value={user.email || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newEmail">New Email</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email address"
                    required
                  />
                </div>
                <Button type="submit" disabled={isUpdatingEmail || !newEmail.trim()}>
                  {isUpdatingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Email
                </Button>
              </form>
            </CardContent>
          </Card>

          <Separator />

          {/* Change Password Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    minLength={6}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    minLength={6}
                    required
                  />
                </div>
                <Button type="submit" disabled={isUpdatingPassword || !newPassword || !confirmPassword}>
                  {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            {!isLoggedIn && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your achievements are saved locally. Sign in to sync your progress across devices!
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Progress Card */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Your Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <AchievementProgress />
                </CardContent>
              </Card>

              {/* Recent Unlocks */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Unlocks</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentUnlocks.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {recentUnlocks.map((achievement) => (
                        achievement && (
                          <AchievementBadge
                            key={achievement.id}
                            name={achievement.name}
                            description={achievement.description}
                            icon={achievement.icon}
                            tier={achievement.tier as AchievementTier}
                            isUnlocked={true}
                            size="md"
                          />
                        )
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Start reading articles to unlock your first achievement!
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* All Achievements */}
            <Card>
              <CardHeader>
                <CardTitle>All Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <AchievementsGrid showFilters={true} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ProfilePage;
