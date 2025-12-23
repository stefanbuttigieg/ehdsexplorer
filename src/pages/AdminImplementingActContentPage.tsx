import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, Trash2, Edit, Save, X, ArrowLeft } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useImplementingAct } from "@/hooks/useImplementingActs";
import {
  useImplementingActRecitals,
  useImplementingActSections,
  useImplementingActArticles,
  ImplementingActRecital,
  ImplementingActSection,
  ImplementingActArticle,
} from "@/hooks/useImplementingActContent";
import Layout from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import MarkdownEditor from "@/components/MarkdownEditor";

const AdminImplementingActContentPage = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { data: act, isLoading: loadingAct } = useImplementingAct(id || "");
  const { data: recitals = [], isLoading: loadingRecitals } = useImplementingActRecitals(id || "");
  const { data: sections = [], isLoading: loadingSections } = useImplementingActSections(id || "");
  const { data: articles = [], isLoading: loadingArticles } = useImplementingActArticles(id || "");

  const [editingRecital, setEditingRecital] = useState<ImplementingActRecital | null>(null);
  const [editingArticle, setEditingArticle] = useState<ImplementingActArticle | null>(null);
  const [editingSection, setEditingSection] = useState<ImplementingActSection | null>(null);

  const [newRecitalOpen, setNewRecitalOpen] = useState(false);
  const [newArticleOpen, setNewArticleOpen] = useState(false);
  const [newSectionOpen, setNewSectionOpen] = useState(false);

  const [newRecital, setNewRecital] = useState({ recital_number: 1, content: "" });
  const [newArticle, setNewArticle] = useState({ article_number: 1, title: "", content: "", section_id: "" });
  const [newSection, setNewSection] = useState({ section_number: 1, title: "" });

  const isLoading = loadingAct || loadingRecitals || loadingSections || loadingArticles;

  // Mutations
  const addRecitalMutation = useMutation({
    mutationFn: async (data: typeof newRecital) => {
      const { error } = await supabase.from("implementing_act_recitals").insert({
        implementing_act_id: id,
        ...data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["implementing-act-recitals", id] });
      setNewRecitalOpen(false);
      setNewRecital({ recital_number: recitals.length + 1, content: "" });
      toast.success("Recital added");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  const updateRecitalMutation = useMutation({
    mutationFn: async (data: ImplementingActRecital) => {
      const { error } = await supabase.from("implementing_act_recitals").update({
        recital_number: data.recital_number,
        content: data.content,
      }).eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["implementing-act-recitals", id] });
      setEditingRecital(null);
      toast.success("Recital updated");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  const deleteRecitalMutation = useMutation({
    mutationFn: async (recitalId: string) => {
      const { error } = await supabase.from("implementing_act_recitals").delete().eq("id", recitalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["implementing-act-recitals", id] });
      toast.success("Recital deleted");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  const addSectionMutation = useMutation({
    mutationFn: async (data: typeof newSection) => {
      const { error } = await supabase.from("implementing_act_sections").insert({
        implementing_act_id: id,
        ...data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["implementing-act-sections", id] });
      setNewSectionOpen(false);
      setNewSection({ section_number: sections.length + 1, title: "" });
      toast.success("Section added");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  const updateSectionMutation = useMutation({
    mutationFn: async (data: ImplementingActSection) => {
      const { error } = await supabase.from("implementing_act_sections").update({
        section_number: data.section_number,
        title: data.title,
      }).eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["implementing-act-sections", id] });
      setEditingSection(null);
      toast.success("Section updated");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      const { error } = await supabase.from("implementing_act_sections").delete().eq("id", sectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["implementing-act-sections", id] });
      toast.success("Section deleted");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  const addArticleMutation = useMutation({
    mutationFn: async (data: typeof newArticle) => {
      const { error } = await supabase.from("implementing_act_articles").insert({
        implementing_act_id: id,
        article_number: data.article_number,
        title: data.title,
        content: data.content,
        section_id: data.section_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["implementing-act-articles", id] });
      setNewArticleOpen(false);
      setNewArticle({ article_number: articles.length + 1, title: "", content: "", section_id: "" });
      toast.success("Article added");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  const updateArticleMutation = useMutation({
    mutationFn: async (data: ImplementingActArticle) => {
      const { error } = await supabase.from("implementing_act_articles").update({
        article_number: data.article_number,
        title: data.title,
        content: data.content,
        section_id: data.section_id,
      }).eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["implementing-act-articles", id] });
      setEditingArticle(null);
      toast.success("Article updated");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  const deleteArticleMutation = useMutation({
    mutationFn: async (articleId: string) => {
      const { error } = await supabase.from("implementing_act_articles").delete().eq("id", articleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["implementing-act-articles", id] });
      toast.success("Article deleted");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto p-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }

  if (!act) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto p-6 text-center">
          <p className="text-muted-foreground">Implementing Act not found</p>
          <Link to="/admin/implementing-acts">
            <Button className="mt-4">Back to list</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Implementing Acts", href: "/admin/implementing-acts" },
            { label: act.articleReference },
          ]}
        />

        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin/implementing-acts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{act.title}</h1>
            <p className="text-muted-foreground">{act.articleReference}</p>
          </div>
        </div>

        <Tabs defaultValue="articles" className="space-y-6">
          <TabsList>
            <TabsTrigger value="articles">Articles ({articles.length})</TabsTrigger>
            <TabsTrigger value="recitals">Recitals ({recitals.length})</TabsTrigger>
            <TabsTrigger value="sections">Sections ({sections.length})</TabsTrigger>
          </TabsList>

          {/* Articles Tab */}
          <TabsContent value="articles">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Articles</CardTitle>
                <Dialog open={newArticleOpen} onOpenChange={setNewArticleOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" /> Add Article
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Article</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Article Number</Label>
                          <Input
                            type="number"
                            value={newArticle.article_number}
                            onChange={(e) => setNewArticle({ ...newArticle, article_number: parseInt(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label>Section (optional)</Label>
                          <Select
                            value={newArticle.section_id || "none"}
                            onValueChange={(v) => setNewArticle({ ...newArticle, section_id: v === "none" ? "" : v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="No section" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No section</SelectItem>
                              {sections.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  Section {s.section_number}: {s.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={newArticle.title}
                          onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Content</Label>
                        <MarkdownEditor
                          value={newArticle.content}
                          onChange={(v) => setNewArticle({ ...newArticle, content: v })}
                        />
                      </div>
                      <Button onClick={() => addArticleMutation.mutate(newArticle)} disabled={addArticleMutation.isPending}>
                        <Save className="h-4 w-4 mr-2" /> Save Article
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {articles.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No articles yet</p>
                ) : (
                  <div className="space-y-3">
                    {articles.map((article) => (
                      <div key={article.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">Art. {article.article_number}</Badge>
                          <span className="font-medium">{article.title}</span>
                          {article.section_id && (
                            <Badge variant="outline" className="text-xs">
                              {sections.find((s) => s.id === article.section_id)?.title}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingArticle(article)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteArticleMutation.mutate(article.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit Article Dialog */}
            <Dialog open={!!editingArticle} onOpenChange={() => setEditingArticle(null)}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Article</DialogTitle>
                </DialogHeader>
                {editingArticle && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Article Number</Label>
                        <Input
                          type="number"
                          value={editingArticle.article_number}
                          onChange={(e) =>
                            setEditingArticle({ ...editingArticle, article_number: parseInt(e.target.value) })
                          }
                        />
                      </div>
                      <div>
                        <Label>Section</Label>
                        <Select
                          value={editingArticle.section_id || "none"}
                          onValueChange={(v) => setEditingArticle({ ...editingArticle, section_id: v === "none" ? null : v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="No section" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No section</SelectItem>
                            {sections.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                Section {s.section_number}: {s.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={editingArticle.title}
                        onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Content</Label>
                      <MarkdownEditor
                        value={editingArticle.content}
                        onChange={(v) => setEditingArticle({ ...editingArticle, content: v })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => updateArticleMutation.mutate(editingArticle)}>
                        <Save className="h-4 w-4 mr-2" /> Save
                      </Button>
                      <Button variant="outline" onClick={() => setEditingArticle(null)}>
                        <X className="h-4 w-4 mr-2" /> Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Recitals Tab */}
          <TabsContent value="recitals">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Recitals</CardTitle>
                <Dialog open={newRecitalOpen} onOpenChange={setNewRecitalOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" /> Add Recital
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Recital</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Recital Number</Label>
                        <Input
                          type="number"
                          value={newRecital.recital_number}
                          onChange={(e) => setNewRecital({ ...newRecital, recital_number: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Content</Label>
                        <MarkdownEditor
                          value={newRecital.content}
                          onChange={(v) => setNewRecital({ ...newRecital, content: v })}
                        />
                      </div>
                      <Button onClick={() => addRecitalMutation.mutate(newRecital)} disabled={addRecitalMutation.isPending}>
                        <Save className="h-4 w-4 mr-2" /> Save Recital
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {recitals.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No recitals yet</p>
                ) : (
                  <div className="space-y-3">
                    {recitals.map((recital) => (
                      <div key={recital.id} className="flex items-start justify-between p-3 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <Badge variant="outline">({recital.recital_number})</Badge>
                          <p className="text-sm line-clamp-2">{recital.content}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingRecital(recital)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteRecitalMutation.mutate(recital.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit Recital Dialog */}
            <Dialog open={!!editingRecital} onOpenChange={() => setEditingRecital(null)}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Recital</DialogTitle>
                </DialogHeader>
                {editingRecital && (
                  <div className="space-y-4">
                    <div>
                      <Label>Recital Number</Label>
                      <Input
                        type="number"
                        value={editingRecital.recital_number}
                        onChange={(e) =>
                          setEditingRecital({ ...editingRecital, recital_number: parseInt(e.target.value) })
                        }
                      />
                    </div>
                    <div>
                      <Label>Content</Label>
                      <MarkdownEditor
                        value={editingRecital.content}
                        onChange={(v) => setEditingRecital({ ...editingRecital, content: v })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => updateRecitalMutation.mutate(editingRecital)}>
                        <Save className="h-4 w-4 mr-2" /> Save
                      </Button>
                      <Button variant="outline" onClick={() => setEditingRecital(null)}>
                        <X className="h-4 w-4 mr-2" /> Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Sections Tab */}
          <TabsContent value="sections">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Sections</CardTitle>
                <Dialog open={newSectionOpen} onOpenChange={setNewSectionOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" /> Add Section
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Section</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Section Number</Label>
                        <Input
                          type="number"
                          value={newSection.section_number}
                          onChange={(e) => setNewSection({ ...newSection, section_number: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={newSection.title}
                          onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                        />
                      </div>
                      <Button onClick={() => addSectionMutation.mutate(newSection)} disabled={addSectionMutation.isPending}>
                        <Save className="h-4 w-4 mr-2" /> Save Section
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {sections.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No sections yet</p>
                ) : (
                  <div className="space-y-3">
                    {sections.map((section) => (
                      <div key={section.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">Section {section.section_number}</Badge>
                          <span className="font-medium">{section.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {articles.filter((a) => a.section_id === section.id).length} articles
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingSection(section)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteSectionMutation.mutate(section.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit Section Dialog */}
            <Dialog open={!!editingSection} onOpenChange={() => setEditingSection(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Section</DialogTitle>
                </DialogHeader>
                {editingSection && (
                  <div className="space-y-4">
                    <div>
                      <Label>Section Number</Label>
                      <Input
                        type="number"
                        value={editingSection.section_number}
                        onChange={(e) =>
                          setEditingSection({ ...editingSection, section_number: parseInt(e.target.value) })
                        }
                      />
                    </div>
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={editingSection.title}
                        onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => updateSectionMutation.mutate(editingSection)}>
                        <Save className="h-4 w-4 mr-2" /> Save
                      </Button>
                      <Button variant="outline" onClick={() => setEditingSection(null)}>
                        <X className="h-4 w-4 mr-2" /> Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminImplementingActContentPage;
