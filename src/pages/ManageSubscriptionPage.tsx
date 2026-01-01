import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Mail, Trash2, Loader2, Bell, Globe, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Subscription {
  id: string;
  email: string;
  implementing_act_id: string | null;
  subscribe_all: boolean;
  verified: boolean;
  created_at: string;
  unsubscribe_token: string;
  implementing_acts: { id: string; title: string } | null;
}

const ManageSubscriptionPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSubscriptions = async () => {
    if (!token) {
      setError("Invalid link. No token provided.");
      setLoading(false);
      return;
    }

    try {
      // First, find the email associated with this token
      const { data: tokenData, error: tokenError } = await supabase
        .from("implementing_act_subscriptions")
        .select("email")
        .eq("unsubscribe_token", token)
        .single();

      if (tokenError || !tokenData) {
        setError("This link is invalid or has expired.");
        setLoading(false);
        return;
      }

      setEmail(tokenData.email);

      // Then fetch all subscriptions for this email
      const { data, error: fetchError } = await supabase
        .from("implementing_act_subscriptions")
        .select(`
          id,
          email,
          implementing_act_id,
          subscribe_all,
          verified,
          created_at,
          unsubscribe_token,
          implementing_acts (
            id,
            title
          )
        `)
        .eq("email", tokenData.email)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setSubscriptions(data || []);
    } catch (err) {
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [token]);

  const handleUnsubscribe = async (subscriptionId: string) => {
    setDeletingId(subscriptionId);
    try {
      const subscription = subscriptions.find(s => s.id === subscriptionId);
      if (!subscription) return;

      const { error } = await supabase
        .from("implementing_act_subscriptions")
        .delete()
        .eq("unsubscribe_token", subscription.unsubscribe_token);

      if (error) throw error;

      // Send confirmation email
      const unsubscribedFrom = subscription.subscribe_all 
        ? "all" 
        : subscription.implementing_acts?.title || "an implementing act";

      await supabase.functions.invoke("send-unsubscribe-confirmation", {
        body: { 
          email: subscription.email,
          unsubscribed_from: unsubscribedFrom
        },
      });

      setSubscriptions(prev => prev.filter(s => s.id !== subscriptionId));
      toast({
        title: "Unsubscribed",
        description: "You have been unsubscribed. A confirmation email has been sent.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to unsubscribe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleUnsubscribeAll = async () => {
    setDeletingId("all");
    try {
      const userEmail = email;
      
      // Delete all subscriptions for this email
      for (const subscription of subscriptions) {
        await supabase
          .from("implementing_act_subscriptions")
          .delete()
          .eq("unsubscribe_token", subscription.unsubscribe_token);
      }

      // Send confirmation email for unsubscribing from all
      if (userEmail) {
        await supabase.functions.invoke("send-unsubscribe-confirmation", {
          body: { 
            email: userEmail,
            unsubscribed_from: "all"
          },
        });
      }

      setSubscriptions([]);
      toast({
        title: "Unsubscribed from all",
        description: "You have been unsubscribed from all alerts. A confirmation email has been sent.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to unsubscribe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-48 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-md mx-auto p-6 mt-12">
          <Card>
            <CardHeader className="text-center">
              <Mail className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <CardTitle className="text-destructive">Access Error</CardTitle>
              <CardDescription>{error}</CardDescription>
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
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-6 animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/implementing-acts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-serif flex items-center gap-2">
              <Bell className="h-7 w-7 text-primary" />
              Manage Subscriptions
            </h1>
            <p className="text-muted-foreground">
              {email}
            </p>
          </div>
        </div>

        {subscriptions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">You have no active subscriptions</p>
              <Link to="/implementing-acts">
                <Button>Browse Implementing Acts</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {subscriptions.map((subscription) => (
                <Card key={subscription.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {subscription.subscribe_all ? (
                            <Badge className="bg-primary">
                              <Globe className="h-3 w-3 mr-1" />
                              All Updates
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <FileText className="h-3 w-3 mr-1" />
                              Specific Act
                            </Badge>
                          )}
                          {!subscription.verified && (
                            <Badge variant="outline" className="text-amber-600 border-amber-600">
                              Pending verification
                            </Badge>
                          )}
                        </div>
                        
                        {subscription.subscribe_all ? (
                          <p className="font-medium">All Implementing Act Updates</p>
                        ) : subscription.implementing_acts ? (
                          <Link 
                            to={`/implementing-acts/${subscription.implementing_act_id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {subscription.implementing_acts.title}
                          </Link>
                        ) : (
                          <p className="text-muted-foreground">Unknown implementing act</p>
                        )}
                        
                        <p className="text-sm text-muted-foreground mt-1">
                          Subscribed {format(new Date(subscription.created_at), 'MMMM d, yyyy')}
                        </p>
                      </div>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            disabled={deletingId === subscription.id}
                          >
                            {deletingId === subscription.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Unsubscribe?</AlertDialogTitle>
                            <AlertDialogDescription>
                              You will no longer receive email alerts for this subscription.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleUnsubscribe(subscription.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Unsubscribe
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {subscriptions.length > 1 && (
              <div className="border-t pt-6">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                      disabled={deletingId === "all"}
                    >
                      {deletingId === "all" ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Unsubscribe from All ({subscriptions.length})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Unsubscribe from all?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove all {subscriptions.length} of your subscriptions. You will no longer receive any email alerts.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleUnsubscribeAll}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Unsubscribe from All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default ManageSubscriptionPage;
