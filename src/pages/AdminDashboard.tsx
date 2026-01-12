import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, BookOpen, Scale, Files, ListChecks, Users, LogOut, Upload, Construction, Save, Layers, LayoutDashboard, Link2, Bell, BookMarked, StickyNote, HelpCircle, BookOpenCheck, Mail, Newspaper, UserCircle, Languages, ClipboardCheck, Bot, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useSiteSettings, useUpdateSiteSettings } from '@/hooks/useSiteSettings';
import { AdminTour, useAdminTour } from '@/components/AdminTour';
import AnalyticsWidget from '@/components/AnalyticsWidget';

const AdminDashboard = () => {
  const { user, loading, isEditor, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: settings } = useSiteSettings();
  const updateSettings = useUpdateSiteSettings();
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const { isTourOpen, startTour, completeTour, closeTour } = useAdminTour();

  useEffect(() => {
    if (settings?.maintenance_message) {
      setMaintenanceMessage(settings.maintenance_message);
    }
  }, [settings?.maintenance_message]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/auth');
    } else if (!loading && user && !isEditor) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access the admin area.',
        variant: 'destructive',
      });
      navigate('/');
    }
  }, [user, loading, isEditor, navigate, toast]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!user || !isEditor) {
    return null;
  }

  const contentSections = [
    {
      title: 'Overview Page',
      description: 'Manage the overview page content',
      icon: LayoutDashboard,
      href: '/admin/overview',
    },
    {
      title: 'Chapters & Sections',
      description: 'Manage the structure of chapters and sections',
      icon: Layers,
      href: '/admin/chapters',
    },
    {
      title: 'Articles',
      description: 'Manage the 105 articles of the EHDS Regulation',
      icon: FileText,
      href: '/admin/articles',
      count: 105,
    },
    {
      title: 'Recitals',
      description: 'Manage all 115 recitals providing context',
      icon: BookOpen,
      href: '/admin/recitals',
      count: 115,
    },
    {
      title: 'Definitions',
      description: 'Manage legal definitions from Article 2',
      icon: Scale,
      href: '/admin/definitions',
      count: 67,
    },
    {
      title: 'Annexes',
      description: 'Manage the 4 technical annexes',
      icon: Files,
      href: '/admin/annexes',
      count: 4,
    },
    {
      title: 'Implementing Acts',
      description: 'Manage implementing and delegated acts tracker',
      icon: ListChecks,
      href: '/admin/implementing-acts',
      count: 33,
    },
    {
      title: 'Joint Action Deliverables',
      description: 'Link articles and acts to joint action deliverables',
      icon: Link2,
      href: '/admin/joint-action-deliverables',
    },
    {
      title: 'Published Works',
      description: 'Link articles and acts to published works',
      icon: BookMarked,
      href: '/admin/published-works',
    },
    {
      title: 'Notifications',
      description: 'Push notifications to site visitors',
      icon: Bell,
      href: '/admin/notifications',
    },
    {
      title: 'Footnotes',
      description: 'Manage footnotes for articles and recitals',
      icon: StickyNote,
      href: '/admin/footnotes',
    },
    {
      title: 'News Summaries',
      description: 'AI-generated weekly EHDS news summaries',
      icon: Newspaper,
      href: '/admin/news',
    },
    {
      title: 'Plain Language',
      description: 'AI plain language translations for legal content',
      icon: Languages,
      href: '/admin/plain-language',
    },
    {
      title: 'Translations',
      description: 'Manage multi-language content translations',
      icon: Globe,
      href: '/admin/translations',
    },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-4 md:p-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-serif">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage EHDS Regulation content
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Button variant="outline" size="sm" onClick={startTour} className="text-xs sm:text-sm">
              <HelpCircle className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Take Tour</span>
            </Button>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium truncate max-w-[150px]">{user.email}</p>
              <Badge variant={isAdmin ? 'default' : 'secondary'}>
                {isAdmin ? 'Admin' : 'Editor'}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Link to="/profile">
                <Button variant="outline" size="icon" title="My Profile" className="h-8 w-8 sm:h-9 sm:w-9">
                  <UserCircle className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="icon" onClick={handleSignOut} title="Sign Out" className="h-8 w-8 sm:h-9 sm:w-9">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8" data-tour="admin-content-sections">
          {contentSections.map((section) => {
            // Add specific data-tour attributes for key sections
            const tourAttr = section.title === 'Articles' ? { 'data-tour': 'admin-articles' } :
                           section.title === 'Recitals' ? { 'data-tour': 'admin-recitals' } :
                           section.title === 'Implementing Acts' ? { 'data-tour': 'admin-implementing-acts' } : {};
            
            return (
              <Link key={section.title} to={section.href} {...tourAttr}>
                <Card className="hover:border-primary transition-colors h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <section.icon className="h-8 w-8 text-primary" />
                      {section.count && <Badge variant="outline">{section.count} items</Badge>}
                    </div>
                    <CardTitle className="mt-4">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <Link to="/admin/users" data-tour="admin-user-management">
                <Card className="hover:border-primary transition-colors h-full border-dashed">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Users className="h-8 w-8 text-primary" />
                      <Badge>Admin Only</Badge>
                    </div>
                    <CardTitle className="mt-4">User Management</CardTitle>
                    <CardDescription>Manage admin and editor access</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link to="/admin/subscriptions">
                <Card className="hover:border-primary transition-colors h-full border-dashed">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Bell className="h-8 w-8 text-primary" />
                      <Badge>Admin Only</Badge>
                    </div>
                    <CardTitle className="mt-4">Email Subscriptions</CardTitle>
                    <CardDescription>Manage implementing act alert subscriptions</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link to="/admin/email-templates">
                <Card className="hover:border-primary transition-colors h-full border-dashed">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Mail className="h-8 w-8 text-primary" />
                      <Badge>Admin Only</Badge>
                    </div>
                    <CardTitle className="mt-4">Email Templates</CardTitle>
                    <CardDescription>Customize invitation and notification emails</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link to="/admin/ai-feedback">
                <Card className="hover:border-primary transition-colors h-full border-dashed">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Bot className="h-8 w-8 text-primary" />
                      <Badge>Admin Only</Badge>
                    </div>
                    <CardTitle className="mt-4">AI Feedback</CardTitle>
                    <CardDescription>Analyze AI assistant response quality</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </>
          )}
        </div>

        {isAdmin && (
          <Card className="mb-8" data-tour="admin-maintenance">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Construction className="h-5 w-5 text-primary" />
                <CardTitle>Maintenance Mode</CardTitle>
              </div>
              <CardDescription>
                When enabled, visitors will see a maintenance page. Admins and editors can still access the site.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Switch
                  id="maintenance-mode"
                  checked={settings?.maintenance_mode ?? false}
                  onCheckedChange={(checked) => {
                    updateSettings.mutate(
                      { maintenance_mode: checked },
                      {
                        onSuccess: () => {
                          toast({
                            title: checked ? 'Maintenance Mode Enabled' : 'Maintenance Mode Disabled',
                            description: checked
                              ? 'Visitors will now see the maintenance page.'
                              : 'The site is now publicly accessible.',
                          });
                        },
                        onError: () => {
                          toast({
                            title: 'Error',
                            description: 'Failed to update maintenance mode.',
                            variant: 'destructive',
                          });
                        },
                      }
                    );
                  }}
                  disabled={updateSettings.isPending}
                />
                <Label htmlFor="maintenance-mode" className="cursor-pointer">
                  {settings?.maintenance_mode ? (
                    <Badge variant="destructive">Maintenance Mode Active</Badge>
                  ) : (
                    <span className="text-muted-foreground">Site is public</span>
                  )}
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenance-message">Maintenance Message</Label>
                <Textarea
                  id="maintenance-message"
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  placeholder="Enter the message visitors will see during maintenance..."
                  rows={3}
                  className="resize-none"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      updateSettings.mutate(
                        { maintenance_message: maintenanceMessage },
                        {
                          onSuccess: () => {
                            toast({
                              title: 'Message Updated',
                              description: 'Maintenance message has been saved.',
                            });
                          },
                          onError: () => {
                            toast({
                              title: 'Error',
                              description: 'Failed to update message.',
                              variant: 'destructive',
                            });
                          },
                        }
                      );
                    }}
                    disabled={updateSettings.isPending || maintenanceMessage === settings?.maintenance_message}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Message
                  </Button>
                  {maintenanceMessage !== settings?.maintenance_message && (
                    <span className="text-sm text-muted-foreground">Unsaved changes</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Widget */}
        {isAdmin && (
          <div className="mb-8" data-tour="admin-analytics">
            <AnalyticsWidget />
          </div>
        )}

        <Card data-tour="admin-quick-actions">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 md:gap-4 flex-wrap">
            <Link to="/">
              <Button variant="outline">View Public Site</Button>
            </Link>
            <Link to="/admin/articles">
              <Button>Edit Articles</Button>
            </Link>
            <Link to="/admin/recitals">
              <Button>Edit Recitals</Button>
            </Link>
            <Link to="/admin/bulk-import">
              <Button variant="secondary">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>
            </Link>
            <Link to="/admin/help">
              <Button variant="outline">
                <BookOpenCheck className="h-4 w-4 mr-2" />
                Help Center
              </Button>
            </Link>
            <Link to="/admin/qa">
              <Button variant="outline">
                <ClipboardCheck className="h-4 w-4 mr-2" />
                QA Checklist
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Admin Tour */}
        <AdminTour run={isTourOpen} onComplete={completeTour} onClose={closeTour} />
      </div>
    </Layout>
  );
};

export default AdminDashboard;
