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
  const type = searchParams.get("type");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [verifiedType, setVerifiedType] = useState<string | null>(null);

  useEffect(() => {
    const verifySubscription = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link. No token provided.");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("verify-subscription", {
          body: { token, type: type || undefined },
        });

        if (error || !data?.success) {
          setStatus("error");
          setMessage(data?.error || "This verification link is invalid or has already been used.");
          return;
        }

        setVerifiedType(data.type || type);
        setStatus("success");

        if (data.already_verified) {
          setMessage("Your email was already verified. You're all set!");
        } else if (data.type === "newsletter") {
          setMessage("Your email has been verified! You will now receive our weekly newsletter updates.");
        } else {
          setMessage("Your email has been verified! You will now receive implementing act status change alerts.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Something went wrong. Please try again later.");
      }
    };

    verifySubscription();
  }, [token, type]);

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
            <Link to={verifiedType === "newsletter" ? "/" : "/implementing-acts"}>
              <Button>
                {verifiedType === "newsletter" ? "Back to Home" : "View Implementing Acts"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default VerifySubscriptionPage;
