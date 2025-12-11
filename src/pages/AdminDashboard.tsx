import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, BookOpen, Scale, Files, ListChecks, Users, LogOut, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const { user, loading, isEditor, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/auth');
    } else if (!loading && user && !isEditor) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access the admin area.',
        variant: 'destructive',
      });
      navigate('/');
    }
  }, [user, loading, isEditor, navigate, toast]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!user || !isEditor) {
    return null;
  }

  const contentSections = [
    {
      title: 'Articles',
      description: 'Manage the 99 articles of the EHDS Regulation',
      icon: FileText,
      href: '/admin/articles',
      count: 99,
    },
    {
      title: 'Recitals',
      description: 'Manage all 115 recitals providing context',
      icon: BookOpen,
      href: '/admin/recitals',
      count: 115,
    },
    {
      title: 'Definitions',
      description: 'Manage legal definitions from Article 2',
      icon: Scale,
      href: '/admin/definitions',
      count: 67,
    },
    {
      title: 'Annexes',
      description: 'Manage the 4 technical annexes',
      icon: Files,
      href: '/admin/annexes',
      count: 4,
    },
    {
      title: 'Implementing Acts',
      description: 'Manage implementing and delegated acts tracker',
      icon: ListChecks,
      href: '/admin/implementing-acts',
      count: 33,
    },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-serif">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage EHDS Regulation content
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user.email}</p>
              <Badge variant={isAdmin ? 'default' : 'secondary'}>
                {isAdmin ? 'Admin' : 'Editor'}
              </Badge>
            </div>
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {contentSections.map((section) => (
            <Link key={section.title} to={section.href}>
              <Card className="hover:border-primary transition-colors h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <section.icon className="h-8 w-8 text-primary" />
                    <Badge variant="outline">{section.count} items</Badge>
                  </div>
                  <CardTitle className="mt-4">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}

          {isAdmin && (
            <Link to="/admin/users">
              <Card className="hover:border-primary transition-colors h-full border-dashed">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Users className="h-8 w-8 text-primary" />
                    <Badge>Admin Only</Badge>
                  </div>
                  <CardTitle className="mt-4">User Management</CardTitle>
                  <CardDescription>Manage admin and editor access</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4 flex-wrap">
            <Link to="/">
              <Button variant="outline">View Public Site</Button>
            </Link>
            <Link to="/admin/articles">
              <Button>Edit Articles</Button>
            </Link>
            <Link to="/admin/recitals">
              <Button>Edit Recitals</Button>
            </Link>
            <Link to="/admin/bulk-import">
              <Button variant="secondary">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
