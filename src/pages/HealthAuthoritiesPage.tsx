import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHealthAuthorities, AuthorityType, AuthorityStatus, HealthAuthority } from '@/hooks/useHealthAuthorities';
import { Search, MapPin, Globe, Mail, Phone, Building2, Shield, ExternalLink, Filter, Map as MapIcon, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// EU country data with coordinates for map
const EU_COUNTRIES = [
  { code: 'AT', name: 'Austria', x: 53, y: 45 },
  { code: 'BE', name: 'Belgium', x: 42, y: 38 },
  { code: 'BG', name: 'Bulgaria', x: 68, y: 55 },
  { code: 'HR', name: 'Croatia', x: 56, y: 52 },
  { code: 'CY', name: 'Cyprus', x: 78, y: 68 },
  { code: 'CZ', name: 'Czechia', x: 54, y: 40 },
  { code: 'DK', name: 'Denmark', x: 48, y: 28 },
  { code: 'EE', name: 'Estonia', x: 66, y: 22 },
  { code: 'FI', name: 'Finland', x: 66, y: 12 },
  { code: 'FR', name: 'France', x: 38, y: 48 },
  { code: 'DE', name: 'Germany', x: 48, y: 40 },
  { code: 'GR', name: 'Greece', x: 65, y: 62 },
  { code: 'HU', name: 'Hungary', x: 58, y: 48 },
  { code: 'IE', name: 'Ireland', x: 28, y: 35 },
  { code: 'IT', name: 'Italy', x: 50, y: 55 },
  { code: 'LV', name: 'Latvia', x: 66, y: 25 },
  { code: 'LT', name: 'Lithuania', x: 66, y: 28 },
  { code: 'LU', name: 'Luxembourg', x: 44, y: 42 },
  { code: 'MT', name: 'Malta', x: 53, y: 70 },
  { code: 'NL', name: 'Netherlands', x: 43, y: 35 },
  { code: 'PL', name: 'Poland', x: 58, y: 38 },
  { code: 'PT', name: 'Portugal', x: 22, y: 58 },
  { code: 'RO', name: 'Romania', x: 66, y: 50 },
  { code: 'SK', name: 'Slovakia', x: 58, y: 44 },
  { code: 'SI', name: 'Slovenia', x: 53, y: 50 },
  { code: 'ES', name: 'Spain', x: 28, y: 58 },
  { code: 'SE', name: 'Sweden', x: 56, y: 18 },
];

const statusColors: Record<AuthorityStatus, string> = {
  active: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  planned: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  inactive: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
};

const typeLabels: Record<AuthorityType, string> = {
  digital_health_authority: 'Digital Health Authority',
  health_data_access_body: 'Health Data Access Body',
};

function AuthorityCard({ authority }: { authority: HealthAuthority }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              {authority.authority_type === 'digital_health_authority' ? (
                <Building2 className="h-5 w-5 text-primary" />
              ) : (
                <Shield className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-base line-clamp-1">{authority.name}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {authority.country_name}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={cn("text-xs whitespace-nowrap", statusColors[authority.status])}>
            {authority.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Badge variant="secondary" className="text-xs">
          {typeLabels[authority.authority_type]}
        </Badge>
        
        {authority.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {authority.description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2 pt-2">
          {authority.website && (
            <a
              href={authority.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Globe className="h-3 w-3" />
              Website
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
          {authority.email && (
            <a
              href={`mailto:${authority.email}`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              <Mail className="h-3 w-3" />
              {authority.email}
            </a>
          )}
          {authority.phone && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              {authority.phone}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MapView({ authorities, selectedCountry, onCountryClick }: {
  authorities: HealthAuthority[];
  selectedCountry: string | null;
  onCountryClick: (code: string | null) => void;
}) {
  const countryAuthorities = useMemo(() => {
    const map: Record<string, HealthAuthority[]> = {};
    authorities.forEach(a => {
      if (!map[a.country_code]) map[a.country_code] = [];
      map[a.country_code].push(a);
    });
    return map;
  }, [authorities]);

  return (
    <div className="relative w-full aspect-[4/3] bg-muted/30 rounded-lg border overflow-hidden">
      <div className="absolute inset-4">
        {EU_COUNTRIES.map(country => {
          const hasAuthorities = countryAuthorities[country.code]?.length > 0;
          const isSelected = selectedCountry === country.code;
          const authorityCount = countryAuthorities[country.code]?.length || 0;
          
          return (
            <button
              key={country.code}
              onClick={() => onCountryClick(isSelected ? null : country.code)}
              className={cn(
                "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all",
                "rounded-full flex items-center justify-center text-xs font-medium",
                hasAuthorities 
                  ? "bg-primary text-primary-foreground hover:scale-110 cursor-pointer shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer",
                isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110",
                hasAuthorities ? "h-8 w-8" : "h-6 w-6"
              )}
              style={{ left: `${country.x}%`, top: `${country.y}%` }}
              title={`${country.name}${hasAuthorities ? ` (${authorityCount})` : ''}`}
            >
              {hasAuthorities ? authorityCount : ''}
            </button>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm rounded-md p-2 text-xs space-y-1">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-primary" />
          <span>Has authorities</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-muted" />
          <span>No data yet</span>
        </div>
      </div>
    </div>
  );
}

export default function HealthAuthoritiesPage() {
  const { authorities, isLoading } = useHealthAuthorities();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<AuthorityType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AuthorityStatus | 'all'>('all');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [view, setView] = useState<'map' | 'list'>('map');

  const filteredAuthorities = useMemo(() => {
    if (!authorities) return [];
    
    return authorities.filter(authority => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          authority.name.toLowerCase().includes(query) ||
          authority.country_name.toLowerCase().includes(query) ||
          authority.description?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      // Type filter
      if (typeFilter !== 'all' && authority.authority_type !== typeFilter) {
        return false;
      }
      
      // Status filter
      if (statusFilter !== 'all' && authority.status !== statusFilter) {
        return false;
      }
      
      // Country filter (from map)
      if (selectedCountry && authority.country_code !== selectedCountry) {
        return false;
      }
      
      return true;
    });
  }, [authorities, searchQuery, typeFilter, statusFilter, selectedCountry]);

  const selectedCountryName = selectedCountry 
    ? EU_COUNTRIES.find(c => c.code === selectedCountry)?.name 
    : null;

  return (
    <Layout>
      <Helmet>
        <title>Health Authorities Directory | EHDS Explorer</title>
        <meta name="description" content="Directory of Digital Health Authorities and Health Data Access Bodies across EU member states implementing the EHDS regulation." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Health Authorities Directory</h1>
          <p className="text-muted-foreground">
            Explore Digital Health Authorities and Health Data Access Bodies across EU member states.
          </p>
        </div>

        {/* View Toggle & Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Tabs value={view} onValueChange={(v) => setView(v as 'map' | 'list')} className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="map" className="gap-2">
                <MapIcon className="h-4 w-4" />
                Map View
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                List View
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex-1 flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search authorities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as AuthorityType | 'all')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="digital_health_authority">Digital Health Authority</SelectItem>
                <SelectItem value="health_data_access_body">Health Data Access Body</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AuthorityStatus | 'all')}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Selected country indicator */}
        {selectedCountry && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <MapPin className="h-3 w-3" />
              {selectedCountryName}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setSelectedCountry(null)}>
              Clear filter
            </Button>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {view === 'map' && (
              <MapView 
                authorities={authorities || []} 
                selectedCountry={selectedCountry}
                onCountryClick={setSelectedCountry}
              />
            )}

            {/* Results count */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredAuthorities.length} {filteredAuthorities.length === 1 ? 'authority' : 'authorities'} found
              </p>
            </div>

            {/* Authority cards */}
            {filteredAuthorities.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredAuthorities.map(authority => (
                  <AuthorityCard key={authority.id} authority={authority} />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No authorities found</h3>
                  <p className="text-sm text-muted-foreground">
                    {authorities?.length === 0 
                      ? "No health authorities have been added yet. Check back later as member states designate their authorities."
                      : "Try adjusting your filters or search query."}
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
