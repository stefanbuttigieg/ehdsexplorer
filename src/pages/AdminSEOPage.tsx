import { useState } from 'react';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { useSEOSettings, useSEOSettingsMutations, type SEOSettings } from '@/hooks/useSEOSettings';
import { AdminPageLayout } from '@/components/admin/AdminPageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Pencil, Trash2, Globe, FileText, Tag, Image } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const COMMON_PAGES = [
  { path: '/', name: 'Home' },
  { path: '/overview', name: 'Overview' },
  { path: '/articles', name: 'Articles' },
  { path: '/recitals', name: 'Recitals' },
  { path: '/definitions', name: 'Definitions' },
  { path: '/implementing-acts', name: 'Implementing Acts' },
  { path: '/health-authorities', name: 'Health Authorities' },
  { path: '/help', name: 'Help Center' },
  { path: '/for/citizens', name: 'For Citizens' },
  { path: '/for/healthtech', name: 'For Health Tech' },
  { path: '/for/healthcare-professionals', name: 'For Healthcare Pros' },
  { path: '/scenario-finder', name: 'Scenario Finder' },
  { path: '/topic-index', name: 'Topics & Glossary' },
  { path: '/news', name: 'News' },
  { path: '/api', name: 'API Documentation' },
];

const STRUCTURED_DATA_TYPES = [
  { value: 'article', label: 'Article' },
  { value: 'legislation', label: 'Legislation' },
  { value: 'faq', label: 'FAQ Page' },
  { value: 'howto', label: 'How-To' },
  { value: 'website', label: 'Website' },
];

