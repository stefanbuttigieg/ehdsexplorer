import { useState } from "react";
import { Copy, Check, ExternalLink, Code, Database, FileJson } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const API_BASE = "https://lmjjghvrjgffmbidajih.supabase.co/functions/v1/api-data";

const endpoints = [
  {
    resource: "articles",
    description: "All 105 articles of the EHDS Regulation",
    parameters: [
      { name: "id", type: "number", description: "Optional. Return a specific article by number" },
      { name: "format", type: "string", description: "Response format: json (default) or csv" },
    ],
    exampleResponse: {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "EHDS Regulation - articles",
      data: [
        { article_number: 1, title: "Subject matter and scope", content: "1. This Regulation lays down...", chapter_id: 1 },
        { article_number: 2, title: "Definitions", content: "For the purposes of this Regulation...", chapter_id: 1 },
      ],
      recordCount: 105,
    },
  },
  {
    resource: "recitals",
    description: "All 115 recitals providing interpretation guidance",
    parameters: [
      { name: "id", type: "number", description: "Optional. Return a specific recital by number" },
      { name: "format", type: "string", description: "Response format: json (default) or csv" },
    ],
    exampleResponse: {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "EHDS Regulation - recitals",
      data: [
        { recital_number: 1, content: "The European Health Data Space...", related_articles: [1, 2] },
      ],
      recordCount: 115,
    },
  },
  {
    resource: "definitions",
    description: "All defined terms from Article 2",
    parameters: [
      { name: "format", type: "string", description: "Response format: json (default) or csv" },
    ],
    exampleResponse: {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "EHDS Regulation - definitions",
      data: [
        { term: "electronic health data", definition: "health data that is processed...", source_article: 2 },
      ],
      recordCount: 62,
    },
  },
  {
    resource: "chapters",
    description: "Chapter structure of the regulation",
    parameters: [
      { name: "format", type: "string", description: "Response format: json (default) or csv" },
    ],
    exampleResponse: {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "EHDS Regulation - chapters",
      data: [
        { chapter_number: 1, title: "General provisions", description: "Articles 1-2" },
      ],
      recordCount: 10,
    },
  },
  {
    resource: "implementing-acts",
    description: "Implementing and delegated acts tracker",
    parameters: [
      { name: "format", type: "string", description: "Response format: json (default) or csv" },
    ],
    exampleResponse: {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "EHDS Regulation - implementing-acts",
      data: [
        { id: "art-6-ehr-categories", title: "EHR Categories", type: "implementing", status: "pending", theme: "Primary Use" },
      ],
      recordCount: 33,
    },
  },
  {
    resource: "metadata",
    description: "API metadata and regulation information",
    parameters: [],
    exampleResponse: {
      regulation: {
        title: "Regulation (EU) 2025/327 - European Health Data Space",
        celex: "32025R0327",
        eli: "http://data.europa.eu/eli/reg/2025/327",
        eurLex: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32025R0327",
        datePublished: "2025-01-22",
      },
      api: {
        version: "1.0",
        endpoints: ["articles", "recitals", "definitions", "chapters", "implementing-acts"],
      },
      license: "MIT",
    },
  },
];

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
};

const CodeBlock = ({ code, language = "json" }: { code: string; language?: string }) => (
  <div className="relative">
    <div className="absolute right-2 top-2">
      <CopyButton text={code} />
    </div>
    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
      <code>{code}</code>
    </pre>
  </div>
);

