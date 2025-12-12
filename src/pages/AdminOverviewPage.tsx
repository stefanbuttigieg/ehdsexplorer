import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { usePageContent, useUpdatePageContent, OverviewContent } from '@/hooks/usePageContent';

const AdminOverviewPage = () => {
  const { user, loading, isEditor } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: page, isLoading } = usePageContent('overview');
  const updatePage = useUpdatePageContent();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState<OverviewContent | null>(null);

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setContent(page.content);
    }
  }, [page]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/auth');
    } else if (!loading && user && !isEditor) {
      navigate('/');
    }
  }, [user, loading, isEditor, navigate]);

  const handleSave = async () => {
    if (!content) return;
    
    try {
      await updatePage.mutateAsync({ id: 'overview', title, content });
      toast({ title: 'Saved', description: 'Overview page updated successfully.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const updatePoint = (idx: number, field: 'title' | 'description', value: string) => {
    if (!content) return;
    const newPoints = [...content.what_is_ehds.points];
    newPoints[idx] = { ...newPoints[idx], [field]: value };
    setContent({ ...content, what_is_ehds: { ...content.what_is_ehds, points: newPoints } });
  };

  const updateComponent = (idx: number, field: 'title' | 'description', value: string) => {
    if (!content) return;
    const newItems = [...content.key_components.items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setContent({ ...content, key_components: { ...content.key_components, items: newItems } });
  };

  const updateDate = (idx: number, field: 'label' | 'date', value: string) => {
    if (!content) return;
    const newDates = [...content.key_dates.dates];
    newDates[idx] = { ...newDates[idx], [field]: value };
    setContent({ ...content, key_dates: { ...content.key_dates, dates: newDates } });
  };

  const addDate = () => {
    if (!content) return;
    setContent({
      ...content,
      key_dates: {
        ...content.key_dates,
        dates: [...content.key_dates.dates, { label: '', date: '' }]
      }
    });
  };

  const removeDate = (idx: number) => {
    if (!content) return;
    const newDates = content.key_dates.dates.filter((_, i) => i !== idx);
    setContent({ ...content, key_dates: { ...content.key_dates, dates: newDates } });
  };

  if (loading || !user || !isEditor) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  if (isLoading || !content) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold font-serif">Manage Overview Page</h1>
              <p className="text-muted-foreground">Edit the overview page content</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={updatePage.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updatePage.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardHeader><CardTitle>Page Header</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Page Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input value={content.subtitle} onChange={(e) => setContent({ ...content, subtitle: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Regulation Reference</Label>
                <Input value={content.regulation_reference} onChange={(e) => setContent({ ...content, regulation_reference: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          {/* What is EHDS */}
          <Card>
            <CardHeader><CardTitle>What is the EHDS?</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input value={content.what_is_ehds.title} onChange={(e) => setContent({ ...content, what_is_ehds: { ...content.what_is_ehds, title: e.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>Introduction</Label>
                <Textarea value={content.what_is_ehds.intro} onChange={(e) => setContent({ ...content, what_is_ehds: { ...content.what_is_ehds, intro: e.target.value } })} rows={3} />
              </div>
              <Label>Key Points</Label>
              {content.what_is_ehds.points.map((point, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_2fr] gap-2 p-3 bg-muted rounded-lg">
                  <Input placeholder="Title" value={point.title} onChange={(e) => updatePoint(idx, 'title', e.target.value)} />
                  <Input placeholder="Description" value={point.description} onChange={(e) => updatePoint(idx, 'description', e.target.value)} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Key Components */}
          <Card>
            <CardHeader><CardTitle>Key Components</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input value={content.key_components.title} onChange={(e) => setContent({ ...content, key_components: { ...content.key_components, title: e.target.value } })} />
              </div>
              {content.key_components.items.map((item, idx) => (
                <div key={idx} className="p-3 bg-muted rounded-lg space-y-2">
                  <Input placeholder="Title" value={item.title} onChange={(e) => updateComponent(idx, 'title', e.target.value)} />
                  <Textarea placeholder="Description" value={item.description} onChange={(e) => updateComponent(idx, 'description', e.target.value)} rows={2} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Key Dates */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Key Dates</CardTitle>
                <Button variant="outline" size="sm" onClick={addDate}>
                  <Plus className="h-4 w-4 mr-1" /> Add Date
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input value={content.key_dates.title} onChange={(e) => setContent({ ...content, key_dates: { ...content.key_dates, title: e.target.value } })} />
              </div>
              {content.key_dates.dates.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Input placeholder="Label" value={item.label} onChange={(e) => updateDate(idx, 'label', e.target.value)} className="flex-1" />
                  <Input placeholder="Date" value={item.date} onChange={(e) => updateDate(idx, 'date', e.target.value)} className="w-40" />
                  <Button variant="ghost" size="icon" onClick={() => removeDate(idx)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AdminOverviewPage;
