import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Eye, Calendar } from 'lucide-react';

interface AnalyticsData {
  date: string;
  pageViews: number;
  uniqueVisitors: number;
}

// This component displays placeholder analytics until Lovable analytics API is integrated
const AnalyticsWidget = () => {
  const [dateRange, setDateRange] = useState('7');
  
  // For now, we'll show a message about analytics integration
  // Lovable analytics would be integrated via their API when available
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', dateRange],
    queryFn: async () => {
      // Placeholder - in production this would call Lovable's analytics API
      // For now, return sample data structure to show the UI
      const days = parseInt(dateRange);
      const sampleData: AnalyticsData[] = [];
      
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
    staleTime: 5 * 60 * 1000, // 5 minutes
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
            </CardTitle>
            <CardDescription>
              Overview of site traffic and engagement
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

        <p className="text-xs text-muted-foreground text-center">
          Analytics data is for demonstration purposes. Connect your analytics provider for real data.
        </p>
      </CardContent>
    </Card>
  );
};

export default AnalyticsWidget;
