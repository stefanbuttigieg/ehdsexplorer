import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAuth } from "@/hooks/useAuth";
import MaintenancePage from "./MaintenancePage";

interface MaintenanceGuardProps {
  children: ReactNode;
}

// Routes that should always be accessible during maintenance
const MAINTENANCE_EXEMPT_ROUTES = ["/admin/auth"];

const MaintenanceGuard = ({ children }: MaintenanceGuardProps) => {
  const location = useLocation();
  const { data: settings, isLoading: settingsLoading } = useSiteSettings();
  const { isAdmin, isEditor, loading: authLoading } = useAuth();

  // Check if current route is exempt from maintenance mode
  const isExemptRoute = MAINTENANCE_EXEMPT_ROUTES.includes(location.pathname);

  // While loading, show nothing to prevent flash
  if (settingsLoading) {
    return null;
  }

  // If maintenance mode is on and user is not admin/editor, show maintenance page
  // Unless they're on an exempt route (like admin login)
  if (settings?.maintenance_mode && !authLoading && !isAdmin && !isEditor && !isExemptRoute) {
    return <MaintenancePage message={settings.maintenance_message} />;
  }

  return <>{children}</>;
};

export default MaintenanceGuard;
