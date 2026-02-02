import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePublishedWorks, PublishedWork } from "@/hooks/usePublishedWorks";
import { useArticles } from "@/hooks/useArticles";
import { useImplementingActs } from "@/hooks/useImplementingActs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2, ExternalLink, Bot, Flag, Loader2, Search } from "lucide-react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";

const AdminPublishedWorksPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isEditor, loading: authLoading } = useAuth();
  const { data: publishedWorks, isLoading } = usePublishedWorks();
  const { data: articles } = useArticles();
  const { data: implementingActs } = useImplementingActs();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWork, setSelectedWork] = useState<PublishedWork | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchingPapers, setSearchingPapers] = useState(false);

  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [affiliatedOrganization, setAffiliatedOrganization] = useState("");
  const [relatedArticles, setRelatedArticles] = useState<number[]>([]);
  const [relatedImplementingActs, setRelatedImplementingActs] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/admin/auth");
    } else if (!authLoading && user && !isAdmin && !isEditor) {
      navigate("/");
    }
  }, [user, isAdmin, isEditor, authLoading, navigate]);

  const resetForm = () => {
    setName("");
    setLink("");
    setAffiliatedOrganization("");
    setRelatedArticles([]);
    setRelatedImplementingActs([]);
    setSelectedWork(null);
  };

  const openEditDialog = (work: PublishedWork) => {
    setSelectedWork(work);
    setName(work.name);
    setLink(work.link);
    setAffiliatedOrganization(work.affiliated_organization);
    setRelatedArticles(work.related_articles || []);
    setRelatedImplementingActs(work.related_implementing_acts || []);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !link.trim() || !affiliatedOrganization.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const workData = {
        name: name.trim(),
        link: link.trim(),
        affiliated_organization: affiliatedOrganization.trim(),
        related_articles: relatedArticles,
        related_implementing_acts: relatedImplementingActs,
      };

      if (selectedWork) {
        const { error } = await supabase
          .from("published_works")
          .update(workData)
          .eq("id", selectedWork.id);

        if (error) throw error;
        toast.success("Published work updated successfully");
      } else {
        const { error } = await supabase
          .from("published_works")
          .insert([workData]);

        if (error) throw error;
        toast.success("Published work created successfully");
      }

      queryClient.invalidateQueries({ queryKey: ["published-works"] });
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to save published work");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedWork) return;

    try {
      const { error } = await supabase
        .from("published_works")
        .delete()
        .eq("id", selectedWork.id);

      if (error) throw error;
      toast.success("Published work deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["published-works"] });
      setDeleteDialogOpen(false);
      setSelectedWork(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete published work");
    }
  };

  const toggleArticle = (articleNumber: number) => {
    setRelatedArticles((prev) =>
      prev.includes(articleNumber)
        ? prev.filter((a) => a !== articleNumber)
        : [...prev, articleNumber]
    );
  };

  const toggleImplementingAct = (actId: string) => {
    setRelatedImplementingActs((prev) =>
      prev.includes(actId)
        ? prev.filter((a) => a !== actId)
        : [...prev, actId]
    );
  };

  const handleSearchPapers = async () => {
    setSearchingPapers(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-ehds-papers');
      
      if (error) throw error;
      
      if (data.success) {
        toast.success(`Found ${data.found} papers, added ${data.added} new entries`);
        queryClient.invalidateQueries({ queryKey: ["published-works"] });
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to search for papers");
    } finally {
      setSearchingPapers(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Manage Published Works</h1>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
            <CardTitle>Published Works</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSearchPapers}
                disabled={searchingPapers}
              >
                {searchingPapers ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Search EHDS Papers
              </Button>
              <Button
                onClick={() => {
                  resetForm();
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Published Work
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Affiliated Organisation</TableHead>
                  <TableHead>Related Articles</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {publishedWorks?.map((work) => (
                  <TableRow key={work.id} className={work.is_flagged ? "bg-destructive/10" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{work.name}</span>
                        {work.is_auto_discovered && (
                          <Badge variant="secondary" className="text-xs">
                            <Bot className="h-3 w-3 mr-1" />
                            Auto
                          </Badge>
                        )}
                        {work.is_flagged && (
                          <Badge variant="destructive" className="text-xs">
                            <Flag className="h-3 w-3 mr-1" />
                            Flagged
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                      {work.affiliated_organization}
                    </TableCell>
                    <TableCell>
                      {work.related_articles?.length || 0} articles
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(work.link, "_blank")}
                          title="Open link"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(work)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedWork(work);
                            setDeleteDialogOpen(true);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!publishedWorks || publishedWorks.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No published works yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedWork ? "Edit Published Work" : "Add Published Work"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name of Published Work *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link">Link *</Label>
                <Input
                  id="link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org">Affiliated Organisation *</Label>
                <Input
                  id="org"
                  value={affiliatedOrganization}
                  onChange={(e) => setAffiliatedOrganization(e.target.value)}
                  placeholder="Enter organisation name"
                />
              </div>
              <div className="space-y-2">
                <Label>Related Articles</Label>
                <ScrollArea className="h-40 border rounded-md p-3">
                  <div className="grid grid-cols-4 gap-2">
                    {articles?.map((article) => (
                      <div
                        key={article.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`article-${article.article_number}`}
                          checked={relatedArticles.includes(article.article_number)}
                          onCheckedChange={() => toggleArticle(article.article_number)}
                        />
                        <Label
                          htmlFor={`article-${article.article_number}`}
                          className="text-sm cursor-pointer"
                        >
                          Art. {article.article_number}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div className="space-y-2">
                <Label>Related Implementing Acts</Label>
                <ScrollArea className="h-40 border rounded-md p-3">
                  <div className="space-y-2">
                    {implementingActs?.map((act) => (
                      <div key={act.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`act-${act.id}`}
                          checked={relatedImplementingActs.includes(act.id)}
                          onCheckedChange={() => toggleImplementingAct(act.id)}
                        />
                        <Label
                          htmlFor={`act-${act.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {act.title}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Published Work</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedWork?.name}"? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default AdminPublishedWorksPage;
