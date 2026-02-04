import { useMemo } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCountryAssignments } from '@/hooks/useCountryAssignments';
import { useEhdsObligations, useCountryObligationStatuses } from '@/hooks/useEhdsObligations';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ApiKeyManager } from '@/components/ApiKeyManager';
import { 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight,
  Settings,
  Building2,
  Scale,
  FileText
} from 'lucide-react';

const EU_COUNTRIES: Record<string, string> = {
  AT: 'Austria', BE: 'Belgium', BG: 'Bulgaria', HR: 'Croatia', CY: 'Cyprus',
  CZ: 'Czechia', DK: 'Denmark', EE: 'Estonia', FI: 'Finland', FR: 'France',
  DE: 'Germany', GR: 'Greece', HU: 'Hungary', IE: 'Ireland', IT: 'Italy',
  LV: 'Latvia', LT: 'Lithuania', LU: 'Luxembourg', MT: 'Malta', NL: 'Netherlands',
  PL: 'Poland', PT: 'Portugal', RO: 'Romania', SK: 'Slovakia', SI: 'Slovenia',
  ES: 'Spain', SE: 'Sweden',
};

const getFlagEmoji = (countryCode: string) => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  delayed: 'Delayed',
  blocked: 'Blocked',
};

const STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  delayed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  blocked: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  dha: <Building2 className="h-4 w-4" />,
  hdab: <Scale className="h-4 w-4" />,
  legislation: <FileText className="h-4 w-4" />,
  primary_use: <Building2 className="h-4 w-4" />,
  secondary_use: <Scale className="h-4 w-4" />,
  general: <FileText className="h-4 w-4" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  dha: 'Digital Health Authority',
  hdab: 'Health Data Access Body',
  legislation: 'National Legislation',
  primary_use: 'Primary Use',
  secondary_use: 'Secondary Use',
  general: 'General',
};

