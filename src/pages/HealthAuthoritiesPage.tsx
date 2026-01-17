import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHealthAuthorities, AuthorityType, AuthorityStatus, HealthAuthority } from '@/hooks/useHealthAuthorities';
import { useCountryLegislation, CountryLegislation } from '@/hooks/useCountryLegislation';
import { CountryLegislationCard } from '@/components/CountryLegislationCard';
import { LEGISLATION_STATUSES, LEGISLATION_TYPES, LegislationStatus, LegislationType } from '@/data/legislationConstants';
import { EuropeMap } from '@/components/EuropeMap';
import { Search, MapPin, Globe, Mail, Phone, Building2, Shield, ExternalLink, Map as MapIcon, List, Gavel } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// EU country names for display
const EU_COUNTRIES = [
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czechia' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'GR', name: 'Greece' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MT', name: 'Malta' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
];

const statusColors: Record<AuthorityStatus, string> = {
  active: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  planned: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  inactive: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
};

const typeLabels: Record<AuthorityType, { short: string; full: string }> = {
  digital_health_authority: { short: 'DHA', full: 'Digital Health Authority' },
  health_data_access_body: { short: 'HDAB', full: 'Health Data Access Body' },
};

const typeColors: Record<AuthorityType, string> = {
  digital_health_authority: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
  health_data_access_body: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30',
};

