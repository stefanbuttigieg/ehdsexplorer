import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { annexes } from "@/data/annexes";
import { FileText, ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";

const AnnexesPage = () => {
  return (
    <Layout>
      <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Annexes</h1>
        <p className="text-muted-foreground mt-2">
          Technical specifications, essential requirements, and conformity assessment documentation
        </p>
      </div>

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
                <p className="text-sm text-muted-foreground mb-3">
                  {annex.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    {annex.sections.length} sections
                  </Badge>
                  {annex.relatedArticles.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Related: Art. {annex.relatedArticles.join(", ")}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      </div>
    </Layout>
  );
};

export default AnnexesPage;
