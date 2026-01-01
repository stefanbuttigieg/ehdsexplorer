import { useState } from "react";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useImplementingActSubscriptions } from "@/hooks/useImplementingActSubscriptions";

interface SubscribeAlertButtonProps {
  implementingActId: string;
  implementingActTitle: string;
}

export const SubscribeAlertButton = ({ 
  implementingActId, 
  implementingActTitle 
}: SubscribeAlertButtonProps) => {
  const [email, setEmail] = useState("");
  const [subscribeAll, setSubscribeAll] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const { subscribe } = useImplementingActSubscriptions();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      return;
    }

    try {
      await subscribe.mutateAsync({
        email,
        implementingActId: subscribeAll ? undefined : implementingActId,
        subscribeAll,
      });
      setEmail("");
      setIsOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bell className="h-4 w-4" />
          Get Alerts
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <form onSubmit={handleSubscribe} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Subscribe to Status Alerts</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Get notified when the status of this implementing act changes.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="alert-email">Email address</Label>
            <Input
              id="alert-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="subscribe-all" 
              checked={subscribeAll}
              onCheckedChange={(checked) => setSubscribeAll(checked === true)}
            />
            <Label htmlFor="subscribe-all" className="text-sm font-normal">
              Subscribe to all implementing act updates
            </Label>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={subscribe.isPending || !email}
          >
            {subscribe.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Subscribing...
              </>
            ) : (
              "Subscribe"
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            You can unsubscribe at any time via the link in the email.
          </p>
        </form>
      </PopoverContent>
    </Popover>
  );
};
