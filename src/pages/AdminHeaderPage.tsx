import { ArrowUp, ArrowDown, Eye, EyeOff, Monitor, Smartphone, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { useHeaderItems, useUpdateHeaderItem, HeaderItem } from "@/hooks/useHeaderItems";

const AdminHeaderPage = () => {
  const { shouldRender, loading: authLoading } = useAdminGuard();
  const { data: items, isLoading } = useHeaderItems();
  const updateItem = useUpdateHeaderItem();
  const { toast } = useToast();

  if (authLoading || !shouldRender) return null;

  const sorted = [...(items || [])].sort((a, b) => a.sort_order - b.sort_order);

  const swapOrder = async (a: HeaderItem, b: HeaderItem) => {
    await Promise.all([
      updateItem.mutateAsync({ id: a.id, updates: { sort_order: b.sort_order } }),
      updateItem.mutateAsync({ id: b.id, updates: { sort_order: a.sort_order } }),
    ]);
  };

  const handleMoveUp = async (idx: number) => {
    if (idx <= 0) return;
    await swapOrder(sorted[idx], sorted[idx - 1]);
  };

  const handleMoveDown = async (idx: number) => {
    if (idx >= sorted.length - 1) return;
    await swapOrder(sorted[idx], sorted[idx + 1]);
  };

  const toggleField = async (item: HeaderItem, field: keyof HeaderItem) => {
    try {
      await updateItem.mutateAsync({ id: item.id, updates: { [field]: !item[field] } as any });
    } catch {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    }
  };

  return (
    <AdminPageLayout
      title="Header Manager"
      description="Control which items appear in the top header bar (Sign In, Kids Mode, Language, etc.) — reorder and configure visibility per device and auth state."
    >
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : (
        <div className="space-y-3">
          {sorted.map((item, idx) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === 0} onClick={() => handleMoveUp(idx)}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === sorted.length - 1} onClick={() => handleMoveDown(idx)}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{item.label}</h3>
                      <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{item.component_key}</code>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      <div className="flex items-center gap-2">
                        {item.is_visible ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                        <Switch checked={item.is_visible} onCheckedChange={() => toggleField(item, "is_visible")} />
                        <Label className="text-xs cursor-pointer" onClick={() => toggleField(item, "is_visible")}>Visible</Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                        <Switch checked={item.show_on_desktop} onCheckedChange={() => toggleField(item, "show_on_desktop")} />
                        <Label className="text-xs cursor-pointer" onClick={() => toggleField(item, "show_on_desktop")}>Desktop</Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <Switch checked={item.show_on_mobile} onCheckedChange={() => toggleField(item, "show_on_mobile")} />
                        <Label className="text-xs cursor-pointer" onClick={() => toggleField(item, "show_on_mobile")}>Mobile</Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <LogIn className="h-4 w-4 text-muted-foreground" />
                        <Switch checked={item.show_when_logged_in} onCheckedChange={() => toggleField(item, "show_when_logged_in")} />
                        <Label className="text-xs cursor-pointer" onClick={() => toggleField(item, "show_when_logged_in")}>Signed in</Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <LogOut className="h-4 w-4 text-muted-foreground" />
                        <Switch checked={item.show_when_logged_out} onCheckedChange={() => toggleField(item, "show_when_logged_out")} />
                        <Label className="text-xs cursor-pointer" onClick={() => toggleField(item, "show_when_logged_out")}>Signed out</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminPageLayout>
  );
};

export default AdminHeaderPage;
