import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";

const VerifySubscriptionPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifySubscription = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link. No token provided.");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("verify-subscription", {
          body: { token },
        });

        if (error || !data?.success) {
          setStatus("error");
          setMessage(data?.error || "This verification link is invalid or has already been used.");
          return;
        }

        setStatus("success");
        setMessage("Your email has been verified! You will now receive status change alerts.");
      } catch (err) {
        setStatus("error");
        setMessage("Something went wrong. Please try again later.");
      }
    };

    verifySubscription();
  }, [token]);

  return (
    <Layout>
      <div className="max-w-md mx-auto p-6 mt-12">
        <Card>
          <CardHeader className="text-center">
            {status === "loading" && (
              <>
                <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                <CardTitle>Verifying...</CardTitle>
                <CardDescription>Please wait while we verify your email</CardDescription>
              </>
            )}
            {status === "success" && (
              <>
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <CardTitle className="text-green-700">Email Verified!</CardTitle>
                <CardDescription>{message}</CardDescription>
              </>
            )}
            {status === "error" && (
              <>
                <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <CardTitle className="text-destructive">Verification Failed</CardTitle>
                <CardDescription>{message}</CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/implementing-acts">
              <Button>View Implementing Acts</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default VerifySubscriptionPage;
