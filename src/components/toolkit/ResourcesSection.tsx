import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  FileText,
  CheckSquare,
  BookOpen,
  Shield,
  Search,
  Briefcase,
  ClipboardList,
} from "lucide-react";
import { useDownloadableResources, type DownloadableResource } from "@/hooks/useDownloadableResources";

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  checklist: { icon: <CheckSquare className="h-4 w-4" />, label: "Checklist" },
  template: { icon: <FileText className="h-4 w-4" />, label: "Template" },
  guide: { icon: <BookOpen className="h-4 w-4" />, label: "Guide" },
  framework: { icon: <Shield className="h-4 w-4" />, label: "Framework" },
  workbook: { icon: <ClipboardList className="h-4 w-4" />, label: "Workbook" },
  brief: { icon: <Briefcase className="h-4 w-4" />, label: "Brief" },
};

const TAG_FILTERS = [
  { value: "", label: "All" },
  { value: "compliance", label: "Compliance" },
  { value: "governance", label: "Governance" },
  { value: "technical", label: "Technical" },
  { value: "privacy", label: "Privacy" },
  { value: "cross-border", label: "Cross-Border" },
  { value: "startup", label: "Startups" },
];

export function ResourcesSection() {
  const { data: resources = [], isLoading } = useDownloadableResources();
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");

  const filtered = resources.filter((r) => {
    const matchesSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !activeTag || r.tags?.includes(activeTag);
    return matchesSearch && matchesTag;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search & filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tag pills */}
      <div className="flex flex-wrap gap-1.5">
        {TAG_FILTERS.map((t) => (
          <Badge
            key={t.value}
            variant={activeTag === t.value ? "default" : "secondary"}
            className="cursor-pointer text-xs"
            onClick={() => setActiveTag(t.value)}
          >
            {t.label}
          </Badge>
        ))}
      </div>

      {/* Resource cards */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No resources match your filter. Try a different search or tag.
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResourceCard({ resource }: { resource: DownloadableResource }) {
  const typeInfo = TYPE_CONFIG[resource.resource_type] ?? {
    icon: <FileText className="h-4 w-4" />,
    label: resource.resource_type,
  };

  return (
    <Card className="hover:border-primary/40 transition-colors group">
      <CardContent className="py-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:bg-primary/20 transition-colors">
            {typeInfo.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm truncate">{resource.title}</h4>
              {resource.requires_email && (
                <Badge variant="outline" className="text-[10px] shrink-0">Email</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {resource.description}
            </p>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs gap-1">
                {typeInfo.icon}
                {typeInfo.label}
              </Badge>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" asChild>
                <a href={resource.file_url} target="_blank" rel="noopener noreferrer" download>
                  <Download className="h-3 w-3" />
                  Download
                </a>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
