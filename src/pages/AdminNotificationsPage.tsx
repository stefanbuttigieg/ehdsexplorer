import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Bell, Plus, Trash2, Edit, Power, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  useNotifications,
  useCreateNotification,
  useUpdateNotification,
  useDeleteNotification,
  Notification,
} from "@/hooks/useNotifications";
import { format } from "date-fns";

const AdminNotificationsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isEditor, loading: authLoading } = useAuth();
  const { data: notifications = [], isLoading } = useNotifications();
  const createMutation = useCreateNotification();
  const updateMutation = useUpdateNotification();
  const deleteMutation = useDeleteNotification();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info" as Notification["type"],
    is_active: true,
    expires_at: "",
  });

  useEffect(() => {
    if (!authLoading && (!user || !isEditor)) {
      navigate("/admin/auth");
    }
  }, [user, isEditor, authLoading, navigate]);

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      type: "info",
      is_active: true,
      expires_at: "",
    });
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (notification: Notification) => {
    setFormData({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      is_active: notification.is_active,
      expires_at: notification.expires_at ? notification.expires_at.slice(0, 16) : "",
    });
    setEditingId(notification.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast({ title: "Error", description: "Title and message are required", variant: "destructive" });
      return;
    }

    try {
      const payload = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type,
        is_active: formData.is_active,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
      };

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...payload });
        toast({ title: "Success", description: "Notification updated" });
      } else {
        await createMutation.mutateAsync(payload);
        toast({ title: "Success", description: "Notification created" });
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save notification", variant: "destructive" });
    }
  };

  const handleToggleActive = async (notification: Notification) => {
    try {
      await updateMutation.mutateAsync({ id: notification.id, is_active: !notification.is_active });
      toast({ title: "Success", description: `Notification ${notification.is_active ? "deactivated" : "activated"}` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update notification", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Success", description: "Notification deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete notification", variant: "destructive" });
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="p-6 max-w-4xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const typeColors: Record<Notification["type"], string> = {
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto animate-fade-in">
        <div className="mb-6">
          <Link to="/admin">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-6 w-6" />
              <h1 className="text-2xl font-bold font-serif">Notifications</h1>
            </div>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Notification
            </Button>
          </div>
        </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No notifications yet. Create one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className={!notification.is_active ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{notification.title}</h3>
                      <Badge className={typeColors[notification.type]}>{notification.type}</Badge>
                      {!notification.is_active && <Badge variant="outline">Inactive</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                    <div className="text-xs text-muted-foreground">
                      Created: {format(new Date(notification.created_at), "PPp")}
                      {notification.expires_at && (
                        <> · Expires: {format(new Date(notification.expires_at), "PPp")}</>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleToggleActive(notification)}>
                      <Power className={`h-4 w-4 ${notification.is_active ? "text-green-500" : "text-muted-foreground"}`} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(notification)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(notification.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Notification" : "Create Notification"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Notification title"
              />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Notification message"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as Notification["type"] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="expires_at">Expires At (optional)</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </Layout>
  );
};

export default AdminNotificationsPage;
