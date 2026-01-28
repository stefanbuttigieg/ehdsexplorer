import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { usePageContent } from "@/hooks/usePageContent";
import { KeyDatesGantt } from "@/components/KeyDatesGantt";
import { ImplementationTimelineTracker } from "@/components/ImplementationTimelineTracker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsFeatureEnabled } from "@/hooks/useFeatureFlags";

const OverviewPage = () => {
  const { data: page, isLoading } = usePageContent('overview');
  const { isEnabled: isImplementationTrackerEnabled } = useIsFeatureEnabled('implementation_tracker');

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto p-4 md:p-6 animate-fade-in">
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
      <div className="max-w-5xl mx-auto p-4 md:p-6 animate-fade-in">
        <Breadcrumbs items={[{ label: "Overview" }]} />
        <Badge variant="outline" className="mb-2 text-xs md:text-sm">{content?.regulation_reference || 'Regulation (EU) 2025/327'}</Badge>
        <h1 className="text-2xl md:text-3xl font-bold font-serif mb-3 md:mb-4">{page?.title || 'European Health Data Space Regulation'}</h1>
        <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8">{content?.subtitle || 'Quick overview of the EHDS Regulation'}</p>

        <Card className="mb-4 md:mb-6">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl">{content?.what_is_ehds?.title || 'What is the EHDS?'}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 legal-text space-y-3 md:space-y-4">
            <p className="text-sm md:text-base">{content?.what_is_ehds?.intro}</p>
            <ul className="list-disc ml-4 md:ml-6 space-y-2 text-sm md:text-base">
              {content?.what_is_ehds?.points?.map((point: { title: string; description: string }, idx: number) => (
                <li key={idx}><strong>{point.title}</strong> {point.description}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-4 md:mb-6">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl">{content?.key_components?.title || 'Key Components'}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 space-y-3 md:space-y-4">
            {content?.key_components?.items?.map((item: { title: string; description: string }, idx: number) => (
              <div key={idx} className="p-3 md:p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-1 md:mb-2 text-sm md:text-base">{item.title}</h4>
                <p className="text-xs md:text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="mb-4 md:mb-6">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl">{content?.key_dates?.title || 'Key Dates & Implementation Timeline'}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {isImplementationTrackerEnabled ? (
              <Tabs defaultValue="regulation" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-3 md:mb-4 h-auto">
                  <TabsTrigger value="regulation" className="text-xs sm:text-sm py-2 px-2">
                    <span className="hidden sm:inline">Regulation Milestones</span>
                    <span className="sm:hidden">Milestones</span>
                  </TabsTrigger>
                  <TabsTrigger value="implementation" className="text-xs sm:text-sm py-2 px-2">
                    <span className="hidden sm:inline">Member State Implementation</span>
                    <span className="sm:hidden">Implementation</span>
                  </TabsTrigger>
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
            ) : (
              // When implementation tracker is disabled, just show the key dates
              content?.key_dates?.dates && content.key_dates.dates.length > 0 ? (
                <KeyDatesGantt dates={content.key_dates.dates} />
              ) : (
                <p className="text-muted-foreground">No key dates available.</p>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default OverviewPage;
