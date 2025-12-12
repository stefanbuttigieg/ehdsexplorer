import { Construction, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MaintenancePageProps {
  message?: string;
}

const MaintenancePage = ({ message = "We are currently updating our content. Please check back shortly." }: MaintenancePageProps) => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-6 max-w-md">
        <div className="mb-8">
          <Construction className="h-24 w-24 mx-auto text-primary animate-pulse" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Under Maintenance
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          {message}
        </p>
        <Button onClick={handleRefresh} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Page
        </Button>
      </div>
    </div>
  );
};

export default MaintenancePage;
