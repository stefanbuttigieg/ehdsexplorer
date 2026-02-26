import { ExternalLink, Linkedin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLinkedInPosts } from "@/hooks/useLinkedInPosts";
import { format, parseISO } from "date-fns";

interface LinkedInPostsSectionProps {
  implementingActId: string;
}

const LinkedInPostsSection = ({ implementingActId }: LinkedInPostsSectionProps) => {
  const { data: posts = [] } = useLinkedInPosts(implementingActId);

  if (posts.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Linkedin className="h-5 w-5 text-[#0A66C2]" />
          LinkedIn Updates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {posts.map((post) => (
          <a
            key={post.id}
            href={post.post_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <div className="p-3 rounded-lg bg-muted hover:bg-accent transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-medium line-clamp-2">{post.title}</span>
                  {post.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {post.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {post.author_name && (
                      <Badge variant="outline" className="text-xs">
                        {post.author_name}
                      </Badge>
                    )}
                    {post.posted_at && (
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(post.posted_at), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
              </div>
            </div>
          </a>
        ))}
      </CardContent>
    </Card>
  );
};

export default LinkedInPostsSection;
