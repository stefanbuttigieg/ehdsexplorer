import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { usePageContent, useUpdatePageContent } from '@/hooks/usePageContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Save, Plus, Trash2, ArrowUp, ArrowDown, FileText, Shield, Cookie, Scale } from 'lucide-react';

interface LegalSection {
  title: string;
  content: string;
}

interface LegalPageData {
  last_updated: string;
  sections: LegalSection[];
}

const LEGAL_PAGES = [
  { id: 'privacy-policy', title: 'Privacy Policy', icon: Shield },
  { id: 'cookies-policy', title: 'Cookies Policy', icon: Cookie },
  { id: 'terms-of-service', title: 'Terms of Service', icon: Scale },
  { id: 'accessibility-statement', title: 'Accessibility Statement', icon: FileText },
];

const AdminLegalPagesPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isEditor } = useAuth();
  const [activeTab, setActiveTab] = useState('privacy-policy');
  const [pageData, setPageData] = useState<Record<string, { title: string; content: LegalPageData }>>({});

  const privacyQuery = usePageContent('privacy-policy');
  const cookiesQuery = usePageContent('cookies-policy');
  const termsQuery = usePageContent('terms-of-service');
  const accessibilityQuery = usePageContent('accessibility-statement');
  const updatePage = useUpdatePageContent();

  const isLoading = privacyQuery.isLoading || cookiesQuery.isLoading || termsQuery.isLoading || accessibilityQuery.isLoading;

  useEffect(() => {
    if (!authLoading && (!user || !isEditor)) {
      navigate('/admin/auth');
    }
  }, [user, authLoading, isEditor, navigate]);

  useEffect(() => {
    const queries = {
      'privacy-policy': privacyQuery.data,
      'cookies-policy': cookiesQuery.data,
      'terms-of-service': termsQuery.data,
      'accessibility-statement': accessibilityQuery.data,
    };

    const newPageData: Record<string, { title: string; content: LegalPageData }> = {};
    
    Object.entries(queries).forEach(([id, data]) => {
      if (data) {
        newPageData[id] = {
          title: data.title,
          content: data.content as unknown as LegalPageData,
        };
      } else {
        const pageInfo = LEGAL_PAGES.find(p => p.id === id);
        newPageData[id] = {
          title: pageInfo?.title || id,
          content: { last_updated: new Date().toISOString().split('T')[0], sections: [] },
        };
      }
    });

    setPageData(newPageData);
  }, [privacyQuery.data, cookiesQuery.data, termsQuery.data, accessibilityQuery.data]);

  const handleSave = async (pageId: string) => {
    const data = pageData[pageId];
    if (!data) return;

    try {
      await updatePage.mutateAsync({
        id: pageId,
        title: data.title,
        content: {
          ...data.content,
          last_updated: new Date().toISOString().split('T')[0],
        },
      });
      toast.success('Page saved successfully');
    } catch {
      toast.error('Failed to save page');
    }
  };

  const updateSection = (pageId: string, index: number, field: 'title' | 'content', value: string) => {
    setPageData(prev => {
      const page = prev[pageId];
      if (!page) return prev;
      
      const newSections = [...page.content.sections];
      newSections[index] = { ...newSections[index], [field]: value };
      
      return {
        ...prev,
        [pageId]: {
          ...page,
          content: { ...page.content, sections: newSections },
        },
      };
    });
  };

  const addSection = (pageId: string) => {
    setPageData(prev => {
      const page = prev[pageId];
      if (!page) return prev;
      
      return {
        ...prev,
        [pageId]: {
          ...page,
          content: {
            ...page.content,
            sections: [...page.content.sections, { title: 'New Section', content: '' }],
          },
        },
      };
    });
  };

  const removeSection = (pageId: string, index: number) => {
    setPageData(prev => {
      const page = prev[pageId];
      if (!page) return prev;
      
      const newSections = page.content.sections.filter((_, i) => i !== index);
      
      return {
        ...prev,
        [pageId]: {
          ...page,
          content: { ...page.content, sections: newSections },
        },
      };
    });
  };

  const moveSection = (pageId: string, index: number, direction: 'up' | 'down') => {
    setPageData(prev => {
      const page = prev[pageId];
      if (!page) return prev;
      
      const newSections = [...page.content.sections];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (newIndex < 0 || newIndex >= newSections.length) return prev;
      
      [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
      
      return {
        ...prev,
        [pageId]: {
          ...page,
          content: { ...page.content, sections: newSections },
        },
      };
    });
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Legal Pages</h1>
        </div>
        <p className="text-muted-foreground mb-6">
          Manage Privacy Policy, Cookies Policy, Terms of Service, and Accessibility Statement content.
          Content supports Markdown formatting including headers (###), lists, links, and tables.
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6">
            {LEGAL_PAGES.map(page => {
              const Icon = page.icon;
              return (
                <TabsTrigger key={page.id} value={page.id} className="gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{page.title}</span>
                  <span className="sm:hidden">{page.title.split(' ')[0]}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {LEGAL_PAGES.map(page => {
            const data = pageData[page.id];
            const sections = data?.content?.sections || [];

            return (
              <TabsContent key={page.id} value={page.id}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Last Updated</Label>
                      <p className="text-sm text-muted-foreground">
                        {data?.content?.last_updated || 'Not set'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => addSection(page.id)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Section
                      </Button>
                      <Button onClick={() => handleSave(page.id)} disabled={updatePage.isPending}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </div>

                  {sections.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        No sections yet. Click "Add Section" to start adding content.
                      </CardContent>
                    </Card>
                  ) : (
                    sections.map((section, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Section {index + 1}</CardTitle>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveSection(page.id, index, 'up')}
                                disabled={index === 0}
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveSection(page.id, index, 'down')}
                                disabled={index === sections.length - 1}
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeSection(page.id, index)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label>Section Title</Label>
                            <Input
                              value={section.title}
                              onChange={(e) => updateSection(page.id, index, 'title', e.target.value)}
                              placeholder="e.g., 1. Introduction"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Content (Markdown supported)</Label>
                            <Textarea
                              value={section.content}
                              onChange={(e) => updateSection(page.id, index, 'content', e.target.value)}
                              placeholder="Enter section content... Supports **bold**, [links](url), ### headers, - lists, and | tables |"
                              rows={8}
                              className="font-mono text-sm"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminLegalPagesPage;
