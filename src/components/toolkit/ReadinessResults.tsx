import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Shield,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import {
  CATEGORY_LABELS,
  type AssessmentResult,
  type CategoryScore,
} from "@/hooks/useReadinessAssessment";

const LEVEL_CONFIG: Record<
  AssessmentResult["level"],
  { label: string; color: string; icon: React.ReactNode; description: string }
> = {
  beginner: {
    label: "Beginning",
    color: "text-destructive",
    icon: <AlertTriangle className="h-6 w-6" />,
    description: "Significant gaps exist across most EHDS compliance domains. Prioritize foundational work.",
  },
  developing: {
    label: "Developing",
    color: "text-orange-500",
    icon: <TrendingUp className="h-6 w-6" />,
    description: "Some foundations in place, but several key areas need attention before compliance deadlines.",
  },
  advanced: {
    label: "Advanced",
    color: "text-blue-500",
    icon: <Shield className="h-6 w-6" />,
    description: "Good progress overall. Focus on closing remaining gaps in weaker categories.",
  },
  ready: {
    label: "Compliance Ready",
    color: "text-green-600",
    icon: <CheckCircle2 className="h-6 w-6" />,
    description: "Strong posture across all domains. Maintain and continuously improve your compliance framework.",
  },
};

interface ReadinessResultsProps {
  result: AssessmentResult;
  onRestart: () => void;
}

export function ReadinessResults({ result, onRestart }: ReadinessResultsProps) {
  const levelInfo = LEVEL_CONFIG[result.level];

  // Sort categories: weakest first for gap prioritization
  const sortedCategories = [...result.categoryScores].sort(
    (a, b) => a.percentage - b.percentage
  );

  const weakCategories = sortedCategories.filter((c) => c.percentage < 50);
  const strongCategories = sortedCategories.filter((c) => c.percentage >= 75);

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Your Readiness Score
              </CardTitle>
              <CardDescription className="mt-1">
                EHDS compliance readiness assessment results
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onRestart} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retake
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 flex-wrap">
            {/* Score circle */}
            <div className="relative w-28 h-28 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="8"
                />
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="8"
                  strokeDasharray={`${result.percentage * 2.64} ${264 - result.percentage * 2.64}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{result.percentage}%</span>
                <span className="text-xs text-muted-foreground">
                  {result.totalScore}/{result.maxScore}
                </span>
              </div>
            </div>

            {/* Level badge */}
            <div className="flex-1 min-w-0">
              <div className={`flex items-center gap-2 mb-2 ${levelInfo.color}`}>
                {levelInfo.icon}
                <span className="text-lg font-semibold">{levelInfo.label}</span>
              </div>
              <p className="text-sm text-muted-foreground">{levelInfo.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Category Breakdown</CardTitle>
          <CardDescription>Performance across EHDS compliance domains</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {sortedCategories.map((cat) => (
            <CategoryBar key={cat.category} cat={cat} />
          ))}
        </CardContent>
      </Card>

      {/* Gap Analysis */}
      {weakCategories.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Priority Gaps
            </CardTitle>
            <CardDescription>
              Areas scoring below 50% that need immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weakCategories.map((cat) => (
                <div
                  key={cat.category}
                  className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                >
                  <div>
                    <span className="font-medium text-sm">
                      {CATEGORY_LABELS[cat.category] ?? cat.category}
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getGapRecommendation(cat.category)}
                    </p>
                  </div>
                  <Badge variant="destructive">{cat.percentage}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strengths */}
      {strongCategories.length > 0 && (
        <Card className="border-green-500/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {strongCategories.map((cat) => (
                <Badge key={cat.category} variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  {CATEGORY_LABELS[cat.category] ?? cat.category} — {cat.percentage}%
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card className="bg-muted/30">
        <CardContent className="py-6">
          <h3 className="font-semibold mb-3">Recommended Next Steps</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Button variant="outline" asChild className="justify-start gap-2">
              <Link to="/tools" onClick={(e) => { e.preventDefault(); onRestart(); }}>
                <RefreshCw className="h-4 w-4" />
                Retake Assessment
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start gap-2">
              <Link to="/for/healthtech">
                <ArrowRight className="h-4 w-4" />
                Full Compliance Checklist
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CategoryBar({ cat }: { cat: CategoryScore }) {
  const label = CATEGORY_LABELS[cat.category] ?? cat.category;
  const barColor =
    cat.percentage >= 75
      ? "bg-green-500"
      : cat.percentage >= 50
        ? "bg-blue-500"
        : cat.percentage >= 30
          ? "bg-orange-500"
          : "bg-destructive";

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">
          {cat.score}/{cat.maxScore} ({cat.percentage}%)
        </span>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${cat.percentage}%` }}
        />
      </div>
    </div>
  );
}

function getGapRecommendation(category: string): string {
  const recs: Record<string, string> = {
    data_governance:
      "Start with a data inventory and establish governance policies. Review Articles 41-43.",
    technical_readiness:
      "Prioritize EU EHR exchange format support and audit logging. Review Articles 6, 14.",
    compliance_framework:
      "Designate a compliance officer and conduct a formal gap analysis. Review Articles 17, 24-27.",
    cross_border:
      "Investigate MyHealth@EU / HealthData@EU compatibility requirements. Review Articles 12-13, 52.",
    security_privacy:
      "Implement granular consent management and strengthen data protection. Review Articles 3-5, 48, 50.",
  };
  return recs[category] ?? "Review relevant EHDS articles for this domain.";
}
