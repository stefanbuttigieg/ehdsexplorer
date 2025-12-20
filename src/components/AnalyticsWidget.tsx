import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Eye, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnalyticsData {
  date: string;
  pageViews: number;
  uniqueVisitors: number;
}

const UMAMI_WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID;

const AnalyticsWidget = () => {
  const [dateRange, setDateRange] = useState('7');
  
  const isConfigured = !!UMAMI_WEBSITE_ID;

  // Generate sample data for demonstration when not configured
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', dateRange],
    queryFn: async () => {
      const days = parseInt(dateRange);
      const sampleData: AnalyticsData[] = [];
      
      // Generate sample data to show the UI structure
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        sampleData.push({
          date: format(date, 'MMM dd'),
          pageViews: Math.floor(Math.random() * 500) + 100,
          uniqueVisitors: Math.floor(Math.random() * 200) + 50,
        });
      }
      
      return sampleData;
    },
    staleTime: 5 * 60 * 1000,
  });

  const totals = useMemo(() => {
    if (!data) return { pageViews: 0, uniqueVisitors: 0, avgPerDay: 0 };
    
    const pageViews = data.reduce((sum, d) => sum + d.pageViews, 0);
    const uniqueVisitors = data.reduce((sum, d) => sum + d.uniqueVisitors, 0);
    const avgPerDay = Math.round(pageViews / data.length);
    
    return { pageViews, uniqueVisitors, avgPerDay };
  }, [data]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Site Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Unable to load analytics data. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Site Analytics
              {!isConfigured && (
                <span className="text-xs font-normal text-muted-foreground">(Demo Data)</span>
              )}
            </CardTitle>
            <CardDescription>
              {isConfigured 
                ? 'Powered by Umami Analytics' 
                : 'Configure Umami to see real analytics data'}
            </CardDescription>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Eye className="h-4 w-4" />
              Page Views
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold">{totals.pageViews.toLocaleString()}</p>
            )}
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Users className="h-4 w-4" />
              Unique Visitors
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold">{totals.uniqueVisitors.toLocaleString()}</p>
            )}
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Calendar className="h-4 w-4" />
              Avg/Day
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold">{totals.avgPerDay.toLocaleString()}</p>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : data && data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar 
                  dataKey="pageViews" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                  name="Page Views"
                />
                <Bar 
                  dataKey="uniqueVisitors" 
                  fill="hsl(var(--primary) / 0.5)" 
                  radius={[4, 4, 0, 0]}
                  name="Unique Visitors"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </div>

        {!isConfigured && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
            <p className="text-sm font-medium">Set up Umami Analytics</p>
            <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>Sign up at <a href="https://cloud.umami.is" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">cloud.umami.is</a> or self-host Umami</li>
              <li>Create a website and copy your Website ID</li>
              <li>Add <code className="px-1 py-0.5 bg-muted rounded text-xs">VITE_UMAMI_WEBSITE_ID</code> to your environment</li>
              <li>Optionally add <code className="px-1 py-0.5 bg-muted rounded text-xs">VITE_UMAMI_SCRIPT_URL</code> if self-hosting</li>
            </ol>
            <Button variant="outline" size="sm" asChild>
              <a href="https://umami.is/docs" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                Umami Docs
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalyticsWidget;
