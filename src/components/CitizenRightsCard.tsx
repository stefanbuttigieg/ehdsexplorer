import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileSearch, 
  Download, 
  PenLine, 
  ArrowLeftRight, 
  Eye, 
  ShieldCheck, 
  UserX, 
  Globe, 
  Pill, 
  MessageSquareWarning,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { CITIZEN_RIGHTS, RIGHTS_CATEGORIES, type CitizenRight } from '@/data/citizenRights';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ReactNode> = {
  FileSearch: <FileSearch className="h-5 w-5" />,
  Download: <Download className="h-5 w-5" />,
  PenLine: <PenLine className="h-5 w-5" />,
  ArrowLeftRight: <ArrowLeftRight className="h-5 w-5" />,
  Eye: <Eye className="h-5 w-5" />,
  ShieldCheck: <ShieldCheck className="h-5 w-5" />,
  UserX: <UserX className="h-5 w-5" />,
  Globe: <Globe className="h-5 w-5" />,
  Pill: <Pill className="h-5 w-5" />,
  MessageSquareWarning: <MessageSquareWarning className="h-5 w-5" />,
};

const categoryColors: Record<string, string> = {
  access: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  control: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  protection: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  'cross-border': 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
};

const categoryIconColors: Record<string, string> = {
  access: 'text-blue-600 dark:text-blue-400',
  control: 'text-green-600 dark:text-green-400',
  protection: 'text-purple-600 dark:text-purple-400',
  'cross-border': 'text-orange-600 dark:text-orange-400',
};

interface RightCardProps {
  right: CitizenRight;
  compact?: boolean;
}

const RightCard: React.FC<RightCardProps> = ({ right, compact = false }) => {
  const category = RIGHTS_CATEGORIES[right.category];
  
  return (
    <Card className={cn(
      "group hover:shadow-md transition-all duration-200 border-border/50",
      compact && "p-3"
    )}>
      <CardContent className={cn("p-4", compact && "p-0")}>
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2 rounded-lg bg-muted shrink-0",
            categoryIconColors[right.category]
          )}>
            {iconMap[right.icon]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-medium text-foreground">{right.title}</h3>
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", categoryColors[right.category])}>
                {category.label}
              </Badge>
            </div>
            {!compact && (
              <p className="text-sm text-muted-foreground mb-3">
                {right.description}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {right.articleNumbers.map(num => (
                <Link 
                  key={num} 
                  to={`/article/${num}?plain=true`}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Art. {num}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface CitizenRightsCardProps {
  category?: 'access' | 'control' | 'protection' | 'cross-border';
  limit?: number;
  showHeader?: boolean;
  compact?: boolean;
  className?: string;
}

const CitizenRightsCard: React.FC<CitizenRightsCardProps> = ({
  category,
  limit,
  showHeader = true,
  compact = false,
  className,
}) => {
  let rights = category 
    ? CITIZEN_RIGHTS.filter(r => r.category === category)
    : CITIZEN_RIGHTS;
  
  if (limit) {
    rights = rights.slice(0, limit);
  }

  return (
    <div className={cn("space-y-4", className)}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Your Rights Under EHDS</h2>
            <p className="text-sm text-muted-foreground">
              The European Health Data Space gives you control over your health data
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/for/citizens" className="flex items-center gap-1">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
      
      <div className={cn(
        "grid gap-3",
        compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
      )}>
        {rights.map(right => (
          <RightCard key={right.id} right={right} compact={compact} />
        ))}
      </div>
    </div>
  );
};

export default CitizenRightsCard;
