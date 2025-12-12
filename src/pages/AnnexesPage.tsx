import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnnexes } from "@/hooks/useAnnexes";
import { FileText, ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const AnnexesPage = () => {
  const { data: annexes = [], isLoading } = useAnnexes();

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <Breadcrumbs items={[{ label: "Annexes" }]} />
          <h1 className="text-3xl font-serif font-bold text-foreground">Annexes</h1>
          <p className="text-muted-foreground mt-2">
            Technical specifications, essential requirements, and conformity assessment documentation
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {annexes.map((annex) => (
              <Link key={annex.id} to={`/annex/${annex.id}`}>
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-serif">
                            Annex {annex.id}
                          </CardTitle>
                          <CardDescription className="mt-1 text-sm">
                            {annex.title}
                          </CardDescription>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {annex.content.substring(0, 200)}...
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AnnexesPage;
