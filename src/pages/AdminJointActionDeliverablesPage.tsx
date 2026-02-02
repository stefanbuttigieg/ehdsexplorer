import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useJointActionDeliverables, JointActionDeliverable, projectTypeLabels } from "@/hooks/useJointActionDeliverables";
import { useArticles } from "@/hooks/useArticles";
import { useImplementingActs } from "@/hooks/useImplementingActs";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogTrigger,
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Pencil, Trash2, ExternalLink, Loader2 } from "lucide-react";

const AdminJointActionDeliverablesPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isEditor, loading: authLoading } = useAuth();
  const { data: deliverables, isLoading } = useJointActionDeliverables();
  const { data: articles } = useArticles();
  const { data: implementingActs } = useImplementingActs();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<JointActionDeliverable | null>(null);
  const [formData, setFormData] = useState({
    joint_action_name: "",
    deliverable_name: "",
    deliverable_link: "",
    project_type: "joint_action",
    related_articles: [] as number[],
    related_implementing_acts: [] as string[],
  });
  const [isSaving, setIsSaving] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (!isAdmin && !isEditor)) {
    navigate("/admin/auth");
    return null;
  }

  const resetForm = () => {
    setFormData({
      joint_action_name: "",
      deliverable_name: "",
      deliverable_link: "",
      project_type: "joint_action",
      related_articles: [],
      related_implementing_acts: [],
    });
    setSelectedDeliverable(null);
  };

  const openEditDialog = (deliverable: JointActionDeliverable) => {
    setSelectedDeliverable(deliverable);
    setFormData({
      joint_action_name: deliverable.joint_action_name,
      deliverable_name: deliverable.deliverable_name,
      deliverable_link: deliverable.deliverable_link,
      project_type: deliverable.project_type || "joint_action",
      related_articles: deliverable.related_articles || [],
      related_implementing_acts: deliverable.related_implementing_acts || [],
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.joint_action_name || !formData.deliverable_name || !formData.deliverable_link) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (selectedDeliverable) {
        const { error } = await supabase
          .from("joint_action_deliverables")
          .update({
            joint_action_name: formData.joint_action_name,
            deliverable_name: formData.deliverable_name,
            deliverable_link: formData.deliverable_link,
            project_type: formData.project_type,
            related_articles: formData.related_articles,
            related_implementing_acts: formData.related_implementing_acts,
          })
          .eq("id", selectedDeliverable.id);

        if (error) throw error;
        toast({ title: "Success", description: "Deliverable updated successfully." });
      } else {
        const { error } = await supabase.from("joint_action_deliverables").insert({
          joint_action_name: formData.joint_action_name,
          deliverable_name: formData.deliverable_name,
          deliverable_link: formData.deliverable_link,
          project_type: formData.project_type,
          related_articles: formData.related_articles,
          related_implementing_acts: formData.related_implementing_acts,
        });

        if (error) throw error;
        toast({ title: "Success", description: "Deliverable created successfully." });
      }

      queryClient.invalidateQueries({ queryKey: ["joint-action-deliverables"] });
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save deliverable.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDeliverable) return;

    try {
      const { error } = await supabase
        .from("joint_action_deliverables")
        .delete()
        .eq("id", selectedDeliverable.id);

      if (error) throw error;

      toast({ title: "Success", description: "Deliverable deleted successfully." });
      queryClient.invalidateQueries({ queryKey: ["joint-action-deliverables"] });
      setDeleteDialogOpen(false);
      setSelectedDeliverable(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete deliverable.",
        variant: "destructive",
      });
    }
  };

  const toggleArticle = (articleNumber: number) => {
    setFormData((prev) => ({
      ...prev,
      related_articles: prev.related_articles.includes(articleNumber)
        ? prev.related_articles.filter((a) => a !== articleNumber)
        : [...prev.related_articles, articleNumber],
    }));
  };

  const toggleImplementingAct = (actId: string) => {
    setFormData((prev) => ({
      ...prev,
      related_implementing_acts: prev.related_implementing_acts.includes(actId)
        ? prev.related_implementing_acts.filter((a) => a !== actId)
        : [...prev.related_implementing_acts, actId],
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">EU Project Deliverables</h1>
            <p className="text-muted-foreground">
              Manage links between articles, implementing acts and EU project deliverables
            </p>
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Deliverable
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>
                  {selectedDeliverable ? "Edit Deliverable" : "Add Deliverable"}
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="joint_action_name">EU Project Name *</Label>
                    <Input
                      id="joint_action_name"
                      value={formData.joint_action_name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, joint_action_name: e.target.value }))
                      }
                      placeholder="e.g., TEHDAS2, BeWell, Xt-EHR"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="project_type">Project Type *</Label>
                    <Select
                      value={formData.project_type}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, project_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(projectTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliverable_name">Deliverable Name *</Label>
                    <Input
                      id="deliverable_name"
                      value={formData.deliverable_name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, deliverable_name: e.target.value }))
                      }
                      placeholder="e.g., Data Quality Framework"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliverable_link">Deliverable Link *</Label>
                    <Input
                      id="deliverable_link"
                      type="url"
                      value={formData.deliverable_link}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, deliverable_link: e.target.value }))
                      }
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Related Articles</Label>
                    <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                      <div className="grid grid-cols-5 gap-2">
                        {articles?.map((article) => (
                          <div key={article.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`article-${article.article_number}`}
                              checked={formData.related_articles.includes(article.article_number)}
                              onCheckedChange={() => toggleArticle(article.article_number)}
                            />
                            <label
                              htmlFor={`article-${article.article_number}`}
                              className="text-sm cursor-pointer"
                            >
                              Art. {article.article_number}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Related Implementing Acts</Label>
                    <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                      <div className="space-y-2">
                        {implementingActs?.map((act) => (
                          <div key={act.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`act-${act.id}`}
                              checked={formData.related_implementing_acts.includes(act.id)}
                              onCheckedChange={() => toggleImplementingAct(act.id)}
                            />
                            <label
                              htmlFor={`act-${act.id}`}
                              className="text-sm cursor-pointer"
                            >
                              {act.articleReference} - {act.title}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {selectedDeliverable ? "Update" : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>EU Project</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Deliverable</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Related Articles</TableHead>
                  <TableHead>Related Acts</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliverables?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No EU project deliverables yet. Click "Add Deliverable" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  deliverables?.map((deliverable) => (
                    <TableRow key={deliverable.id}>
                      <TableCell className="font-medium">{deliverable.joint_action_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {projectTypeLabels[deliverable.project_type] || deliverable.project_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{deliverable.deliverable_name}</TableCell>
                      <TableCell>
                        <a
                          href={deliverable.deliverable_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
                        </a>
                      </TableCell>
                      <TableCell>
                        {deliverable.related_articles?.length > 0
                          ? deliverable.related_articles.map((a) => `Art. ${a}`).join(", ")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {deliverable.related_implementing_acts?.length > 0
                          ? `${deliverable.related_implementing_acts.length} act(s)`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(deliverable)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedDeliverable(deliverable);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Deliverable</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedDeliverable?.deliverable_name}"? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default AdminJointActionDeliverablesPage;