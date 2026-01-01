import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";

const UnsubscribePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const handleUnsubscribe = async () => {
      if (!token) {
        setStatus("error");
        return;
      }

      try {
        // First get the subscription details before deleting
        const { data: subscription, error: fetchError } = await supabase
          .from("implementing_act_subscriptions")
          .select("email, subscribe_all, implementing_acts(title)")
          .eq("unsubscribe_token", token)
          .single();

        if (fetchError || !subscription) {
          setStatus("error");
          return;
        }

        // Delete the subscription
        const { error: deleteError } = await supabase
          .from("implementing_act_subscriptions")
          .delete()
          .eq("unsubscribe_token", token);

        if (deleteError) {
          setStatus("error");
          return;
        }

        // Send confirmation email
        const unsubscribedFrom = subscription.subscribe_all 
          ? "all" 
          : (subscription.implementing_acts as any)?.[0]?.title || "an implementing act";

        await supabase.functions.invoke("send-unsubscribe-confirmation", {
          body: { 
            email: subscription.email,
            unsubscribed_from: unsubscribedFrom
          },
        });

        setStatus("success");
      } catch (err) {
        console.error("Unsubscribe error:", err);
        setStatus("error");
      }
    };

    handleUnsubscribe();
  }, [token]);

  return (
    <Layout>
      <div className="container max-w-lg mx-auto px-4 py-16">
        <Card>
          <CardContent className="p-8 text-center">
            {status === "loading" && (
              <>
                <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
                <h1 className="text-2xl font-bold mb-2">Unsubscribing...</h1>
                <p className="text-muted-foreground">Please wait while we process your request.</p>
              </>
            )}
            
            {status === "success" && (
              <>
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h1 className="text-2xl font-bold mb-2">Unsubscribed Successfully</h1>
                <p className="text-muted-foreground mb-6">
                  You will no longer receive email alerts for implementing act status changes.
                </p>
                <Link to="/implementing-acts">
                  <Button>Back to Implementing Acts</Button>
                </Link>
              </>
            )}
            
            {status === "error" && (
              <>
                <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <h1 className="text-2xl font-bold mb-2">Unsubscribe Failed</h1>
                <p className="text-muted-foreground mb-6">
                  {!token 
                    ? "Invalid unsubscribe link. Please check your email for the correct link."
                    : "We could not process your unsubscribe request. The link may have expired or already been used."
                  }
                </p>
                <Link to="/">
                  <Button>Go to Homepage</Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default UnsubscribePage;
