import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Sparkles, 
  Heart, 
  Laptop, 
  Stethoscope, 
  FlaskConical, 
  HelpCircle,
  ArrowRight,
  RotateCcw,
  FileText,
  Plane,
  Pencil,
  ShieldOff,
  ArrowRightLeft,
  Award,
  Smartphone,
  Network,
  Tag,
  ClipboardList,
  Globe,
  Users,
  FileCheck,
  Lock,
  Info,
  Split,
  Scale,
  Loader2,
  AlertCircle,
  ChevronLeft
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SCENARIO_TEMPLATES, SCENARIO_CATEGORIES, type ScenarioTemplate } from '@/data/scenarioTemplates';
import { useScenarioAnalysis } from '@/hooks/useScenarioAnalysis';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart,
  Laptop,
  Stethoscope,
  FlaskConical,
  HelpCircle,
  FileText,
  Plane,
  Pencil,
  ShieldOff,
  ArrowRightLeft,
  Award,
  Smartphone,
  Network,
  Tag,
  ClipboardList,
  Globe,
  Users,
  Search,
  FileCheck,
  Lock,
  Info,
  Split,
  Scale,
};

const ScenarioFinderPage = () => {
  const [customScenario, setCustomScenario] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('citizen');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioTemplate | null>(null);
  const { analyzeScenario, isLoading, error, result, reset } = useScenarioAnalysis();

  const handleSelectScenario = (scenario: ScenarioTemplate) => {
    setSelectedScenario(scenario);
    setCustomScenario(scenario.promptText);
  };

  const handleAnalyze = async () => {
    if (!customScenario.trim()) return;
    await analyzeScenario(customScenario);
  };

  const handleReset = () => {
    reset();
    setCustomScenario('');
    setSelectedScenario(null);
  };

  const filteredScenarios = SCENARIO_TEMPLATES.filter(s => s.category === activeCategory);

  const renderIcon = (iconName: string, className?: string) => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent className={className} /> : null;
  };

  return (
    <Layout>
      <Helmet>
        <title>Scenario Finder | EHDS Explorer</title>
        <meta name="description" content="Describe your situation and get AI-powered guidance on which EHDS articles apply and what compliance looks like." />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <span>Scenario Finder</span>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Scenario Finder</h1>
              <p className="text-muted-foreground">
                Describe your situation and get AI-powered EHDS guidance
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {!result ? (
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Scenario Templates - Left Side */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Common Scenarios</CardTitle>
                  <CardDescription>
                    Select a predefined scenario or write your own
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                    <div className="px-4 border-b">
                      <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0 pb-3">
                        {SCENARIO_CATEGORIES.map(cat => (
                          <TabsTrigger 
                            key={cat.id} 
                            value={cat.id}
                            className="text-xs px-2 py-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                          >
                            {renderIcon(cat.icon, 'h-3 w-3 mr-1 inline')}
                            {cat.label}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>
                    
                    <ScrollArea className="h-[400px]">
                      <div className="p-4 space-y-2">
                        {filteredScenarios.map(scenario => (
                          <button
                            key={scenario.id}
                            onClick={() => handleSelectScenario(scenario)}
                            className={`w-full text-left p-3 rounded-lg border transition-all hover:border-primary/50 hover:bg-muted/50 ${
                              selectedScenario?.id === scenario.id 
                                ? 'border-primary bg-primary/5' 
                                : 'border-transparent bg-muted/30'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
                                {renderIcon(scenario.icon, 'h-4 w-4')}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm">{scenario.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {scenario.description}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Scenario Input - Right Side */}
            <div className="lg:col-span-3">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Describe Your Scenario
                  </CardTitle>
                  <CardDescription>
                    Provide details about your situation and the AI will identify relevant EHDS articles and compliance requirements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedScenario && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary" className="gap-1">
                        {renderIcon(selectedScenario.icon, 'h-3 w-3')}
                        {selectedScenario.title}
                      </Badge>
                      <button 
                        onClick={() => setSelectedScenario(null)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  
                  <Textarea
                    value={customScenario}
                    onChange={(e) => setCustomScenario(e.target.value)}
                    placeholder="Describe your situation in detail. For example: 'I am a health tech startup developing a patient monitoring app. We collect vital signs and want to allow patients to share this data with their doctors. What EHDS requirements apply to us?'"
                    className="min-h-[200px] resize-none"
                  />

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {customScenario.length} characters
                    </p>
                    <Button 
                      onClick={handleAnalyze}
                      disabled={!customScenario.trim() || isLoading}
                      size="lg"
                      className="gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Analyze Scenario
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Results View */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={handleReset} className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                New Scenario
              </Button>
              <Badge variant="outline" className="gap-1">
                {result.isComplete ? (
                  <>Analysis Complete</>
                ) : (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Analyzing...
                  </>
                )}
              </Badge>
            </div>

            {/* Original Scenario */}
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Your Scenario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{customScenario}</p>
              </CardContent>
            </Card>

            {/* AI Analysis Result */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  EHDS Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ href, children }) => {
                        // Convert article links to proper internal links
                        if (href?.startsWith('/articles/')) {
                          return (
                            <Link 
                              to={href} 
                              className="text-primary hover:underline font-medium"
                            >
                              {children}
                            </Link>
                          );
                        }
                        return (
                          <a 
                            href={href} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {children}
                          </a>
                        );
                      },
                    }}
                  >
                    {result.content}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Analyze Another Scenario
              </Button>
              <Button variant="outline" asChild className="gap-2">
                <Link to="/articles">
                  <FileText className="h-4 w-4" />
                  Browse All Articles
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <Alert className="mt-8 border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm">
            <strong>Important:</strong> EHDS implementing acts are still under development by the European Commission. 
            Compliance requirements and technical specifications will evolve as these acts are finalized. 
            The guidance provided here reflects the current state of the regulation and should be reviewed 
            as new implementing acts are adopted. Always consult official sources for the latest requirements.
          </AlertDescription>
        </Alert>

        {/* Info Section */}
        {!result && (
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">Article Citations</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get direct links to relevant EHDS articles with explanations of why they apply
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-secondary/50 to-transparent border-secondary">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-secondary">
                    <Award className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <h3 className="font-semibold">Compliance Guidance</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Understand what "compliant" looks like in your specific situation
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-accent/50 to-transparent border-accent">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-accent">
                    <ClipboardList className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <h3 className="font-semibold">Documentation Tips</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Learn what evidence and documentation you may need
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ScenarioFinderPage;
