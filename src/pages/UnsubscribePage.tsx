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
        // Use the secure edge function instead of direct database access
        const { data, error } = await supabase.functions.invoke("handle-unsubscribe", {
          body: { token, action: "unsubscribe" },
        });

        if (error) {
          console.error("Unsubscribe error:", error);
          setStatus("error");
          return;
        }

        if (data?.success) {
          setStatus("success");
        } else {
          console.error("Unsubscribe failed:", data?.error);
          setStatus("error");
        }
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
