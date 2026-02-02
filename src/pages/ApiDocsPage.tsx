import { useState } from "react";
import { Copy, Check, ExternalLink, Code, Database, FileJson } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const API_BASE = "https://api.ehdsexplorer.eu/";

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
        {
          article_number: 1,
          title: "Subject matter and scope",
          content: "1. This Regulation lays down...",
          chapter_id: 1,
        },
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
      data: [{ recital_number: 1, content: "The European Health Data Space...", related_articles: [1, 2] }],
      recordCount: 115,
    },
  },
  {
    resource: "definitions",
    description: "All defined terms from Article 2",
    parameters: [{ name: "format", type: "string", description: "Response format: json (default) or csv" }],
    exampleResponse: {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "EHDS Regulation - definitions",
      data: [{ term: "electronic health data", definition: "health data that is processed...", source_article: 2 }],
      recordCount: 62,
    },
  },
  {
    resource: "chapters",
    description: "Chapter structure of the regulation",
    parameters: [{ name: "format", type: "string", description: "Response format: json (default) or csv" }],
    exampleResponse: {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "EHDS Regulation - chapters",
      data: [{ chapter_number: 1, title: "General provisions", description: "Articles 1-2" }],
      recordCount: 10,
    },
  },
  {
    resource: "implementing-acts",
    description: "Implementing and delegated acts tracker",
    parameters: [{ name: "format", type: "string", description: "Response format: json (default) or csv" }],
    exampleResponse: {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "EHDS Regulation - implementing-acts",
      data: [
        {
          id: "art-6-ehr-categories",
          title: "EHR Categories",
          type: "implementing",
          status: "pending",
          theme: "Primary Use",
        },
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

const CopyButton = ({ text, label }: { text: string; label?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (label) {
    return (
      <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied!" : label}
      </Button>
    );
  }

  return (
    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
};

const TryItButton = ({ resource, id }: { resource: string; id?: number }) => {
  const url = id ? `${API_BASE}?resource=${resource}&id=${id}` : `${API_BASE}?resource=${resource}`;

  return (
    <Button variant="default" size="sm" onClick={() => window.open(url, "_blank")} className="gap-2">
      <ExternalLink className="h-4 w-4" />
      Try it
    </Button>
  );
};

const CodeBlock = ({ code, language = "json" }: { code: string; language?: string }) => (
  <div className="relative">
    <div className="absolute right-1 top-1 sm:right-2 sm:top-2 z-10">
      <CopyButton text={code} />
    </div>
    <pre className="bg-muted p-3 sm:p-4 rounded-lg overflow-x-auto text-xs sm:text-sm font-mono max-w-full">
      <code className="break-all whitespace-pre-wrap sm:whitespace-pre">{code}</code>
    </pre>
  </div>
);

const ApiDocsPage = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 animate-fade-in">
        <Breadcrumbs items={[{ label: "API Documentation" }]} />

        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Code className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold font-serif">API Documentation</h1>
          </div>
          <p className="text-muted-foreground text-base sm:text-lg">
            Access EHDS Regulation data programmatically. This public API provides FAIR-compliant access to articles,
            recitals, definitions, and more.
          </p>
        </div>

        {/* Quick Start - Hero Section */}
        <Card className="mb-6 sm:mb-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Public API
              </Badge>
              <Badge variant="outline" className="text-xs">
                No Auth Required
              </Badge>
            </div>
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl mt-2">
              <Database className="h-5 w-5 sm:h-6 sm:w-6" />
              Quick Start
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Get started in seconds. Copy the base URL and start making requests.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0 sm:pt-0">
            {/* Prominent Base URL Section */}
            <div className="p-3 sm:p-4 rounded-lg bg-background border-2 border-dashed border-primary/30">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
                <p className="text-sm font-semibold text-primary">Base URL</p>
                <CopyButton text={API_BASE} label="Copy URL" />
              </div>
              <code className="block text-xs sm:text-sm font-mono bg-muted p-2 sm:p-3 rounded-md break-all overflow-x-auto">
                {API_BASE}
              </code>
            </div>

            {/* Quick Examples */}
            <div className="grid gap-3 sm:gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    GET
                  </Badge>
                  <p className="text-xs sm:text-sm font-medium">Fetch all articles</p>
                </div>
                <CodeBlock code={`curl "${API_BASE}?resource=articles"`} language="bash" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    GET
                  </Badge>
                  <p className="text-xs sm:text-sm font-medium">Fetch a specific article</p>
                </div>
                <CodeBlock code={`curl "${API_BASE}?resource=articles&id=42"`} language="bash" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    GET
                  </Badge>
                  <p className="text-xs sm:text-sm font-medium">Export as CSV</p>
                </div>
                <CodeBlock code={`curl "${API_BASE}?resource=definitions&format=csv"`} language="bash" />
              </div>
            </div>

            {/* Available Resources */}
            <div>
              <p className="text-sm font-medium mb-2">Available Resources</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {["articles", "recitals", "definitions", "chapters", "implementing-acts", "metadata"].map(
                  (resource) => (
                    <Badge key={resource} variant="secondary" className="font-mono text-xs">
                      {resource}
                    </Badge>
                  ),
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Format */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <FileJson className="h-4 w-4 sm:h-5 sm:w-5" />
              Response Format
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">
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
                2,
              )}
            />
          </CardContent>
        </Card>

        {/* Endpoints */}
        <h2 className="text-xl sm:text-2xl font-bold font-serif mb-3 sm:mb-4">Endpoints</h2>

        <Tabs defaultValue="articles" className="mb-6 sm:mb-8">
          <TabsList className="grid grid-cols-3 sm:grid-cols-6 h-auto gap-1 mb-3 sm:mb-4 w-full bg-muted/50 p-1">
            {endpoints.map((ep) => (
              <TabsTrigger
                key={ep.resource}
                value={ep.resource}
                className="text-xs px-1.5 py-1.5 sm:px-3 sm:py-2 data-[state=active]:bg-background"
              >
                {ep.resource}
              </TabsTrigger>
            ))}
          </TabsList>

          {endpoints.map((ep) => (
            <TabsContent key={ep.resource} value={ep.resource}>
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base sm:text-lg">{ep.resource}</CardTitle>
                      <Badge variant="outline">GET</Badge>
                    </div>
                    <TryItButton resource={ep.resource} />
                  </div>
                  <CardDescription className="text-sm">{ep.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0 sm:pt-0">
                  <div>
                    <p className="text-sm font-medium mb-2">Endpoint</p>
                    <CodeBlock code={`${API_BASE}?resource=${ep.resource}`} />
                  </div>

                  {ep.parameters.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Parameters</p>
                      {/* Mobile: Stack layout */}
                      <div className="block sm:hidden space-y-3">
                        {ep.parameters.map((param) => (
                          <div key={param.name} className="p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-primary text-sm">{param.name}</span>
                              <span className="text-xs text-muted-foreground">({param.type})</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{param.description}</p>
                          </div>
                        ))}
                      </div>
                      {/* Desktop: Table layout */}
                      <div className="hidden sm:block border rounded-lg overflow-hidden">
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
        <Card className="mb-6 sm:mb-8">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">FAIR Data Principles</CardTitle>
            <CardDescription className="text-sm">
              This API is designed following FAIR principles for research data
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="p-3 sm:p-4 rounded-lg bg-muted">
                <h4 className="font-semibold mb-1 text-sm sm:text-base">Findable</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Persistent URLs, unique identifiers, rich metadata
                </p>
              </div>
              <div className="p-3 sm:p-4 rounded-lg bg-muted">
                <h4 className="font-semibold mb-1 text-sm sm:text-base">Accessible</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Open HTTP API, no authentication required, multiple formats
                </p>
              </div>
              <div className="p-3 sm:p-4 rounded-lg bg-muted">
                <h4 className="font-semibold mb-1 text-sm sm:text-base">Interoperable</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Schema.org vocabulary, JSON/CSV formats, ELI identifiers
                </p>
              </div>
              <div className="p-3 sm:p-4 rounded-lg bg-muted">
                <h4 className="font-semibold mb-1 text-sm sm:text-base">Reusable</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  MIT license, clear provenance, version information
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal References */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Legal References</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 sm:p-6 pt-0 sm:pt-0">
            <a
              href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32025R0327"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline text-sm sm:text-base"
            >
              <ExternalLink className="h-4 w-4 flex-shrink-0" />
              EUR-Lex Official Publication
            </a>
            <a
              href="http://data.europa.eu/eli/reg/2025/327"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline text-sm sm:text-base"
            >
              <ExternalLink className="h-4 w-4 flex-shrink-0" />
              European Legislation Identifier (ELI)
            </a>
            <a
              href="https://github.com/stefanbuttigieg/ehdsexplorer"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline text-sm sm:text-base"
            >
              <ExternalLink className="h-4 w-4 flex-shrink-0" />
              Source Code on GitHub
            </a>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ApiDocsPage;
