import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, GripVertical, Save, X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useOnboardingSteps, useOnboardingStepsMutations, OnboardingStep } from "@/hooks/useOnboardingSteps";
import { useAuth } from "@/hooks/useAuth";

const ICON_OPTIONS = [
  { value: "book", label: "Book" },
  { value: "bookmark", label: "Bookmark" },
  { value: "bell", label: "Bell" },
  { value: "users", label: "Users" },
  { value: "star", label: "Star" },
  { value: "sparkles", label: "Sparkles" },
  { value: "check", label: "Check" },
];

export default function AdminOnboardingPage() {
  const navigate = useNavigate();
  const { isEditor, loading } = useAuth();
  const { data: steps, isLoading } = useOnboardingSteps();
  const { createStep, updateStep, deleteStep } = useOnboardingStepsMutations();
  const [editingStep, setEditingStep] = useState<OnboardingStep | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon: "star",
    step_order: 1,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      icon: "star",
      step_order: (steps?.length || 0) + 1,
      is_active: true,
    });
    setEditingStep(null);
    setIsCreating(false);
  };

  const handleEdit = (step: OnboardingStep) => {
    setEditingStep(step);
    setFormData({
      title: step.title,
      description: step.description,
      icon: step.icon,
      step_order: step.step_order,
      is_active: step.is_active,
    });
    setIsCreating(true);
  };

  const handleSubmit = async () => {
    if (editingStep) {
      await updateStep.mutateAsync({ id: editingStep.id, ...formData });
    } else {
      await createStep.mutateAsync(formData);
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteStep.mutateAsync(id);
  };

  const handleToggleActive = async (step: OnboardingStep) => {
    await updateStep.mutateAsync({ id: step.id, is_active: !step.is_active });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isEditor) {
    navigate("/admin/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Onboarding Flow</h1>
            <p className="text-sm text-muted-foreground">
              Manage the onboarding steps shown to new users
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Add/Edit Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{isCreating ? (editingStep ? "Edit Step" : "Add New Step") : "Onboarding Steps"}</CardTitle>
            <CardDescription>
              {isCreating
                ? "Configure the onboarding step details"
                : "Create and manage the steps in your user onboarding flow"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isCreating ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Explore the Regulation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="icon">Icon</Label>
                    <Select
                      value={formData.icon}
                      onValueChange={(value) => setFormData({ ...formData, icon: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what this step covers..."
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="step_order">Step Order</Label>
                    <Input
                      id="step_order"
                      type="number"
                      min={1}
                      value={formData.step_order}
                      onChange={(e) => setFormData({ ...formData, step_order: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-7">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSubmit} disabled={createStep.isPending || updateStep.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {editingStep ? "Update Step" : "Create Step"}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Onboarding Step
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Steps List */}
        <div className="space-y-3">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-48 mb-2" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : steps && steps.length > 0 ? (
            steps.map((step) => (
              <Card key={step.id} className={step.is_active ? "" : "opacity-60"}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GripVertical className="h-5 w-5" />
                      <span className="font-mono text-sm w-6 text-center">{step.step_order}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{step.title}</h3>
                        {!step.is_active && (
                          <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{step.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">Icon: {step.icon}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(step)}
                        title={step.is_active ? "Hide step" : "Show step"}
                      >
                        {step.is_active ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(step)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Onboarding Step</DialogTitle>
                          </DialogHeader>
                          <p className="text-muted-foreground">
                            Are you sure you want to delete "{step.title}"? This action cannot be undone.
                          </p>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <DialogClose asChild>
                              <Button variant="destructive" onClick={() => handleDelete(step.id)}>
                                Delete
                              </Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <p>No onboarding steps created yet.</p>
                <p className="text-sm mt-1">Create your first step to guide new users.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