export default function CountryManagerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { myAssignedCountries, isLoading: assignmentsLoading } = useCountryAssignments();
  const { data: obligations = [], isLoading: obligationsLoading } = useEhdsObligations();
  const { data: statuses = [], isLoading: statusesLoading } = useCountryObligationStatuses();

  const isLoading = authLoading || assignmentsLoading || obligationsLoading || statusesLoading;

  // Build status map for quick lookup
  const statusMap = useMemo(() => {
    const map: Record<string, Record<string, { status: string; notes: string | null }>> = {};
    statuses.forEach(s => {
      if (!map[s.country_code]) map[s.country_code] = {};
      map[s.country_code][s.obligation_id] = { 
        status: s.status, 
        notes: s.status_notes 
      };
    });
    return map;
  }, [statuses]);

  // Calculate stats for each assigned country
  const countryStats = useMemo(() => {
    return myAssignedCountries.map(countryCode => {
      const countryStatuses = statusMap[countryCode] || {};
      
      let completed = 0;
      let inProgress = 0;
      let pending = 0;
      let delayed = 0;
      let blocked = 0;
      
      const pendingObligations: Array<{
        id: string;
        name: string;
        category: string;
        status: string;
        notes: string | null;
      }> = [];

      obligations.forEach(obligation => {
        const status = countryStatuses[obligation.id]?.status || 'not_started';
        const notes = countryStatuses[obligation.id]?.notes || null;
        
        switch (status) {
          case 'completed':
            completed++;
            break;
          case 'in_progress':
            inProgress++;
            pendingObligations.push({ 
              id: obligation.id, 
              name: obligation.name, 
              category: obligation.category,
              status,
              notes
            });
            break;
          case 'delayed':
            delayed++;
            pendingObligations.push({ 
              id: obligation.id, 
              name: obligation.name, 
              category: obligation.category,
              status,
              notes
            });
            break;
          case 'blocked':
            blocked++;
            pendingObligations.push({ 
              id: obligation.id, 
              name: obligation.name, 
              category: obligation.category,
              status,
              notes
            });
            break;
          default:
            pending++;
            pendingObligations.push({ 
              id: obligation.id, 
              name: obligation.name, 
              category: obligation.category,
              status: 'not_started',
              notes
            });
        }
      });

      const total = obligations.length || 1;
      const progressPercent = Math.round((completed / total) * 100);

      return {
        countryCode,
        countryName: EU_COUNTRIES[countryCode] || countryCode,
        completed,
        inProgress,
        pending,
        delayed,
        blocked,
        total: obligations.length,
        progressPercent,
        pendingObligations: pendingObligations.sort((a, b) => {
          const priority = { blocked: 0, delayed: 1, in_progress: 2, not_started: 3 };
          return (priority[a.status as keyof typeof priority] || 3) - 
                 (priority[b.status as keyof typeof priority] || 3);
        }),
      };
    });
  }, [myAssignedCountries, obligations, statusMap]);

  // Overall stats
  const overallStats = useMemo(() => {
    const total = countryStats.reduce((acc, c) => acc + c.total, 0);
    const completed = countryStats.reduce((acc, c) => acc + c.completed, 0);
    const inProgress = countryStats.reduce((acc, c) => acc + c.inProgress, 0);
    const delayed = countryStats.reduce((acc, c) => acc + c.delayed, 0);
    const blocked = countryStats.reduce((acc, c) => acc + c.blocked, 0);
    
    return {
      countries: myAssignedCountries.length,
      total,
      completed,
      inProgress,
      delayed,
      blocked,
      progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [countryStats, myAssignedCountries.length]);

  // Redirect if not logged in
  if (!authLoading && !user) {
    return <Navigate to="/admin/auth" replace />;
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 sm:h-24" />)}
          </div>
          <Skeleton className="h-64 sm:h-96" />
        </div>
      </Layout>
    );
  }

  if (myAssignedCountries.length === 0) {
    return (
      <Layout>
        <div className="container py-12">
          <Card className="max-w-lg mx-auto text-center">
            <CardHeader>
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <CardTitle>No Countries Assigned</CardTitle>
              <CardDescription>
                You don't have any countries assigned to manage yet. Contact an administrator to get assigned to countries.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <Link to="/overview">Go to Overview</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">My Countries</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Track implementation progress
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto self-start">
            <Link to="/admin/implementation-tracker">
              <Settings className="h-4 w-4 mr-2" />
              Manage Status
            </Link>
          </Button>
        </div>

        {/* Overall Stats - 2x2 grid on mobile */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card className="p-0">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardDescription className="text-xs sm:text-sm">Countries</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl">{overallStats.countries}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="p-0">
            <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
              <CardDescription className="text-xs sm:text-sm">Progress</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl text-green-600">{overallStats.progressPercent}%</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <Progress value={overallStats.progressPercent} className="h-1.5 sm:h-2" />
            </CardContent>
          </Card>
          <Card className="p-0">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardDescription className="text-xs sm:text-sm">Completed</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl flex items-center gap-1 sm:gap-2">
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                {overallStats.completed}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="p-0">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardDescription className="text-xs sm:text-sm">Attention</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl flex items-center gap-1 sm:gap-2">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                {overallStats.delayed + overallStats.blocked}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Country Cards */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {countryStats.map(country => (
            <Card key={country.countryCode} className="flex flex-col">
              <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <span className="text-xl sm:text-2xl">{getFlagEmoji(country.countryCode)}</span>
                    <span className="truncate">{country.countryName}</span>
                  </CardTitle>
                  <Badge 
                    variant={country.progressPercent === 100 ? 'default' : 'secondary'}
                    className="shrink-0 text-xs"
                  >
                    {country.progressPercent}%
                  </Badge>
                </div>
                <Progress value={country.progressPercent} className="h-1.5 sm:h-2 mt-2" />
              </CardHeader>
              
              <CardContent className="flex-1 p-3 sm:p-6 pt-0 sm:pt-0 space-y-3 sm:space-y-4">
                {/* Status Summary - Compact on mobile */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <Badge className={`text-xs ${STATUS_COLORS.completed}`}>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {country.completed}
                  </Badge>
                  {country.inProgress > 0 && (
                    <Badge className={`text-xs ${STATUS_COLORS.in_progress}`}>
                      <Clock className="h-3 w-3 mr-1" />
                      {country.inProgress}
                    </Badge>
                  )}
                  {country.delayed > 0 && (
                    <Badge className={`text-xs ${STATUS_COLORS.delayed}`}>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {country.delayed}
                    </Badge>
                  )}
                  {country.blocked > 0 && (
                    <Badge className={`text-xs ${STATUS_COLORS.blocked}`}>
                      {country.blocked}
                    </Badge>
                  )}
                  {country.pending > 0 && (
                    <Badge className={`text-xs ${STATUS_COLORS.not_started}`}>
                      {country.pending}
                    </Badge>
                  )}
                </div>

                {/* Pending Obligations */}
                {country.pendingObligations.length > 0 && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium mb-2 flex items-center gap-2">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                      Pending ({country.pendingObligations.length})
                    </h4>
                    <ScrollArea className="h-[140px] sm:h-[180px]">
                      <div className="space-y-2 pr-2 sm:pr-4">
                        {country.pendingObligations.slice(0, 5).map(obligation => (
                          <div 
                            key={obligation.id}
                            className="p-2 sm:p-3 bg-muted/50 rounded-lg border"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-1.5 sm:gap-2 min-w-0 flex-1">
                                <span className="mt-0.5 text-muted-foreground hidden sm:block">
                                  {CATEGORY_ICONS[obligation.category]}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs sm:text-sm font-medium line-clamp-2">
                                    {obligation.name}
                                  </p>
                                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                                    {CATEGORY_LABELS[obligation.category]}
                                  </p>
                                </div>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={`shrink-0 text-[10px] sm:text-xs px-1.5 sm:px-2 ${STATUS_COLORS[obligation.status]}`}
                              >
                                {STATUS_LABELS[obligation.status]}
                              </Badge>
                            </div>
                            {obligation.notes && (
                              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 italic line-clamp-2">
                                "{obligation.notes}"
                              </p>
                            )}
                          </div>
                        ))}
                        {country.pendingObligations.length > 5 && (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            +{country.pendingObligations.length - 5} more obligations
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {country.pendingObligations.length === 0 && (
                  <div className="flex items-center justify-center h-[140px] sm:h-[180px] text-muted-foreground">
                    <div className="text-center">
                      <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-green-600" />
                      <p className="text-xs sm:text-sm">All done!</p>
                    </div>
                  </div>
                )}
              </CardContent>

              <div className="p-3 sm:p-4 pt-0">
                <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm" asChild>
                  <Link to={`/admin/implementation-tracker?country=${country.countryCode}`}>
                    Manage
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* API Key Manager */}
        <ApiKeyManager />
      </div>
    </Layout>
  );
}
