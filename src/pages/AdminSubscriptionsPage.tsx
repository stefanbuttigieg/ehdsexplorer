import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Trash2, Globe, FileText, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const AdminSubscriptionsPage = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/auth');
    } else if (!loading && user && !isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'You need admin access to manage subscriptions.',
        variant: 'destructive',
      });
      navigate('/admin');
    }
  }, [user, loading, isAdmin, navigate, toast]);

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('implementing_act_subscriptions')
        .select(`
          *,
          implementing_acts (
            id,
            title
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user && isAdmin,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('implementing_act_subscriptions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      toast({
        title: 'Subscription Deleted',
        description: 'The subscription has been removed.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete subscription.',
        variant: 'destructive',
      });
    },
  });

  const resendMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { error } = await supabase.functions.invoke('send-verification-email', {
        body: { subscription_id: subscriptionId },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Verification Email Sent',
        description: 'The verification email has been resent.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to resend verification email.',
        variant: 'destructive',
      });
    },
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const globalSubscriptions = subscriptions.filter(s => s.subscribe_all);
  const specificSubscriptions = subscriptions.filter(s => !s.subscribe_all);
  const verifiedCount = subscriptions.filter(s => s.verified).length;
  const unverifiedCount = subscriptions.filter(s => !s.verified).length;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-4 md:p-6 animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-serif">Email Subscriptions</h1>
            <p className="text-muted-foreground">
              Manage implementing act status alert subscriptions
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-3xl">{subscriptions.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Verified</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2 text-green-600">
                <CheckCircle className="h-6 w-6" />
                {verifiedCount}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2 text-amber-600">
                <XCircle className="h-6 w-6" />
                {unverifiedCount}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>All Updates</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Globe className="h-6 w-6 text-primary" />
                {globalSubscriptions.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Subscriptions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              All Subscriptions
            </CardTitle>
            <CardDescription>
              Users subscribed to receive status change alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No subscriptions yet</p>
                <p className="text-sm">Users can subscribe from the implementing acts pages</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Implementing Act</TableHead>
                      <TableHead>Subscribed</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell className="font-medium">{subscription.email}</TableCell>
                        <TableCell>
                          {subscription.verified ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-600">
                              <XCircle className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {subscription.subscribe_all ? (
                            <Badge className="bg-primary">
                              <Globe className="h-3 w-3 mr-1" />
                              All Updates
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <FileText className="h-3 w-3 mr-1" />
                              Specific
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {subscription.subscribe_all ? (
                            <span className="text-muted-foreground">All implementing acts</span>
                          ) : subscription.implementing_acts ? (
                            <Link 
                              to={`/implementing-acts/${subscription.implementing_act_id}`}
                              className="text-primary hover:underline"
                            >
                              {subscription.implementing_acts.title}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">Unknown</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(subscription.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {!subscription.verified && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => resendMutation.mutate(subscription.id)}
                                    disabled={resendMutation.isPending}
                                  >
                                    <RefreshCw className={`h-4 w-4 ${resendMutation.isPending ? 'animate-spin' : ''}`} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Resend verification email</TooltipContent>
                              </Tooltip>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Subscription?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove {subscription.email} from receiving status alerts. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate(subscription.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminSubscriptionsPage;
