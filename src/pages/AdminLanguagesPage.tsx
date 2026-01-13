import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Globe, Check, X, GripVertical, Search, Settings2, Power, PowerOff } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useLanguages, useToggleLanguageActive, useUpdateLanguage, Language } from '@/hooks/useLanguages';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const AdminLanguagesPage = () => {
  const { user, loading, isAdmin, isEditor } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: languages, isLoading: languagesLoading } = useLanguages();
  const toggleActive = useToggleLanguageActive();
  const updateLanguage = useUpdateLanguage();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [editForm, setEditForm] = useState({ sort_order: 0 });
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(new Set());

  // Fetch translation stats for each language
  const { data: translationStats } = useQuery({
    queryKey: ['language-translation-stats'],
    queryFn: async () => {
      const stats: Record<string, { total: number; translated: number }> = {};
      
      // Get counts for each language from article_translations
      const { data, error } = await supabase
        .from('article_translations')
        .select('language_code');
      
      if (!error && data) {
        data.forEach((item) => {
          if (!stats[item.language_code]) {
            stats[item.language_code] = { total: 105, translated: 0 };
          }
          stats[item.language_code].translated++;
        });
      }
      
      return stats;
    },
  });

  // Bulk update mutation - must be before any conditional returns
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ codes, isActive }: { codes: string[]; isActive: boolean }) => {
      const { error } = await supabase
        .from('languages')
        .update({ is_active: isActive })
        .in('code', codes);
      
      if (error) throw error;
    },
    onSuccess: (_, { codes, isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['languages'] });
      toast.success(`${codes.length} language(s) ${isActive ? 'enabled' : 'disabled'}`);
      setSelectedLanguages(new Set());
    },
    onError: (error) => {
      toast.error('Failed to update languages: ' + error.message);
    },
  });

  // Derived state - compute from languages
  const filteredLanguages = useMemo(() => 
    languages?.filter(lang => 
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.native_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [],
    [languages, searchQuery]
  );

  // Selectable languages (exclude English)
  const selectableLanguages = useMemo(() => 
    filteredLanguages.filter(l => l.code !== 'en'),
    [filteredLanguages]
  );

  const activeCount = languages?.filter(l => l.is_active).length || 0;
  const totalCount = languages?.length || 0;

  const isAllSelected = selectableLanguages.length > 0 && 
    selectableLanguages.every(l => selectedLanguages.has(l.code));
  const isSomeSelected = selectedLanguages.size > 0;

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/auth');
    } else if (!loading && user && !isEditor) {
      navigate('/');
    }
  }, [user, loading, isEditor, navigate]);

  // Early returns AFTER all hooks
  if (loading || languagesLoading) {
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

  const handleToggleActive = (lang: Language) => {
    // Don't allow disabling English
    if (lang.code === 'en') return;
    toggleActive.mutate({ code: lang.code, isActive: !lang.is_active });
  };

  const handleEditLanguage = (lang: Language) => {
    setEditingLanguage(lang);
    setEditForm({ sort_order: lang.sort_order });
  };

  const handleSaveEdit = () => {
    if (!editingLanguage) return;
    updateLanguage.mutate({
      code: editingLanguage.code,
      updates: { sort_order: editForm.sort_order },
    }, {
      onSuccess: () => setEditingLanguage(null),
    });
  };

  const handleSelectLanguage = (code: string, checked: boolean) => {
    const newSelected = new Set(selectedLanguages);
    if (checked) {
      newSelected.add(code);
    } else {
      newSelected.delete(code);
    }
    setSelectedLanguages(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLanguages(new Set(selectableLanguages.map(l => l.code)));
    } else {
      setSelectedLanguages(new Set());
    }
  };

  const handleBulkEnable = () => {
    const codes = Array.from(selectedLanguages);
    bulkUpdateMutation.mutate({ codes, isActive: true });
  };

  const handleBulkDisable = () => {
    const codes = Array.from(selectedLanguages);
    bulkUpdateMutation.mutate({ codes, isActive: false });
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-4 md:p-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
          <Link to="/admin">
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-serif">Language Management</h1>
            <p className="text-sm text-muted-foreground hidden sm:block">Enable/disable languages and configure translation settings</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Card>
            <CardHeader className="p-3 sm:pb-2 sm:p-6">
              <CardTitle className="text-lg sm:text-2xl">{totalCount}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Total</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="p-3 sm:pb-2 sm:p-6">
              <CardTitle className="text-lg sm:text-2xl text-green-600">{activeCount}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Active</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="p-3 sm:pb-2 sm:p-6">
              <CardTitle className="text-lg sm:text-2xl text-muted-foreground">{totalCount - activeCount}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Inactive</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Info Card - Hidden on mobile */}
        <Card className="mb-4 sm:mb-6 hidden sm:block">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              About Language Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Active languages</strong> are available for users to select in the language dropdown and for content translation.
            </p>
            <p>
              <strong>English is always active</strong> as the primary language and cannot be disabled. All content defaults to English when translations are not available.
            </p>
            <p>
              <strong>Sort order</strong> determines the display order in the language selector. Lower numbers appear first.
            </p>
          </CardContent>
        </Card>

        {/* Bulk Actions Bar */}
        {isSomeSelected && (
          <Card className="mb-4 sm:mb-6 border-primary">
            <CardContent className="p-3 sm:py-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Badge variant="secondary" className="text-xs sm:text-sm">
                    {selectedLanguages.size} selected
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLanguages(new Set())}
                    className="h-7 text-xs sm:text-sm"
                  >
                    Clear
                  </Button>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkEnable}
                    disabled={bulkUpdateMutation.isPending}
                    className="flex-1 sm:flex-none gap-1 sm:gap-2 h-8 text-xs sm:text-sm"
                  >
                    <Power className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Enable</span>
                    <span className="xs:hidden">On</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDisable}
                    disabled={bulkUpdateMutation.isPending}
                    className="flex-1 sm:flex-none gap-1 sm:gap-2 h-8 text-xs sm:text-sm"
                  >
                    <PowerOff className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Disable</span>
                    <span className="xs:hidden">Off</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Languages Card */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div>
                <CardTitle className="text-base sm:text-lg">All Languages</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Manage available languages</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all languages"
                      />
                    </TableHead>
                    <TableHead className="w-16">Order</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Native Name</TableHead>
                    <TableHead>Translation Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLanguages.map((lang) => {
                    const stats = translationStats?.[lang.code];
                    const progress = stats ? Math.round((stats.translated / stats.total) * 100) : 0;
                    const isSelected = selectedLanguages.has(lang.code);
                    
                    return (
                      <TableRow key={lang.code} className={isSelected ? 'bg-muted/50' : ''}>
                        <TableCell>
                          {lang.code === 'en' ? (
                            <span className="text-muted-foreground text-xs">—</span>
                          ) : (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleSelectLanguage(lang.code, !!checked)}
                              aria-label={`Select ${lang.name}`}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <GripVertical className="h-4 w-4" />
                            <span>{lang.sort_order}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono uppercase">
                            {lang.code}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{lang.name}</TableCell>
                        <TableCell>{lang.native_name}</TableCell>
                        <TableCell>
                          {lang.code === 'en' ? (
                            <span className="text-muted-foreground text-sm">Primary</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground">{progress}%</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={lang.is_active}
                              onCheckedChange={() => handleToggleActive(lang)}
                              disabled={lang.code === 'en' || toggleActive.isPending}
                            />
                            {lang.is_active ? (
                              <Badge variant="default" className="gap-1">
                                <Check className="h-3 w-3" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <X className="h-3 w-3" />
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditLanguage(lang)}
                            >
                              <Settings2 className="h-4 w-4" />
                            </Button>
                            <Link to={`/admin/translations?lang=${lang.code}`}>
                              <Button variant="outline" size="sm" disabled={lang.code === 'en'}>
                                Translations
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-2">
              {/* Select All Row */}
              <div className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all languages"
                  />
                  <span className="text-sm text-muted-foreground">Select all</span>
                </div>
                <span className="text-xs text-muted-foreground">{filteredLanguages.length} languages</span>
              </div>

              {filteredLanguages.map((lang) => {
                const stats = translationStats?.[lang.code];
                const progress = stats ? Math.round((stats.translated / stats.total) * 100) : 0;
                const isSelected = selectedLanguages.has(lang.code);
                
                return (
                  <div 
                    key={lang.code} 
                    className={`border rounded-lg p-3 ${isSelected ? 'bg-muted/50 border-primary' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {lang.code !== 'en' && (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectLanguage(lang.code, !!checked)}
                            aria-label={`Select ${lang.name}`}
                            className="mt-1"
                          />
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{lang.name}</span>
                            <Badge variant="outline" className="font-mono uppercase text-xs h-5">
                              {lang.code}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{lang.native_name}</p>
                          {lang.code !== 'en' && (
                            <div className="flex items-center gap-2 mt-2">
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">{progress}%</span>
                            </div>
                          )}
                          {lang.code === 'en' && (
                            <Badge variant="outline" className="text-xs mt-1">Primary</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1">
                          <Switch
                            checked={lang.is_active}
                            onCheckedChange={() => handleToggleActive(lang)}
                            disabled={lang.code === 'en' || toggleActive.isPending}
                            className="scale-90"
                          />
                          {lang.is_active ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <X className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEditLanguage(lang)}
                          >
                            <Settings2 className="h-3.5 w-3.5" />
                          </Button>
                          {lang.code !== 'en' && (
                            <Link to={`/admin/translations?lang=${lang.code}`}>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Globe className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredLanguages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No languages found matching your search.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editingLanguage} onOpenChange={(open) => !open && setEditingLanguage(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Language Settings</DialogTitle>
              <DialogDescription>
                Configure settings for {editingLanguage?.name} ({editingLanguage?.code})
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={editForm.sort_order}
                  onChange={(e) => setEditForm({ ...editForm, sort_order: parseInt(e.target.value) || 0 })}
                  min={0}
                />
                <p className="text-sm text-muted-foreground">
                  Lower numbers appear first in the language selector.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingLanguage(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={updateLanguage.isPending}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminLanguagesPage;
