import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrintButton = () => {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => window.print()}
      title="Print this page"
    >
      <Printer className="h-4 w-4" />
    </Button>
  );
};

export default PrintButton;
