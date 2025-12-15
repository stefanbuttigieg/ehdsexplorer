import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Layout from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const RecitalsPage = () => {
  const { id } = useParams();
  const selectedId = id ? parseInt(id) : null;
  const [searchQuery, setSearchQuery] = useState("");

  const { data: recitals, isLoading } = useQuery({
    queryKey: ['recitals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recitals')
        .select('*')
        .order('recital_number', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const filteredRecitals = recitals?.filter((recital) => {
    const query = searchQuery.toLowerCase();
    return (
      recital.content.toLowerCase().includes(query) ||
      recital.recital_number.toString().includes(query)
    );
  });

  useEffect(() => {
    if (selectedId && recitals) {
      const element = document.getElementById(`recital-${selectedId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [selectedId, recitals]);

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
          {selectedId 
            ? "Context and interpretation guidance" 
            : `The ${recitals?.length || ''} recitals providing context and interpretation guidance`}
        </p>

        {/* Search */}
        {!selectedId && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search recitals by number or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <Skeleton className="h-6 w-24 mb-3" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredRecitals && filteredRecitals.length > 0 ? (
          <div className="space-y-4">
            {filteredRecitals.map((recital) => (
              <Card 
                key={recital.id} 
                id={`recital-${recital.recital_number}`} 
                className={selectedId === recital.recital_number ? 'border-primary' : ''}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Link to={`/recital/${recital.recital_number}`}>
                      <Badge variant="outline" className="hover:bg-primary/10 cursor-pointer">
                        Recital {recital.recital_number}
                      </Badge>
                    </Link>
                    {recital.related_articles && recital.related_articles.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        Related: {recital.related_articles.map((a: number) => (
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
        ) : (
          <p className="text-muted-foreground text-center py-8">
            {searchQuery ? "No recitals found matching your search." : "No recitals available."}
          </p>
        )}
      </div>
    </Layout>
  );
};

export default RecitalsPage;