export default function AdminSEOPage() {
  const { isLoading: authLoading, shouldRender } = useAdminGuard();
  const { data: settings, isLoading } = useSEOSettings();
  const { createSetting, updateSetting, deleteSetting } = useSEOSettingsMutations();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<SEOSettings | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<SEOSettings>>({});

  if (authLoading || !shouldRender) {
    return (
      <AdminPageLayout title="SEO Management" description="Loading...">
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </AdminPageLayout>
    );
  }

  const filteredSettings = settings?.filter(s => 
    s.page_path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.page_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      page_path: '',
      page_title: '',
      meta_description: '',
      meta_keywords: [],
      og_title: '',
      og_description: '',
      og_image_url: '',
      twitter_card_type: 'summary_large_image',
      canonical_url: '',
      noindex: false,
      nofollow: false,
      structured_data_type: 'article',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: SEOSettings) => {
    setEditingItem(item);
    setFormData(item);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this SEO configuration?')) {
      await deleteSetting.mutateAsync(id);
    }
  };

  const handleSave = async () => {
    if (!formData.page_path) return;

    if (editingItem) {
      await updateSetting.mutateAsync({ 
        id: editingItem.id, 
        ...formData 
      });
    } else {
      await createSetting.mutateAsync(formData as any);
    }
    setIsDialogOpen(false);
  };

  const unconfiguredPages = COMMON_PAGES.filter(
    page => !settings?.some(s => s.page_path === page.path)
  );

  return (
    <AdminPageLayout 
      title="SEO Management" 
      description="Manage meta tags, structured data, and search engine optimization"
    >
      <Tabs defaultValue="configured" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configured">Configured Pages</TabsTrigger>
          <TabsTrigger value="unconfigured">
            Quick Setup
            {unconfiguredPages.length > 0 && (
              <Badge variant="secondary" className="ml-2">{unconfiguredPages.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configured" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Page
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page Path</TableHead>
                    <TableHead className="hidden md:table-cell">Title</TableHead>
                    <TableHead className="hidden lg:table-cell">Schema</TableHead>
                    <TableHead className="hidden sm:table-cell">Robots</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSettings?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.page_path}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                        {item.page_title || <span className="text-muted-foreground">Not set</span>}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {item.structured_data_type && (
                          <Badge variant="outline">{item.structured_data_type}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex gap-1">
                          {item.noindex && <Badge variant="destructive" className="text-xs">noindex</Badge>}
                          {item.nofollow && <Badge variant="destructive" className="text-xs">nofollow</Badge>}
                          {!item.noindex && !item.nofollow && (
                            <Badge variant="secondary" className="text-xs">index, follow</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!filteredSettings || filteredSettings.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No SEO configurations found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="unconfigured" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Setup</CardTitle>
              <CardDescription>
                Configure SEO for common pages that don't have settings yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {unconfiguredPages.map((page) => (
                  <div 
                    key={page.path} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{page.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">{page.path}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setEditingItem(null);
                        setFormData({
                          page_path: page.path,
                          page_title: `${page.name} | EHDS Explorer`,
                          meta_description: '',
                          noindex: false,
                          nofollow: false,
                          structured_data_type: 'article',
                        });
                        setIsDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Configure
                    </Button>
                  </div>
                ))}
                {unconfiguredPages.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    All common pages are configured! 🎉
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit SEO Settings' : 'Add SEO Settings'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Basic Information
              </h3>
              
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="page_path">Page Path *</Label>
                  <Input
                    id="page_path"
                    placeholder="/articles"
                    value={formData.page_path || ''}
                    onChange={(e) => setFormData({ ...formData, page_path: e.target.value })}
                    disabled={!!editingItem}
                  />
                </div>

                <div>
                  <Label htmlFor="page_title">Page Title (max 60 chars)</Label>
                  <Input
                    id="page_title"
                    placeholder="Articles | EHDS Explorer"
                    value={formData.page_title || ''}
                    onChange={(e) => setFormData({ ...formData, page_title: e.target.value })}
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.page_title?.length || 0}/60 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="meta_description">Meta Description (max 160 chars)</Label>
                  <Textarea
                    id="meta_description"
                    placeholder="A brief description for search engines..."
                    value={formData.meta_description || ''}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    maxLength={160}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.meta_description?.length || 0}/160 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="meta_keywords">Keywords (comma-separated)</Label>
                  <Input
                    id="meta_keywords"
                    placeholder="EHDS, health data, regulation, EU"
                    value={formData.meta_keywords?.join(', ') || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      meta_keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Open Graph */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Image className="h-4 w-4" />
                Social Sharing (Open Graph)
              </h3>
              
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="og_title">OG Title</Label>
                  <Input
                    id="og_title"
                    placeholder="Leave empty to use page title"
                    value={formData.og_title || ''}
                    onChange={(e) => setFormData({ ...formData, og_title: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="og_description">OG Description</Label>
                  <Textarea
                    id="og_description"
                    placeholder="Leave empty to use meta description"
                    value={formData.og_description || ''}
                    onChange={(e) => setFormData({ ...formData, og_description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="og_image_url">OG Image URL</Label>
                  <Input
                    id="og_image_url"
                    placeholder="https://..."
                    value={formData.og_image_url || ''}
                    onChange={(e) => setFormData({ ...formData, og_image_url: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="twitter_card_type">Twitter Card Type</Label>
                  <Select
                    value={formData.twitter_card_type || 'summary_large_image'}
                    onValueChange={(v) => setFormData({ ...formData, twitter_card_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Summary</SelectItem>
                      <SelectItem value="summary_large_image">Summary with Large Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Structured Data */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Structured Data
              </h3>
              
              <div>
                <Label htmlFor="structured_data_type">Schema Type</Label>
                <Select
                  value={formData.structured_data_type || ''}
                  onValueChange={(v) => setFormData({ ...formData, structured_data_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select schema type" />
                  </SelectTrigger>
                  <SelectContent>
                    {STRUCTURED_DATA_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Advanced
              </h3>
              
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="canonical_url">Canonical URL</Label>
                  <Input
                    id="canonical_url"
                    placeholder="Leave empty to use current URL"
                    value={formData.canonical_url || ''}
                    onChange={(e) => setFormData({ ...formData, canonical_url: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>No Index</Label>
                    <p className="text-xs text-muted-foreground">Hide this page from search engines</p>
                  </div>
                  <Switch
                    checked={formData.noindex || false}
                    onCheckedChange={(v) => setFormData({ ...formData, noindex: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>No Follow</Label>
                    <p className="text-xs text-muted-foreground">Don't follow links on this page</p>
                  </div>
                  <Switch
                    checked={formData.nofollow || false}
                    onCheckedChange={(v) => setFormData({ ...formData, nofollow: v })}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.page_path || createSetting.isPending || updateSetting.isPending}
            >
              {createSetting.isPending || updateSetting.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
}
