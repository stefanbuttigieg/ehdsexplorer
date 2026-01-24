import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { usePageContent } from "@/hooks/usePageContent";
import { KeyDatesGantt } from "@/components/KeyDatesGantt";
import { ImplementationTimelineTracker } from "@/components/ImplementationTimelineTracker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const OverviewPage = () => {
  const { data: page, isLoading } = usePageContent('overview');

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto p-6 animate-fade-in">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-12 w-full mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  const content = page?.content;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-6 animate-fade-in">
        <Breadcrumbs items={[{ label: "Overview" }]} />
        <Badge variant="outline" className="mb-2">{content?.regulation_reference || 'Regulation (EU) 2025/327'}</Badge>
        <h1 className="text-3xl font-bold font-serif mb-4">{page?.title || 'European Health Data Space Regulation'}</h1>
        <p className="text-lg text-muted-foreground mb-8">{content?.subtitle || 'Quick overview of the EHDS Regulation'}</p>

        <Card className="mb-6">
          <CardHeader><CardTitle>{content?.what_is_ehds?.title || 'What is the EHDS?'}</CardTitle></CardHeader>
          <CardContent className="legal-text space-y-4">
            <p>{content?.what_is_ehds?.intro}</p>
            <ul className="list-disc ml-6 space-y-2">
              {content?.what_is_ehds?.points?.map((point: { title: string; description: string }, idx: number) => (
                <li key={idx}><strong>{point.title}</strong> {point.description}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader><CardTitle>{content?.key_components?.title || 'Key Components'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {content?.key_components?.items?.map((item: { title: string; description: string }, idx: number) => (
              <div key={idx} className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader><CardTitle>{content?.key_dates?.title || 'Key Dates & Implementation Timeline'}</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue="regulation" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="regulation">Regulation Milestones</TabsTrigger>
                <TabsTrigger value="implementation">Member State Implementation</TabsTrigger>
              </TabsList>
              
              <TabsContent value="regulation">
                {content?.key_dates?.dates && content.key_dates.dates.length > 0 ? (
                  <KeyDatesGantt dates={content.key_dates.dates} />
                ) : (
                  <p className="text-muted-foreground">No key dates available.</p>
                )}
              </TabsContent>
              
              <TabsContent value="implementation">
                <ImplementationTimelineTracker 
                  showKeyDates={false}
                  keyDates={content?.key_dates?.dates || []}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default OverviewPage;
