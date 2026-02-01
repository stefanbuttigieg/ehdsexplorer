import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import TopicIndexTable from "@/components/TopicIndexTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Server, 
  Smartphone, 
  Database, 
  FileSearch, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle,
  BookOpen,
  MessageSquare,
  ArrowRight,
  Building2,
  Shield
} from "lucide-react";
import { useState, useEffect } from "react";
import { 
  ALL_COMPLIANCE_CATEGORIES, 
  HEALTH_TECH_ARTICLE_GROUPS,
  type ComplianceCategory,
  type ComplianceItem 
} from "@/data/healthTechCompliance";

const iconMap: Record<string, React.ReactNode> = {
  Server: <Server className="h-6 w-6" />,
  Smartphone: <Smartphone className="h-6 w-6" />,
  Database: <Database className="h-6 w-6" />,
  FileSearch: <FileSearch className="h-6 w-6" />,
};

const priorityColors: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500 text-white",
  medium: "bg-muted text-muted-foreground",
};

const priorityLabels: Record<string, string> = {
  critical: "Critical",
  high: "High Priority",
  medium: "Medium",
};

export default function ForHealthTechPage() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Load checked items from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("ehds-healthtech-checklist");
    if (saved) {
      setCheckedItems(JSON.parse(saved));
    }
  }, []);

  // Save checked items to localStorage
  useEffect(() => {
    localStorage.setItem("ehds-healthtech-checklist", JSON.stringify(checkedItems));
  }, [checkedItems]);

  const toggleItem = (itemId: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const getCategoryProgress = (category: ComplianceCategory) => {
    const total = category.items.length;
    const checked = category.items.filter(item => checkedItems[item.id]).length;
    return { checked, total, percentage: Math.round((checked / total) * 100) };
  };

  const getTotalProgress = () => {
    const allItems = ALL_COMPLIANCE_CATEGORIES.flatMap(cat => cat.items);
    const total = allItems.length;
    const checked = allItems.filter(item => checkedItems[item.id]).length;
    return { checked, total, percentage: Math.round((checked / total) * 100) };
  };

  const totalProgress = getTotalProgress();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <span>For Health Tech Companies</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">EHDS Compliance for Health Tech</h1>
              <p className="text-muted-foreground">
                Interactive compliance checklist and guidance for EHR vendors, health data platforms, and wellness apps
              </p>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Your Compliance Progress
              </CardTitle>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {totalProgress.checked} / {totalProgress.total} items
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${totalProgress.percentage}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {totalProgress.percentage}% complete — Progress is saved locally in your browser
              </p>
            </div>
          </CardContent>
        </Card>

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
                    Get instant answers about compliance requirements tailored for health tech developers
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
                  <h3 className="font-semibold mb-1">Browse All Articles</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Explore the complete regulation text with cross-references and plain language views
                  </p>
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <Link to="/articles">
                      View Articles
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Selection */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Your Organization Type</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ALL_COMPLIANCE_CATEGORIES.map((category) => {
              const progress = getCategoryProgress(category);
              const isSelected = selectedCategory === category.id;
              return (
                <Card 
                  key={category.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedCategory(isSelected ? null : category.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {iconMap[category.icon]}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{category.title}</h3>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {progress.checked}/{progress.total} requirements
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Compliance Checklists */}
        <div className="space-y-6 mb-12">
          {ALL_COMPLIANCE_CATEGORIES
            .filter(cat => !selectedCategory || cat.id === selectedCategory)
            .map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    {iconMap[category.icon]}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {category.items.map((item) => (
                    <ComplianceItemRow
                      key={item.id}
                      item={item}
                      isChecked={checkedItems[item.id] || false}
                      onToggle={() => toggleItem(item.id)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Topic Index */}
        <div className="mb-12">
          <TopicIndexTable 
            stakeholderType="healthtech"
            title="Find Articles by Topic"
            description="Quick reference mapping compliance topics to relevant EHDS articles and recitals"
            showRecitals={true}
          />
        </div>

        {/* FAQ Accordion */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="what-is-ehr">
              <AccordionTrigger>What qualifies as an "EHR system" under EHDS?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  An EHR system under EHDS is any software product that stores, intermediates, imports, exports, 
                  converts, edits, or views electronic health records. This includes hospital information systems, 
                  practice management software, and specialized clinical systems. The definition is broad to ensure 
                  comprehensive coverage of health data systems.
                </p>
                <Link to="/article/2?plain=true" className="text-primary hover:underline text-sm mt-2 inline-block">
                  See Article 2 (Definitions) →
                </Link>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="ce-marking">
              <AccordionTrigger>Do I need CE marking for my health software?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  EHR systems placed on the EU market must carry CE marking to indicate conformity with EHDS 
                  requirements. This is separate from medical device CE marking under MDR—EHDS has its own 
                  conformity assessment process based on self-declaration by manufacturers for most EHR systems.
                </p>
                <Link to="/article/27?plain=true" className="text-primary hover:underline text-sm mt-2 inline-block">
                  See Article 27 (CE marking) →
                </Link>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="timeline">
              <AccordionTrigger>When do these requirements apply?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  EHDS requirements are being phased in. Key deadlines include 2 years after entry into force 
                  for EHR system requirements and 4 years for the full secondary use framework. Check the 
                  implementing acts timeline for specific milestones relevant to your product category.
                </p>
                <Link to="/implementing-acts" className="text-primary hover:underline text-sm mt-2 inline-block">
                  View Implementation Timeline →
                </Link>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="wellness">
              <AccordionTrigger>Are wellness apps covered by EHDS?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Wellness apps are not subject to mandatory EHDS requirements. However, if a wellness app 
                  claims to be interoperable with EHR systems, it can apply for a voluntary EU label. This 
                  label signals to users and healthcare providers that the app meets interoperability standards.
                </p>
                <Link to="/article/31?plain=true" className="text-primary hover:underline text-sm mt-2 inline-block">
                  See Article 31 (Wellness applications) →
                </Link>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* CTA */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Need More Guidance?</h3>
              <p className="text-muted-foreground mb-4">
                Use our AI assistant to get personalized answers about EHDS compliance for your specific product
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

// Compliance Item Row Component
function ComplianceItemRow({ 
  item, 
  isChecked, 
  onToggle 
}: { 
  item: ComplianceItem; 
  isChecked: boolean; 
  onToggle: () => void;
}) {
  return (
    <div className={`p-4 rounded-lg border transition-colors ${
      isChecked ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 hover:bg-muted/50'
    }`}>
      <div className="flex items-start gap-3">
        <Checkbox 
          checked={isChecked}
          onCheckedChange={onToggle}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`font-medium ${isChecked ? 'line-through text-muted-foreground' : ''}`}>
              {item.requirement}
            </span>
            <Badge className={priorityColors[item.priority]} variant="secondary">
              {priorityLabels[item.priority]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              <span>
                {item.articleReferences.map((art, i) => (
                  <span key={art}>
                    <Link 
                      to={`/article/${art}`} 
                      className="text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Art. {art}
                    </Link>
                    {i < item.articleReferences.length - 1 && ', '}
                  </span>
                ))}
              </span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <CheckCircle2 className="h-3 w-3" />
              <span>{item.evidenceHint}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
