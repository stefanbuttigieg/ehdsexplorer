import { ReactNode } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAuth } from "@/hooks/useAuth";
import MaintenancePage from "./MaintenancePage";

interface MaintenanceGuardProps {
  children: ReactNode;
}

const MaintenanceGuard = ({ children }: MaintenanceGuardProps) => {
  const { data: settings, isLoading: settingsLoading } = useSiteSettings();
  const { isAdmin, isEditor, loading: authLoading } = useAuth();

  // While loading, show nothing to prevent flash
  if (settingsLoading) {
    return null;
  }

  // If maintenance mode is on and user is not admin/editor, show maintenance page
  if (settings?.maintenance_mode && !authLoading && !isAdmin && !isEditor) {
    return <MaintenancePage message={settings.maintenance_message} />;
  }

  return <>{children}</>;
};

export default MaintenanceGuard;
