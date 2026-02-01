import { useState } from "react";
import { ExternalLink, BookOpen, Users, Building2, Stethoscope } from "lucide-react";
import Layout from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import TopicIndexTable from "@/components/TopicIndexTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TopicIndexPage = () => {
  const [activeTab, setActiveTab] = useState("citizen");

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6 animate-fade-in">
        <Breadcrumbs items={[{ label: "Topic Index" }]} />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-serif mb-2">Topic Index</h1>
          <p className="text-muted-foreground text-lg">
            Find EHDS articles by topic, right, or obligation — organized by stakeholder group.
          </p>
        </div>

        {/* Glossary Link Card */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" />
              EHDS Glossary
            </CardTitle>
            <CardDescription>
              Looking for definitions? The Xt-EHR project maintains a comprehensive glossary of EHDS terms, 
              acronyms, and technical definitions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="gap-2">
              <a 
                href="https://www.xt-ehr.eu/glossary-list/" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                View Xt-EHR Glossary
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="citizen" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Citizens</span>
            </TabsTrigger>
            <TabsTrigger value="healthtech" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Health Tech</span>
            </TabsTrigger>
            <TabsTrigger value="healthcare_professional" className="gap-2">
              <Stethoscope className="h-4 w-4" />
              <span className="hidden sm:inline">Healthcare Pros</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="citizen" className="space-y-6">
            <div className="prose prose-sm max-w-none dark:prose-invert mb-4">
              <p className="text-muted-foreground">
                Rights and provisions relevant to EU citizens regarding their personal health data, 
                including access, control, and cross-border portability.
              </p>
            </div>
            <TopicIndexTable stakeholderType="citizen" />
          </TabsContent>

          <TabsContent value="healthtech" className="space-y-6">
            <div className="prose prose-sm max-w-none dark:prose-invert mb-4">
              <p className="text-muted-foreground">
                Requirements and obligations for EHR system manufacturers, wellness app developers, 
                and health data platforms operating in the EU market.
              </p>
            </div>
            <TopicIndexTable stakeholderType="healthtech" />
          </TabsContent>

          <TabsContent value="healthcare_professional" className="space-y-6">
            <div className="prose prose-sm max-w-none dark:prose-invert mb-4">
              <p className="text-muted-foreground">
                Obligations and guidance for healthcare providers, hospitals, and clinicians 
                regarding health data management and patient rights support.
              </p>
            </div>
            <TopicIndexTable stakeholderType="healthcare_professional" />
          </TabsContent>
        </Tabs>

        {/* Additional Resources */}
        <Card className="mt-10">
          <CardHeader>
            <CardTitle className="text-lg">Additional Resources</CardTitle>
            <CardDescription>
              External glossaries and terminology resources for EHDS implementation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <a 
              href="https://www.xt-ehr.eu/glossary-list/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div>
                <p className="font-medium">Xt-EHR Glossary</p>
                <p className="text-sm text-muted-foreground">
                  Comprehensive glossary covering primary use terms, EHR systems, and interoperability
                </p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
            <a 
              href="/definitions" 
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div>
                <p className="font-medium">EHDS Article 2 Definitions</p>
                <p className="text-sm text-muted-foreground">
                  Official legal definitions from the EHDS Regulation text
                </p>
              </div>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </a>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TopicIndexPage;
