import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { recitals, getRecitalById } from "@/data/recitals";
import Layout from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const RecitalsPage = () => {
  const { id } = useParams();
  const selectedId = id ? parseInt(id) : null;
  const selectedRecital = selectedId ? getRecitalById(selectedId) : null;

  useEffect(() => {
    if (selectedId) {
      const element = document.getElementById(`recital-${selectedId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [selectedId]);

  const breadcrumbItems = selectedId
    ? [{ label: "Recitals", href: "/recitals" }, { label: `Recital ${selectedId}` }]
    : [{ label: "Recitals" }];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <Breadcrumbs items={breadcrumbItems} />
        <h1 className="text-3xl font-bold font-serif mb-2">
          {selectedId ? `Recital ${selectedId}` : "Recitals"}
        </h1>
        <p className="text-muted-foreground mb-6">
          {selectedId ? "Context and interpretation guidance" : "The 96 recitals providing context and interpretation guidance"}
        </p>

        <div className="space-y-4">
          {recitals.map((recital) => (
            <Card key={recital.id} id={`recital-${recital.id}`} className={selectedId === recital.id ? 'border-primary' : ''}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">Recital {recital.id}</Badge>
                  {recital.relatedArticles.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Related: {recital.relatedArticles.map(a => (
                        <Link key={a} to={`/article/${a}`} className="hover:underline mx-1">Art. {a}</Link>
                      ))}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground legal-text">{recital.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default RecitalsPage;
