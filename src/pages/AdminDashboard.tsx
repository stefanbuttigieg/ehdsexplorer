import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, BookOpen, Scale, Files, ListChecks, Users, LogOut, Upload, Construction, Save, Layers, LayoutDashboard, Link2, Bell, BookMarked, StickyNote, HelpCircle, BookOpenCheck, Mail, Newspaper, UserCircle, Languages, ClipboardCheck, Bot, Globe, Sparkles, MapPin, Shield, ShieldCheck, Gavel, Settings2, UserCog, ToggleRight, ClipboardList, TableProperties, Activity, Key, Code, Search, Download, AlertTriangle, MessageCircleQuestion } from 'lucide-react';
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
  const { user, loading, isEditor, isAdmin, isSuperAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: settings } = useSiteSettings();
  const updateSettings = useUpdateSiteSettings();
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { isTourOpen, startTour, completeTour, closeTour } = useAdminTour();

  // Fetch live counts for dashboard tiles
  const { data: counts } = useQuery({
    queryKey: ['admin-dashboard-counts'],
    queryFn: async () => {
      const tableNames = [
        'articles', 'recitals', 'definitions', 'annexes', 'implementing_acts',
        'footnotes', 'ehds_faqs', 'notifications', 'disclaimers', 'news_summaries',
        'country_legislation', 'cross_regulation_references', 'ehds_obligations',
        'downloadable_resources', 'health_authorities', 'help_center_faqs',
        'feature_flags', 'email_templates', 'comic_panel_images', 'topic_index',
        'published_works', 'joint_action_deliverables',
      ];
      const results = await Promise.all(
        tableNames.map(async (table) => {
          const { count } = await supabase.from(table as any).select('*', { count: 'exact', head: true });
          return [table, count ?? 0] as const;
        })
      );
      return Object.fromEntries(results) as Record<string, number>;
    },
    staleTime: 60_000,
  });

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

  const contentSections = useMemo(() => [
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
      description: 'Manage the articles of the EHDS Regulation',
      icon: FileText,
      href: '/admin/articles',
      count: counts?.articles,
    },
    {
      title: 'Recitals',
      description: 'Manage all recitals providing context',
      icon: BookOpen,
      href: '/admin/recitals',
      count: counts?.recitals,
    },
    {
      title: 'Definitions',
      description: 'Manage legal definitions from Article 2',
      icon: Scale,
      href: '/admin/definitions',
      count: counts?.definitions,
    },
    {
      title: 'Annexes',
      description: 'Manage the technical annexes',
      icon: Files,
      href: '/admin/annexes',
      count: counts?.annexes,
    },
    {
      title: 'Implementing Acts',
      description: 'Manage implementing and delegated acts tracker',
      icon: ListChecks,
      href: '/admin/implementing-acts',
      count: counts?.implementing_acts,
    },
    {
      title: 'EU Project Deliverables',
      description: 'Link articles and acts to EU project deliverables',
      icon: Link2,
      href: '/admin/joint-action-deliverables',
      count: counts?.joint_action_deliverables,
    },
    {
      title: 'Published Works',
      description: 'Link articles and acts to published works',
      icon: BookMarked,
      href: '/admin/published-works',
      count: counts?.published_works,
    },
    {
      title: 'Notifications',
      description: 'Push notifications to site visitors',
      icon: Bell,
      href: '/admin/notifications',
      count: counts?.notifications,
    },
    {
      title: 'Disclaimers',
      description: 'Manage disclaimer banners across the site',
      icon: AlertTriangle,
      href: '/admin/disclaimers',
      count: counts?.disclaimers,
    },
    {
      title: 'Footnotes',
      description: 'Manage footnotes for articles and recitals',
      icon: StickyNote,
      href: '/admin/footnotes',
      count: counts?.footnotes,
    },
    {
      title: 'EHDS FAQs',
      description: 'Manage official EU Commission EHDS FAQs and PDF parser',
      icon: MessageCircleQuestion,
      href: '/admin/ehds-faqs',
      count: counts?.ehds_faqs,
    },
    {
      title: 'Help Center FAQs',
      description: 'Manage FAQ content for the public help page',
      icon: HelpCircle,
      href: '/admin/help-center-faqs',
      count: counts?.help_center_faqs,
    },
    {
      title: 'Onboarding Flow',
      description: 'Customize the signup onboarding experience',
      icon: Sparkles,
      href: '/admin/onboarding',
    },
    {
      title: 'News Summaries',
      description: 'AI-generated weekly EHDS news summaries',
      icon: Newspaper,
      href: '/admin/news',
      count: counts?.news_summaries,
    },
    {
      title: 'EU Regulation Updates',
      description: 'Monitor EC Better Regulation portal for EHDS dataset updates',
      icon: AlertTriangle,
      href: '/admin/eu-regulation-updates',
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
    {
      title: 'Languages',
      description: 'Enable/disable languages and translation settings',
      icon: Languages,
      href: '/admin/languages',
    },
    {
      title: 'UI Translations',
      description: 'Manage site-wide UI string translations with AI and IATE terminology',
      icon: Globe,
      href: '/admin/ui-translations',
    },
    {
      title: 'National EHDS Entities',
      description: 'Manage Digital Health Authorities (DHAs) and Health Data Access Bodies (HDABs)',
      icon: MapPin,
      href: '/admin/health-authorities',
      count: counts?.health_authorities,
    },
    {
      title: 'National Legislation',
      description: 'Manage national EHDS-linked legislation across member states',
      icon: Scale,
      href: '/admin/country-legislation',
      count: counts?.country_legislation,
    },
    {
      title: 'Cross-Regulation Links',
      description: 'Link EHDS articles to GDPR, AI Act, MDR, Data Act provisions',
      icon: Link2,
      href: '/admin/cross-regulation',
      count: counts?.cross_regulation_references,
    },
    {
      title: 'Implementation Tracker',
      description: 'Configure progress calculation weights and thresholds',
      icon: Settings2,
      href: '/admin/implementation-tracker',
    },
    {
      title: 'eHDSI KPI Data',
      description: 'Sync and review MyHealth@EU primary use KPIs from the eHDSI dashboard',
      icon: Activity,
      href: '/admin/ehdsi-kpis',
    },
    {
      title: 'EHDS Obligations',
      description: 'Manage obligations tracked per member state',
      icon: ClipboardList,
      href: '/admin/obligations',
      count: counts?.ehds_obligations,
    },
    {
      title: 'Legal Pages',
      description: 'Edit Privacy Policy, Terms of Service, Cookies Policy, Accessibility Statement',
      icon: Shield,
      href: '/admin/legal-pages',
    },
    {
      title: 'Landing Pages',
      description: 'Manage stakeholder content for Citizens, Health Tech, and Healthcare pages',
      icon: Sparkles,
      href: '/admin/landing-pages',
    },
    {
      title: 'Topic Index',
      description: 'Map topics to EHDS articles for quick reference on landing pages',
      icon: TableProperties,
      href: '/admin/topic-index',
      count: counts?.topic_index,
    },
    {
      title: 'Downloadable Resources',
      description: 'Manage compliance templates, checklists, and guides for the Tools Hub',
      icon: Download,
      href: '/admin/resources',
      count: counts?.downloadable_resources,
    },
    {
      title: 'Toolkit Questions',
      description: 'Manage Starter Kit and Readiness Assessment wizard Q&A',
      icon: ClipboardCheck,
      href: '/admin/toolkit-questions',
    },
    {
      title: 'Translation Import',
      description: 'Bulk import translations from EUR-Lex for all EU languages',
      icon: Upload,
      href: '/admin/translation-import',
    },
    {
      title: 'Bulk Import',
      description: 'Import articles, recitals, and definitions in bulk',
      icon: Upload,
      href: '/admin/bulk-import',
    },
    {
      title: 'Implementing Act Content',
      description: 'Manage implementing act recitals, articles, and sections',
      icon: FileText,
      href: '/admin/implementing-act-content',
    },
    {
      title: 'IA Data Tables',
      description: 'Manage structured data tables for implementing acts (data elements, logical models)',
      icon: TableProperties,
      href: '/admin/ia-data-tables',
    },
    {
      title: 'Comic Panel Images',
      description: 'Pre-generate and manage AI comic panel artwork for Comics section',
      icon: Sparkles,
      href: '/admin/comic-panels',
      count: counts?.comic_panel_images,
    },
  ], [counts]);

  const adminOnlySections = isAdmin ? [
    {
      title: 'User Management',
      description: 'Manage admin and editor access',
      icon: Users,
      href: '/admin/users',
      badge: 'Admin Only',
    },
    {
      title: 'Email Subscriptions',
      description: 'Manage implementing act alert subscriptions',
      icon: Bell,
      href: '/admin/subscriptions',
      badge: 'Admin Only',
    },
    {
      title: 'Email Templates',
      description: 'Customize invitation and notification emails',
      icon: Mail,
      href: '/admin/email-templates',
      badge: 'Admin Only',
      count: counts?.email_templates,
    },
    {
      title: 'AI Feedback',
      description: 'Analyze AI assistant response quality',
      icon: Bot,
      href: '/admin/ai-feedback',
      badge: 'Admin Only',
    },
    {
      title: 'AI Settings',
      description: 'Configure AI model for all AI-powered features',
      icon: Bot,
      href: '/admin/ai-settings',
      badge: 'Admin Only',
    },
    {
      title: 'Country Assignments',
      description: 'Assign users to manage country implementation tracking',
      icon: UserCog,
      href: '/admin/country-assignments',
      badge: 'Admin Only',
    },
  ] : [];

  const superAdminSections = isSuperAdmin ? [
    {
      title: 'Role Permissions',
      description: 'Configure granular permissions for each role',
      icon: Gavel,
      href: '/admin/role-permissions',
      badge: 'Super Admin',
    },
    {
      title: 'Feature Flags',
      description: 'Toggle features on/off across the site',
      icon: ToggleRight,
      href: '/admin/feature-flags',
      badge: 'Super Admin',
    },
    {
      title: 'Sidebar Manager',
      description: 'Manage navigation items in the left sidebar',
      icon: Settings2,
      href: '/admin/sidebar',
      badge: 'Super Admin',
    },
    {
      title: 'Header Manager',
      description: 'Control top header items (Sign In, Kids Mode, Language) — visibility, order, per-device & auth state',
      icon: Settings2,
      href: '/admin/header',
      badge: 'Super Admin',
    },
    {
      title: 'API Keys & Logs',
      description: 'View API keys and request logs from country managers',
      icon: Key,
      href: '/admin/api-logs',
      badge: 'Super Admin',
    },
    {
      title: 'API Documentation',
      description: 'Complete reference for all GET and POST API endpoints',
      icon: Code,
      href: '/admin/api-docs',
      badge: 'Super Admin',
    },
    {
      title: 'SEO Management',
      description: 'Manage meta tags, schemas, and search optimization',
      icon: Search,
      href: '/admin/seo',
      badge: 'Super Admin',
    },
    {
      title: 'Security Settings',
      description: 'Configure two-factor authentication and enforcement policies',
      icon: ShieldCheck,
      href: '/admin/security',
      badge: 'Super Admin',
    },
  ] : [];

  const allSections = useMemo(() => [...contentSections, ...adminOnlySections, ...superAdminSections] as Array<{
    title: string;
    description: string;
    icon: any;
    href: string;
    count?: number;
    badge?: string;
  }>, [contentSections, adminOnlySections, superAdminSections]);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return allSections.filter(
      (s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    );
  }, [searchQuery, allSections]);

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

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search admin sections…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>

        {filteredSections ? (
          /* Search results view */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            {filteredSections.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No sections matching "{searchQuery}"
              </div>
            ) : (
              filteredSections.map((section) => (
                <Link key={section.title} to={section.href}>
                  <Card className={`hover:border-primary transition-colors h-full ${section.badge ? 'border-dashed' : ''} ${section.badge === 'Super Admin' ? 'border-primary/50' : ''}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <section.icon className="h-8 w-8 text-primary" />
                        {section.badge ? (
                          <Badge variant={section.badge === 'Super Admin' ? 'destructive' : 'default'}>{section.badge}</Badge>
                        ) : section.count ? (
                          <Badge variant="outline">{section.count} items</Badge>
                        ) : null}
                      </div>
                      <CardTitle className="mt-4">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))
            )}
          </div>
        ) : (
          /* Default grouped view */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8" data-tour="admin-content-sections">
            {contentSections.map((section) => {
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

            {adminOnlySections.map((section) => (
              <Link key={section.title} to={section.href} {...(section.title === 'User Management' ? { 'data-tour': 'admin-user-management' } : {})}>
                <Card className="hover:border-primary transition-colors h-full border-dashed">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <section.icon className="h-8 w-8 text-primary" />
                      <Badge>Admin Only</Badge>
                    </div>
                    <CardTitle className="mt-4">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}

            {superAdminSections.map((section) => (
              <Link key={section.title} to={section.href}>
                <Card className="hover:border-primary transition-colors h-full border-dashed border-primary/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <section.icon className="h-8 w-8 text-primary" />
                      <Badge variant="destructive">Super Admin</Badge>
                    </div>
                    <CardTitle className="mt-4">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}

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
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Analytics</h2>
              <Link to="/admin/analytics">
                <Button variant="outline" size="sm">Full Analytics →</Button>
              </Link>
            </div>
            <AnalyticsWidget />
          </div>
        )}

        {/* Quick Links Row */}
        <div className="flex gap-2 flex-wrap" data-tour="admin-quick-actions">
          <Link to="/">
            <Button variant="outline" size="sm">View Public Site</Button>
          </Link>
          <Link to="/admin/help">
            <Button variant="outline" size="sm">
              <BookOpenCheck className="h-4 w-4 mr-1" />
              Help Center
            </Button>
          </Link>
          <Link to="/admin/qa">
            <Button variant="outline" size="sm">
              <ClipboardCheck className="h-4 w-4 mr-1" />
              QA Checklist
            </Button>
          </Link>
        </div>

        {/* Admin Tour */}
        <AdminTour run={isTourOpen} onComplete={completeTour} onClose={closeTour} />
      </div>
    </Layout>
  );
};

export default AdminDashboard;
