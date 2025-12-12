import { useState, useEffect } from "react";
import { X, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useActiveNotifications, Notification } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const iconMap = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
};

const styleMap = {
  info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200",
  success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200",
  error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200",
};

export const NotificationsBanner = () => {
  const { data: notifications = [] } = useActiveNotifications();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Load dismissed notifications from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("dismissed-notifications");
    if (stored) {
      setDismissed(new Set(JSON.parse(stored)));
    }
  }, []);

  const handleDismiss = (id: string) => {
    const newDismissed = new Set(dismissed).add(id);
    setDismissed(newDismissed);
    sessionStorage.setItem("dismissed-notifications", JSON.stringify([...newDismissed]));
  };

  const visibleNotifications = notifications.filter(n => !dismissed.has(n.id));

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="space-y-2">
      {visibleNotifications.map((notification) => {
        const Icon = iconMap[notification.type];
        return (
          <div
            key={notification.id}
            className={cn(
              "flex items-start gap-3 p-3 border rounded-lg",
              styleMap[notification.type]
            )}
          >
            <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{notification.title}</p>
              <p className="text-sm opacity-90">{notification.message}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0 hover:bg-transparent opacity-60 hover:opacity-100"
              onClick={() => handleDismiss(notification.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
};
