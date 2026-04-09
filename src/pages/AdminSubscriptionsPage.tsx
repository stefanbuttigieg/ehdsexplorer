import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Trash2, Globe, FileText, CheckCircle, XCircle, RefreshCw, Send, Loader2, Newspaper, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  const [newsletterSubject, setNewsletterSubject] = useState('');
  const [newsletterBody, setNewsletterBody] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState<'balanced' | 'formal' | 'casual'>('balanced');
  const [isGenerating, setIsGenerating] = useState(false);

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

  // Implementing act subscriptions
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

  // Newsletter subscriptions
  const { data: newsletterSubs = [], isLoading: newsletterLoading } = useQuery({
    queryKey: ['admin-newsletter-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('newsletter_subscriptions')
        .select('*')
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
      toast({ title: 'Subscription Deleted', description: 'The subscription has been removed.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete subscription.', variant: 'destructive' });
    },
  });

  const deleteNewsletterMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-newsletter-subscriptions'] });
      toast({ title: 'Subscriber Removed', description: 'The newsletter subscriber has been removed.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to remove subscriber.', variant: 'destructive' });
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
      toast({ title: 'Verification Email Sent', description: 'The verification email has been resent.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to resend verification email.', variant: 'destructive' });
    },
  });

  const resendNewsletterMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { error } = await supabase.functions.invoke('send-verification-email', {
        body: { subscription_id: subscriptionId, type: 'newsletter' },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Verification Email Sent', description: 'Newsletter verification email has been resent.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to resend verification email.', variant: 'destructive' });
    },
  });

  const sendNewsletterMutation = useMutation({
    mutationFn: async ({ subject, body }: { subject: string; body: string }) => {
      const { data, error } = await supabase.functions.invoke('send-weekly-newsletter', {
        body: { subject, body },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Newsletter Sent!',
        description: `Successfully sent to ${data?.sent_count || 0} verified subscribers.`,
      });
      setNewsletterSubject('');
      setNewsletterBody('');
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message || 'Failed to send newsletter.', variant: 'destructive' });
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

  const newsletterVerified = newsletterSubs.filter(s => s.is_verified && !s.unsubscribed_at).length;
  const newsletterPending = newsletterSubs.filter(s => !s.is_verified && !s.unsubscribed_at).length;
  const newsletterUnsubscribed = newsletterSubs.filter(s => s.unsubscribed_at).length;

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
              Manage newsletter and implementing act alert subscriptions
            </p>
          </div>
        </div>

        <Tabs defaultValue="newsletter" className="space-y-6">
          <TabsList>
            <TabsTrigger value="newsletter" className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              Newsletter ({newsletterSubs.length})
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              IA Alerts ({subscriptions.length})
            </TabsTrigger>
          </TabsList>

          {/* Newsletter Tab */}
          <TabsContent value="newsletter" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total</CardDescription>
                  <CardTitle className="text-3xl">{newsletterSubs.length}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Verified</CardDescription>
                  <CardTitle className="text-3xl flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-6 w-6" />
                    {newsletterVerified}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Pending</CardDescription>
                  <CardTitle className="text-3xl flex items-center gap-2 text-amber-600">
                    <XCircle className="h-6 w-6" />
                    {newsletterPending}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Unsubscribed</CardDescription>
                  <CardTitle className="text-3xl text-muted-foreground">
                    {newsletterUnsubscribed}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* AI Draft Generator */}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Newsletter Assistant
                </CardTitle>
                <CardDescription>
                  Generate a newsletter draft using AI based on recent platform updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Custom instructions (optional)</label>
                  <Textarea
                    placeholder="e.g. Focus on the new implementing act adoption, mention the upcoming deadlines..."
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Tone</label>
                  <Select value={aiTone} onValueChange={(v: 'balanced' | 'formal' | 'casual') => setAiTone(v)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  onClick={async () => {
                    setIsGenerating(true);
                    try {
                      const { data, error } = await supabase.functions.invoke('generate-newsletter-draft', {
                        body: { prompt: aiPrompt || undefined, tone: aiTone },
                      });
                      if (error) throw error;
                      if (data?.error) throw new Error(data.error);
                      if (data?.draft) setNewsletterBody(data.draft);
                      if (data?.suggestedSubject && !newsletterSubject) setNewsletterSubject(data.suggestedSubject);
                      toast({ title: 'Draft Generated', description: 'AI draft loaded into the composer. Review and edit before sending.' });
                    } catch (e: any) {
                      toast({ title: 'Generation Failed', description: e.message || 'Could not generate draft.', variant: 'destructive' });
                    } finally {
                      setIsGenerating(false);
                    }
                  }}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Wand2 className="h-4 w-4 mr-2" />
                  )}
                  {isGenerating ? 'Generating...' : 'Generate Draft'}
                </Button>
              </CardContent>
            </Card>

            {/* Send Newsletter */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Send Newsletter
                </CardTitle>
                <CardDescription>
                  Compose and send a weekly update to {newsletterVerified} verified subscriber{newsletterVerified !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Subject</label>
                  <Input
                    placeholder="e.g. EHDS Weekly Update – April 9, 2026"
                    value={newsletterSubject}
                    onChange={e => setNewsletterSubject(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Body (HTML supported)</label>
                  <Textarea
                    placeholder="Write your newsletter content here... HTML tags are supported."
                    value={newsletterBody}
                    onChange={e => setNewsletterBody(e.target.value)}
                    rows={10}
                  />
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={!newsletterSubject.trim() || !newsletterBody.trim() || sendNewsletterMutation.isPending || newsletterVerified === 0}
                    >
                      {sendNewsletterMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Send to {newsletterVerified} subscriber{newsletterVerified !== 1 ? 's' : ''}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Send Newsletter?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will send "{newsletterSubject}" to {newsletterVerified} verified subscriber{newsletterVerified !== 1 ? 's' : ''}. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => sendNewsletterMutation.mutate({ subject: newsletterSubject, body: newsletterBody })}>
                        Send Newsletter
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>

            {/* Subscribers Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5" />
                  Newsletter Subscribers
                </CardTitle>
                <CardDescription>All users subscribed to the weekly newsletter</CardDescription>
              </CardHeader>
              <CardContent>
                {newsletterLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : newsletterSubs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No newsletter subscribers yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Subscribed</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {newsletterSubs.map((sub) => (
                          <TableRow key={sub.id}>
                            <TableCell className="font-medium">{sub.email}</TableCell>
                            <TableCell>
                              {sub.unsubscribed_at ? (
                                <Badge variant="outline" className="text-muted-foreground">Unsubscribed</Badge>
                              ) : sub.is_verified ? (
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
                            <TableCell className="text-muted-foreground capitalize">{sub.source || 'website'}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(sub.created_at), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove Subscriber?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will remove {sub.email} from the newsletter. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteNewsletterMutation.mutate(sub.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* IA Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Implementing Act Alert Subscriptions
                </CardTitle>
                <CardDescription>Users subscribed to receive status change alerts</CardDescription>
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
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminSubscriptionsPage;
