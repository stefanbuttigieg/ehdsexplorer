import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { definitions, searchDefinitions } from "@/data/definitions";
import Layout from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const DefinitionsPage = () => {
  const [query, setQuery] = useState("");
  const filteredDefs = query ? searchDefinitions(query) : definitions;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <Breadcrumbs items={[{ label: "Definitions" }]} />
        <h1 className="text-3xl font-bold font-serif mb-2">Definitions</h1>
        <p className="text-muted-foreground mb-6">Article 2 definitions from the EHDS Regulation</p>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search definitions..."
            className="pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          {filteredDefs.map((def, idx) => (
            <Card key={idx} id={def.term.toLowerCase().replace(/\s+/g, '-')}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{def.term}</h3>
                  <Badge variant="outline" className="text-xs">{def.articleReference}</Badge>
                </div>
                <p className="text-muted-foreground legal-text">{def.definition}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default DefinitionsPage;