const ApiDocsPage = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <Breadcrumbs items={[{ label: "API Documentation" }]} />

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Code className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold font-serif">API Documentation</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Access EHDS Regulation data programmatically. This public API provides FAIR-compliant 
            access to articles, recitals, definitions, and more.
          </p>
        </div>

        {/* Quick Start */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Quick Start
            </CardTitle>
            <CardDescription>
              The API is publicly accessible without authentication. All responses include Schema.org metadata.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Base URL</p>
              <CodeBlock code={API_BASE} />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Example Request</p>
              <CodeBlock code={`curl "${API_BASE}?resource=articles&format=json"`} language="bash" />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Get a specific article</p>
              <CodeBlock code={`curl "${API_BASE}?resource=articles&id=42"`} language="bash" />
            </div>
          </CardContent>
        </Card>

        {/* Response Format */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5" />
              Response Format
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              All JSON responses are wrapped in a Schema.org Dataset structure for FAIR compliance:
            </p>
            <CodeBlock
              code={JSON.stringify(
                {
                  "@context": "https://schema.org",
                  "@type": "Dataset",
                  name: "EHDS Regulation - [resource]",
                  description: "...",
                  license: "https://opensource.org/licenses/MIT",
                  identifier: "ehds-explorer-[resource]",
                  dateModified: "2025-01-22T00:00:00.000Z",
                  publisher: { "@type": "Organization", name: "EHDS Explorer" },
                  isPartOf: { "@type": "Legislation", name: "Regulation (EU) 2025/327" },
                  data: ["... your requested data ..."],
                  recordCount: 0,
                },
                null,
                2
              )}
            />
          </CardContent>
        </Card>

        {/* Endpoints */}
        <h2 className="text-2xl font-bold font-serif mb-4">Endpoints</h2>

        <Tabs defaultValue="articles" className="mb-8">
          <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
            {endpoints.map((ep) => (
              <TabsTrigger key={ep.resource} value={ep.resource} className="text-xs">
                {ep.resource}
              </TabsTrigger>
            ))}
          </TabsList>

          {endpoints.map((ep) => (
            <TabsContent key={ep.resource} value={ep.resource}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{ep.resource}</CardTitle>
                    <Badge variant="outline">GET</Badge>
                  </div>
                  <CardDescription>{ep.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-sm font-medium mb-2">Endpoint</p>
                    <CodeBlock code={`${API_BASE}?resource=${ep.resource}`} />
                  </div>

                  {ep.parameters.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Parameters</p>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="text-left p-3 font-medium">Name</th>
                              <th className="text-left p-3 font-medium">Type</th>
                              <th className="text-left p-3 font-medium">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ep.parameters.map((param) => (
                              <tr key={param.name} className="border-t">
                                <td className="p-3 font-mono text-primary">{param.name}</td>
                                <td className="p-3 text-muted-foreground">{param.type}</td>
                                <td className="p-3">{param.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium mb-2">Example Response</p>
                    <CodeBlock code={JSON.stringify(ep.exampleResponse, null, 2)} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* FAIR Compliance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>FAIR Data Principles</CardTitle>
            <CardDescription>
              This API is designed following FAIR principles for research data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 rounded-lg bg-muted">
                <h4 className="font-semibold mb-1">Findable</h4>
                <p className="text-sm text-muted-foreground">
                  Persistent URLs, unique identifiers, rich metadata
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <h4 className="font-semibold mb-1">Accessible</h4>
                <p className="text-sm text-muted-foreground">
                  Open HTTP API, no authentication required, multiple formats
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <h4 className="font-semibold mb-1">Interoperable</h4>
                <p className="text-sm text-muted-foreground">
                  Schema.org vocabulary, JSON/CSV formats, ELI identifiers
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <h4 className="font-semibold mb-1">Reusable</h4>
                <p className="text-sm text-muted-foreground">
                  MIT license, clear provenance, version information
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal References */}
        <Card>
          <CardHeader>
            <CardTitle>Legal References</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32025R0327"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              EUR-Lex Official Publication
            </a>
            <a
              href="http://data.europa.eu/eli/reg/2025/327"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              European Legislation Identifier (ELI)
            </a>
            <a
              href="https://github.com/stefanbuttigieg/ehdsexplorer"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Source Code on GitHub
            </a>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ApiDocsPage;
