import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import {
  useHelpCenterFaqs,
  useCreateFaq,
  useUpdateFaq,
  useDeleteFaq,
  useFaqCategories,
  HelpCenterFaq,
  HelpCenterFaqInsert,
} from '@/hooks/useHelpCenterFaq';

const AdminHelpCenterFaqPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isEditor, loading } = useAuth();
  const { data: faqs, isLoading } = useHelpCenterFaqs();
  const createFaq = useCreateFaq();
  const updateFaq = useUpdateFaq();
  const deleteFaq = useDeleteFaq();
  const categories = useFaqCategories();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<HelpCenterFaq | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<HelpCenterFaqInsert>({
    question: '',
    answer: '',
    category: 'general',
    sort_order: 0,
    is_published: true,
  });

  // Auth check
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user || (!isAdmin && !isEditor)) {
    navigate('/admin/auth');
    return null;
  }

  const handleOpenDialog = (faq?: HelpCenterFaq) => {
    if (faq) {
      setEditingFaq(faq);
      setFormData({
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        sort_order: faq.sort_order,
        is_published: faq.is_published,
      });
    } else {
      setEditingFaq(null);
      setFormData({
        question: '',
        answer: '',
        category: 'general',
        sort_order: faqs ? Math.max(0, ...faqs.map(f => f.sort_order)) + 1 : 0,
        is_published: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingFaq) {
      await updateFaq.mutateAsync({ id: editingFaq.id, ...formData });
    } else {
      await createFaq.mutateAsync(formData);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteFaq.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleTogglePublished = async (faq: HelpCenterFaq) => {
    await updateFaq.mutateAsync({ id: faq.id, is_published: !faq.is_published });
  };

  const getCategoryLabel = (value: string) => {
    return categories.find(c => c.value === value)?.label || value;
  };

  // Group FAQs by category
  const groupedFaqs = faqs?.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, HelpCenterFaq[]>) || {};

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold font-serif">Help Center FAQs</h1>
              <p className="text-muted-foreground mt-1">
                Manage frequently asked questions displayed on the help page
              </p>
            </div>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Add FAQ
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total FAQs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{faqs?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {faqs?.filter(f => f.is_published).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(groupedFaqs).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              All FAQs
            </CardTitle>
            <CardDescription>
              Click on a row to edit, or use the action buttons
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : faqs?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No FAQs yet. Click "Add FAQ" to create one.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Order</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead className="w-32">Category</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faqs?.map((faq) => (
                    <TableRow 
                      key={faq.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleOpenDialog(faq)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          {faq.sort_order}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium line-clamp-2">{faq.question}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {faq.answer.substring(0, 100)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getCategoryLabel(faq.category)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={faq.is_published ? 'default' : 'secondary'}>
                          {faq.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleTogglePublished(faq)}
                            title={faq.is_published ? 'Unpublish' : 'Publish'}
                          >
                            {faq.is_published ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(faq)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(faq.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingFaq ? 'Edit FAQ' : 'Create FAQ'}</DialogTitle>
              <DialogDescription>
                {editingFaq 
                  ? 'Update the FAQ question and answer'
                  : 'Add a new frequently asked question'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="question">Question</Label>
                <Input
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="What is the EHDS Regulation?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="answer">Answer</Label>
                <Textarea
                  id="answer"
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="The EHDS is..."
                  rows={6}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label htmlFor="is_published">Published</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.question || !formData.answer || createFaq.isPending || updateFaq.isPending}
              >
                {editingFaq ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete FAQ?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this FAQ.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default AdminHelpCenterFaqPage;
