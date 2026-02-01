import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import TopicIndexTable from "@/components/TopicIndexTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  FileText, 
  Globe, 
  ArrowRightLeft, 
  ClipboardList, 
  ShieldOff, 
  UserX,
  ExternalLink,
  Stethoscope,
  BookOpen,
  MessageSquare,
  ArrowRight,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { 
  CLINICAL_WORKFLOWS, 
  KEY_PATIENT_RIGHTS, 
  QUICK_REFERENCES,
  type ClinicalWorkflow 
} from "@/data/healthcareWorkflows";

const iconMap: Record<string, React.ReactNode> = {
  FileText: <FileText className="h-6 w-6" />,
  Globe: <Globe className="h-6 w-6" />,
  ArrowRightLeft: <ArrowRightLeft className="h-6 w-6" />,
  ClipboardList: <ClipboardList className="h-6 w-6" />,
  ShieldOff: <ShieldOff className="h-6 w-6" />,
  UserX: <UserX className="h-6 w-6" />,
};

export default function ForHealthcareProPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <span>For Healthcare Professionals</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Stethoscope className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">EHDS for Healthcare Professionals</h1>
              <p className="text-muted-foreground">
                Workflow-oriented guide to patient rights and data sharing under the European Health Data Space
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="hover:border-primary/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Ask the AI Assistant</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Get answers about patient rights and clinical data workflows in plain language
                  </p>
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <Link to="/help">
                      Open Assistant
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Chapter II: Primary Use</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    The core chapter covering patient rights and healthcare provider obligations
                  </p>
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <Link to="/chapter/2">
                      View Chapter
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patient Rights Overview */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-2">Patient Rights at a Glance</h2>
          <p className="text-muted-foreground mb-6">
            Key rights your patients have under EHDS that affect clinical practice
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {KEY_PATIENT_RIGHTS.map((right) => (
              <Card key={right.articleNumber} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{right.right}</CardTitle>
                    <Badge variant="outline">Art. {right.articleNumber}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{right.description}</p>
                  <div className="flex items-start gap-2 p-2 bg-primary/5 rounded-md">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs">{right.practicalImplication}</p>
                  </div>
                  <Link 
                    to={`/article/${right.articleNumber}?plain=true`}
                    className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1"
                  >
                    Read Article {right.articleNumber}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Clinical Workflows */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-2">Clinical Workflow Scenarios</h2>
          <p className="text-muted-foreground mb-6">
            Step-by-step guidance for common situations you may encounter
          </p>
          <div className="space-y-6">
            {CLINICAL_WORKFLOWS.map((workflow) => (
              <WorkflowCard key={workflow.id} workflow={workflow} />
            ))}
          </div>
        </div>

        {/* Topic Index */}
        <div className="mb-8">
          <TopicIndexTable 
            stakeholderType="healthcare_professional"
            title="Find Articles by Topic"
            description="Quick reference mapping clinical topics to relevant EHDS articles and recitals"
            showRecitals={true}
          />
        </div>

        {/* Glossary Link */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Looking for definitions?</p>
                  <p className="text-sm text-muted-foreground">
                    The Xt-EHR glossary covers clinical data terminology and EHDS concepts.
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <a href="https://www.xt-ehr.eu/glossary-list/" target="_blank" rel="noopener noreferrer">
                  View Glossary
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="immediate">
              <AccordionTrigger>What does "immediately" mean for data access requests?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Under EHDS, patients have the right to access their electronic health data "immediately" through 
                  electronic means such as a patient portal. This means real-time or near-real-time access where 
                  technically feasible. For complex requests or paper-based responses, the standard GDPR timelines 
                  apply (generally 1 month, extendable to 3 months for complex requests).
                </p>
                <Link to="/article/3?plain=true" className="text-primary hover:underline text-sm mt-2 inline-block">
                  See Article 3 (Right of access) →
                </Link>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="emergency">
              <AccordionTrigger>Can I access patient data in emergencies if they've restricted access?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Yes. While patients can restrict access to their health data, Member States may provide for 
                  emergency access in life-threatening situations where knowing the patient's medical history is 
                  critical for their care. However, these emergency access events should be logged and the patient 
                  informed afterward.
                </p>
                <Link to="/article/9?plain=true" className="text-primary hover:underline text-sm mt-2 inline-block">
                  See Article 9 (Right to restriction) →
                </Link>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="cross-border">
              <AccordionTrigger>How do I access records for an EU patient from another country?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  MyHealth@EU is the infrastructure for cross-border primary use of health data. Through your 
                  national contact point (which connects to MyHealth@EU), you can access patient summaries for 
                  patients from other Member States with their consent. This includes current medications, 
                  allergies, and key medical history. Implementation depends on your Member State's connection 
                  to MyHealth@EU.
                </p>
                <Link to="/article/13?plain=true" className="text-primary hover:underline text-sm mt-2 inline-block">
                  See Article 13 (MyHealth@EU) →
                </Link>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="secondary-use">
              <AccordionTrigger>What if a patient asks about research use of their data?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Under EHDS, patients have the right to opt out of their data being used for secondary purposes 
                  like research, public health monitoring, and policy-making. If a patient asks about this, explain 
                  that their data may be used in anonymized or pseudonymized form for research, but they can 
                  exercise their opt-out right. Refer them to the national mechanism for opting out (which varies 
                  by Member State).
                </p>
                <Link to="/article/51?plain=true" className="text-primary hover:underline text-sm mt-2 inline-block">
                  See Article 51 (Opt-out right) →
                </Link>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Important Notice */}
        <Card className="mb-8 border-orange-500/30 bg-orange-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Implementation Note</h3>
                <p className="text-sm text-muted-foreground">
                  EHDS requirements are being phased in over several years. Some features like MyHealth@EU 
                  cross-border exchange depend on your Member State's implementation progress. Check with your 
                  national digital health authority for current availability in your country.
                </p>
                <Link 
                  to="/health-authorities" 
                  className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1"
                >
                  View Health Authorities Directory
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Have a Specific Question?</h3>
              <p className="text-muted-foreground mb-4">
                Our AI assistant is set up for healthcare professionals and can help with clinical data scenarios
              </p>
              <Button asChild>
                <Link to="/help" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Ask the EHDS Assistant
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

// Workflow Card Component
function WorkflowCard({ workflow }: { workflow: ClinicalWorkflow }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-muted rounded-lg shrink-0">
            {iconMap[workflow.icon]}
          </div>
          <div>
            <CardTitle className="text-lg">{workflow.title}</CardTitle>
            <CardDescription>{workflow.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Scenario */}
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm italic">
            <span className="font-medium not-italic">Scenario: </span>
            {workflow.scenario}
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-3 mb-4">
          {workflow.steps.map((step) => (
            <div key={step.step} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium shrink-0">
                {step.step}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{step.action}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{step.ehdsReference}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  {step.articleNumbers.map((art, i) => (
                    <span key={art}>
                      <Link 
                        to={`/article/${art}`}
                        className="text-xs text-primary hover:underline"
                      >
                        Art. {art}
                      </Link>
                      {i < step.articleNumbers.length - 1 && <span className="text-muted-foreground">, </span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Key Takeaway */}
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-sm">
              <span className="font-medium">Key takeaway: </span>
              {workflow.keyTakeaway}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
