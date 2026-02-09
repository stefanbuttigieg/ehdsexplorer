import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wrench,
  Sparkles,
  ClipboardCheck,
  ArrowRight,
  BookOpen,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";
import { StarterKitWizard } from "@/components/toolkit/StarterKitWizard";
import { ReadinessWizard } from "@/components/toolkit/ReadinessWizard";
import { SEOHead } from "@/components/seo";

type ActiveTool = "starter-kit" | "readiness" | null;

export default function ToolsHubPage() {
  const [activeToolId, setActiveToolId] = useState<ActiveTool>(null);

  return (
    <Layout>
      <SEOHead
        title="Compliance Tools Hub | EHDS Explorer"
        description="Interactive tools to assess your EHDS readiness: Compliance Starter Kit wizard and Readiness Assessment scoring."
      />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <span>Compliance Tools</span>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Wrench className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Compliance Tools Hub</h1>
              <p className="text-muted-foreground">
                Interactive tools to help you navigate EHDS compliance
              </p>
            </div>
          </div>
        </div>

        {/* Tool cards (when no active tool) */}
        {!activeToolId && (
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {/* Starter Kit */}
            <Card
              className="group hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
              onClick={() => setActiveToolId("starter-kit")}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">Compliance Starter Kit</CardTitle>
                    <CardDescription>5 quick questions → personalised roadmap</CardDescription>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  Answer a short questionnaire about your organization type, size, and product scope.
                  Get a tailored list of compliance priorities, relevant articles, and next steps.
                </p>
                <div className="flex gap-2 mt-4">
                  <Badge variant="secondary">~2 min</Badge>
                  <Badge variant="outline">No account needed</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Readiness Assessment */}
            <Card
              className="group hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
              onClick={() => setActiveToolId("readiness")}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <ClipboardCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">Readiness Assessment</CardTitle>
                    <CardDescription>Weighted scoring & gap analysis</CardDescription>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  Evaluate your current compliance posture across all EHDS domains.
                  Get a scored report with specific gaps identified and actionable recommendations.
                </p>
                <div className="flex gap-2 mt-4">
                  <Badge variant="secondary">~10 min</Badge>
                  <Badge variant="outline">Detailed report</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Active tool */}
        {activeToolId && (
          <div className="mb-10">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 mb-4"
              onClick={() => setActiveToolId(null)}
            >
              ← Back to Tools
            </Button>
            {activeToolId === "starter-kit" && <StarterKitWizard />}
            {activeToolId === "readiness" && <ReadinessWizard />}
          </div>
        )}

        {/* Quick links */}
        {!activeToolId && (
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="hover:border-primary/40 transition-colors">
              <CardContent className="py-5 flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm">Full Checklist</h3>
                  <p className="text-xs text-muted-foreground">Health Tech compliance</p>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/for/healthtech"><ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/40 transition-colors">
              <CardContent className="py-5 flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm">AI Assistant</h3>
                  <p className="text-xs text-muted-foreground">Ask compliance questions</p>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/help"><ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/40 transition-colors">
              <CardContent className="py-5 flex items-center gap-3">
                <Wrench className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm">Scenario Finder</h3>
                  <p className="text-xs text-muted-foreground">Find relevant articles</p>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/scenario-finder"><ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
