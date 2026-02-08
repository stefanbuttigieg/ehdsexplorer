import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  BookOpen,
  CheckSquare,
  ExternalLink,
  FileText,
  MapPin,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useToolkitRecommendations, type ToolkitRecommendation } from "@/hooks/useToolkitProfile";

const PROFILE_LABELS: Record<string, string> = {
  ehr_manufacturer: "EHR System Manufacturer",
  wellness_app: "Wellness / Health App Developer",
  data_holder: "Health Data Holder",
  data_user: "Health Data User / Researcher",
  health_authority: "National Health Authority",
};

const SIZE_LABELS: Record<string, string> = {
  startup: "Startup",
  sme: "SME",
  large: "Large Enterprise",
  public: "Public Sector",
};

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  checklist: <CheckSquare className="h-5 w-5" />,
  article: <BookOpen className="h-5 w-5" />,
  guide: <FileText className="h-5 w-5" />,
};

interface StarterKitResultsProps {
  profileType: string;
  organizationSize: string | null;
  answers: Record<string, string | string[]>;
  onRestart: () => void;
}

export function StarterKitResults({
  profileType,
  organizationSize,
  onRestart,
}: StarterKitResultsProps) {
  const { data: recommendations = [], isLoading } = useToolkitRecommendations(
    profileType,
    organizationSize
  );

  return (
    <div className="space-y-6">
      {/* Profile summary card */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Your Compliance Roadmap
              </CardTitle>
              <CardDescription className="mt-1">
                Personalised recommendations based on your profile
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onRestart} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Start Over
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <MapPin className="h-3 w-3" />
              {PROFILE_LABELS[profileType] ?? profileType}
            </Badge>
            {organizationSize && (
              <Badge variant="outline">
                {SIZE_LABELS[organizationSize] ?? organizationSize}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No recommendations found for this profile. Try a different configuration.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Recommended Actions ({recommendations.length})
          </h3>
          {recommendations.map((rec, index) => (
            <RecommendationCard key={rec.id} rec={rec} index={index + 1} />
          ))}
        </div>
      )}

      {/* Next steps */}
      <Card className="bg-muted/30">
        <CardContent className="py-6">
          <h3 className="font-semibold mb-3">What's Next?</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Button variant="outline" asChild className="justify-start gap-2">
              <Link to="/for/healthtech">
                <CheckSquare className="h-4 w-4" />
                Full Compliance Checklist
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start gap-2">
              <Link to="/scenario-finder">
                <FileText className="h-4 w-4" />
                Scenario Finder
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RecommendationCard({
  rec,
  index,
}: {
  rec: ToolkitRecommendation;
  index: number;
}) {
  const icon = RESOURCE_ICONS[rec.resource_type] ?? <BookOpen className="h-5 w-5" />;

  return (
    <Card className="hover:border-primary/40 transition-colors">
      <CardContent className="py-4">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold shrink-0">
            {index}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-muted-foreground">{icon}</span>
              <h4 className="font-medium text-sm">{rec.title}</h4>
            </div>
            <p className="text-sm text-muted-foreground">{rec.description}</p>
          </div>
          {rec.resource_reference && (
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link to={rec.resource_reference}>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
