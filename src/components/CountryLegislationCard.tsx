import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  LEGISLATION_STATUSES, 
  LEGISLATION_TYPES,
  type LegislationStatus,
  type LegislationType
} from '@/data/legislationConstants';
import { CountryFlag } from './CountryFlag';
import { LegislationStatusTimeline } from './LegislationStatusTimeline';
import { EnforcementMeasuresBadges } from './EnforcementMeasuresBadges';
import { useLegislationObligationLinks } from '@/hooks/useLegislationObligationLinks';
import { useEhdsObligations } from '@/hooks/useEhdsObligations';
import type { CountryLegislation } from '@/hooks/useCountryLegislation';

interface CountryLegislationCardProps {
  legislation: CountryLegislation;
  showCountry?: boolean;
  compact?: boolean;
}

const STATUS_BADGE_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  tabled: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  under_review: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  adopted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  published: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  in_force: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  superseded: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
};

const TYPE_BADGE_COLORS: Record<string, string> = {
  transposition: 'bg-primary/10 text-primary',
  related: 'bg-muted text-muted-foreground',
  amendment: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  preparatory: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
};


export function CountryLegislationCard({ 
  legislation, 
  showCountry = true,
  compact = false 
}: CountryLegislationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: links } = useLegislationObligationLinks(legislation.id);
  const { data: obligations } = useEhdsObligations();
  
  const statusConfig = LEGISLATION_STATUSES[legislation.status];
  const typeConfig = LEGISLATION_TYPES[legislation.legislation_type];

  const linkedObligations = (links || []).map(link => {
    const ob = obligations?.find(o => o.id === link.obligation_id);
    return ob ? ob.name : null;
  }).filter(Boolean);

  if (compact) {
    return (
      <div className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {showCountry && (
                <CountryFlag countryCode={legislation.country_code} size="md" />
              )}
              <span className="font-medium text-sm truncate">{legislation.title}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={cn('text-xs', STATUS_BADGE_COLORS[legislation.status])}>
                {statusConfig?.label}
              </Badge>
              <Badge variant="outline" className={cn('text-xs', TYPE_BADGE_COLORS[legislation.legislation_type])}>
                {typeConfig?.label}
              </Badge>
              {legislation.ehds_articles_referenced?.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  Art. {legislation.ehds_articles_referenced.slice(0, 3).join(', ')}
                  {legislation.ehds_articles_referenced.length > 3 && '...'}
                </span>
              )}
            </div>
          </div>
          {legislation.url && (
            <a 
              href={legislation.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {showCountry && (
                <CountryFlag countryCode={legislation.country_code} size="lg" />
              )}
              <div className="flex flex-wrap gap-2">
                <Badge className={cn(STATUS_BADGE_COLORS[legislation.status])}>
                  {statusConfig?.label}
                </Badge>
                <Badge variant="outline" className={cn(TYPE_BADGE_COLORS[legislation.legislation_type])}>
                  {typeConfig?.label}
                </Badge>
              </div>
            </div>
            <CardTitle className="text-lg">{legislation.title}</CardTitle>
            {legislation.official_title && (
              <CardDescription className="mt-1">{legislation.official_title}</CardDescription>
            )}
          </div>
          {legislation.url && (
            <a 
              href={legislation.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-1" />
                Source
              </Button>
            </a>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Timeline */}
        <div className="py-2">
          <LegislationStatusTimeline
            status={legislation.status}
            draftDate={legislation.draft_date}
            tabledDate={legislation.tabled_date}
            adoptionDate={legislation.adoption_date}
            publicationDate={legislation.publication_date}
            effectiveDate={legislation.effective_date}
          />
        </div>
        
        {/* EHDS Articles Referenced */}
        {legislation.ehds_articles_referenced?.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Related EHDS Articles</p>
            <div className="flex flex-wrap gap-1.5">
              {legislation.ehds_articles_referenced.map((articleNum) => (
                <Link key={articleNum} to={`/articles/${articleNum}`}>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-accent">
                    Article {articleNum}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Enforcement Measures */}
        {legislation.enforcement_measures?.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Enforcement Measures</p>
            <EnforcementMeasuresBadges 
              measures={legislation.enforcement_measures}
              details={legislation.enforcement_details}
              maxVisible={4}
            />
          </div>
        )}

        {/* Linked Obligations */}
        {linkedObligations.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Implements Obligations</p>
            <div className="flex flex-wrap gap-1.5">
              {linkedObligations.map((name) => (
                <Badge key={name} variant="outline" className="text-xs">
                  {name}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Expandable Details */}
        {(legislation.summary || legislation.status_notes) && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full justify-between"
            >
              <span>{isExpanded ? 'Hide details' : 'Show details'}</span>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            {isExpanded && (
              <div className="mt-3 space-y-3 pt-3 border-t">
                {legislation.summary && (
                  <div>
                    <p className="text-sm font-medium mb-1">Summary</p>
                    <p className="text-sm text-muted-foreground">{legislation.summary}</p>
                  </div>
                )}
                {legislation.status_notes && (
                  <div>
                    <p className="text-sm font-medium mb-1">Status Notes</p>
                    <p className="text-sm text-muted-foreground">{legislation.status_notes}</p>
                  </div>
                )}
                {legislation.effective_date && (
                  <div>
                    <p className="text-sm font-medium mb-1">Effective Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(legislation.effective_date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
