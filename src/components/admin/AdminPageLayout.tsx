import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Layout from '@/components/Layout';

interface AdminPageLayoutProps {
  title: string;
  description: string;
  backTo?: string;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * Shared layout for admin pages with consistent header, back button, and optional search.
 */
export function AdminPageLayout({
  title,
  description,
  backTo = '/admin',
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  actions,
  children,
}: AdminPageLayoutProps) {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
          <Link to={backTo}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold font-serif">{title}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{description}</p>
          </div>
          {actions}
        </div>

        {/* Search */}
        {onSearchChange && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {children}
      </div>
    </Layout>
  );
}

/**
 * Loading state component for admin pages.
 */
export function AdminPageLoading() {
  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <p>Loading...</p>
      </div>
    </Layout>
  );
}