function AuthorityCard({ authority }: { authority: HealthAuthority }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center",
              authority.authority_type === 'digital_health_authority' 
                ? "bg-blue-500/10" 
                : "bg-purple-500/10"
            )}>
              {authority.authority_type === 'digital_health_authority' ? (
                <Building2 className="h-5 w-5 text-blue-500" />
              ) : (
                <Shield className="h-5 w-5 text-purple-500" />
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
        <Badge variant="outline" className={cn("text-xs", typeColors[authority.authority_type])}>
          {typeLabels[authority.authority_type].short} - {typeLabels[authority.authority_type].full}
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



export default function HealthAuthoritiesPage() {
  const { authorities, isLoading: authoritiesLoading } = useHealthAuthorities();
  const { data: legislation, isLoading: legislationLoading } = useCountryLegislation();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<AuthorityType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AuthorityStatus | 'all'>('all');
  const [legStatusFilter, setLegStatusFilter] = useState<LegislationStatus | 'all'>('all');
  const [legTypeFilter, setLegTypeFilter] = useState<LegislationType | 'all'>('all');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [activeTab, setActiveTab] = useState<'entities' | 'legislation'>('entities');

  const isLoading = authoritiesLoading || legislationLoading;

  const filteredAuthorities = useMemo(() => {
    if (!authorities) return [];
    
    return authorities.filter(authority => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          authority.name.toLowerCase().includes(query) ||
          authority.country_name.toLowerCase().includes(query) ||
          authority.description?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      if (typeFilter !== 'all' && authority.authority_type !== typeFilter) {
        return false;
      }
      
      if (statusFilter !== 'all' && authority.status !== statusFilter) {
        return false;
      }
      
      if (selectedCountry && authority.country_code !== selectedCountry) {
        return false;
      }
      
      return true;
    });
  }, [authorities, searchQuery, typeFilter, statusFilter, selectedCountry]);

  const filteredLegislation = useMemo(() => {
    if (!legislation) return [];
    
    return legislation.filter(leg => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          leg.title.toLowerCase().includes(query) ||
          leg.country_name.toLowerCase().includes(query) ||
          leg.summary?.toLowerCase().includes(query) ||
          leg.official_title?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      if (legStatusFilter !== 'all' && leg.status !== legStatusFilter) {
        return false;
      }
      
      if (legTypeFilter !== 'all' && leg.legislation_type !== legTypeFilter) {
        return false;
      }
      
      if (selectedCountry && leg.country_code !== selectedCountry) {
        return false;
      }
      
      return true;
    });
  }, [legislation, searchQuery, legStatusFilter, legTypeFilter, selectedCountry]);

  // Prepare country data for the map
  const countryData = useMemo(() => {
    const data: Record<string, number> = {};
    if (activeTab === 'entities') {
      filteredAuthorities.forEach(a => {
        data[a.country_code] = (data[a.country_code] || 0) + 1;
      });
    } else {
      filteredLegislation.forEach(l => {
        data[l.country_code] = (data[l.country_code] || 0) + 1;
      });
    }
    return data;
  }, [activeTab, filteredAuthorities, filteredLegislation]);

  const selectedCountryName = selectedCountry 
    ? EU_COUNTRIES.find(c => c.code === selectedCountry)?.name 
    : null;

  return (
    <Layout>
      <Helmet>
        <title>National EHDS Entities | EHDS Explorer</title>
        <meta name="description" content="Directory of Digital Health Authorities (DHAs) and Health Data Access Bodies (HDABs) across EU member states implementing the EHDS regulation." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">National EHDS Entities</h1>
          <p className="text-muted-foreground">
            Explore Digital Health Authorities (DHAs) and Health Data Access Bodies (HDABs) across EU member states.
          </p>
        </div>

        {/* Entity Type Info Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg">Digital Health Authorities (DHAs)</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Responsible for primary use of health data - ensuring citizens can access and control their electronic health records across the EU.
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-lg">Health Data Access Bodies (HDABs)</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Responsible for secondary use of health data - managing access requests for research, innovation, and policy-making purposes.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tab Selection: Entities vs Legislation */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'entities' | 'legislation')} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="entities" className="gap-2">
              <Building2 className="h-4 w-4" />
              Entities ({authorities?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="legislation" className="gap-2">
              <Gavel className="h-4 w-4" />
              Legislation ({legislation?.length || 0})
            </TabsTrigger>
          </TabsList>
        </Tabs>

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
                placeholder={activeTab === 'entities' ? "Search entities..." : "Search legislation..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {activeTab === 'entities' ? (
              <>
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
              </>
            ) : (
              <>
                <Select value={legTypeFilter} onValueChange={(v) => setLegTypeFilter(v as LegislationType | 'all')}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {Object.entries(LEGISLATION_TYPES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={legStatusFilter} onValueChange={(v) => setLegStatusFilter(v as LegislationStatus | 'all')}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    {Object.entries(LEGISLATION_STATUSES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
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
              <EuropeMap
                countryData={countryData}
                selectedCountry={selectedCountry}
                onCountryClick={setSelectedCountry}
                isLegislationView={activeTab === 'legislation'}
              />
            )}

            {/* Results count */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {activeTab === 'entities' 
                  ? `${filteredAuthorities.length} ${filteredAuthorities.length === 1 ? 'entity' : 'entities'} found`
                  : `${filteredLegislation.length} ${filteredLegislation.length === 1 ? 'law' : 'laws'} found`
                }
              </p>
            </div>

            {/* Content based on active tab */}
            {activeTab === 'entities' ? (
              filteredAuthorities.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredAuthorities.map(authority => (
                    <AuthorityCard key={authority.id} authority={authority} />
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No entities found</h3>
                    <p className="text-sm text-muted-foreground">
                      {authorities?.length === 0 
                        ? "No national entities have been added yet. Check back later as member states designate their DHAs and HDABs."
                        : "Try adjusting your filters or search query."}
                    </p>
                  </CardContent>
                </Card>
              )
            ) : (
              filteredLegislation.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredLegislation.map(leg => (
                    <CountryLegislationCard key={leg.id} legislation={leg} />
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <Gavel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No legislation found</h3>
                    <p className="text-sm text-muted-foreground">
                      {legislation?.length === 0 
                        ? "No national legislation has been tracked yet. Check back as member states transpose the EHDS regulation."
                        : "Try adjusting your filters or search query."}
                    </p>
                  </CardContent>
                </Card>
              )
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
