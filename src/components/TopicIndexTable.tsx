import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, FileText, BookOpen } from 'lucide-react';
import { useTopicIndex, groupTopicsByCategory, type TopicIndexItem } from '@/hooks/useTopicIndex';
import { cn } from '@/lib/utils';

interface TopicIndexTableProps {
  stakeholderType: 'citizen' | 'healthtech' | 'healthcare_professional' | 'researcher' | 'policy_maker';
  title?: string;
  description?: string;
  showRecitals?: boolean;
  className?: string;
}

const TopicIndexTable: React.FC<TopicIndexTableProps> = ({
  stakeholderType,
  title = 'Topic Index',
  description = 'Quick reference mapping topics to relevant EHDS articles',
  showRecitals = false,
  className,
}) => {
  const { data: topics, isLoading, error } = useTopicIndex(stakeholderType);

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !topics?.length) {
    return null;
  }

  const groupedTopics = groupTopicsByCategory(topics);

  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {groupedTopics.map(({ category, items }) => (
        <Card key={category}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              {category}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%] min-w-[150px]">Topic</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead className="w-[20%] min-w-[100px]">Articles</TableHead>
                    {showRecitals && (
                      <TableHead className="w-[15%] min-w-[80px]">Recitals</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((topic) => (
                    <TopicRow 
                      key={topic.id} 
                      topic={topic} 
                      showRecitals={showRecitals}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

interface TopicRowProps {
  topic: TopicIndexItem;
  showRecitals?: boolean;
}

const TopicRow: React.FC<TopicRowProps> = ({ topic, showRecitals }) => {
  return (
    <TableRow>
      <TableCell className="font-medium">
        {topic.topic}
      </TableCell>
      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
        {topic.description}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {topic.article_numbers.map((num) => (
            <Link
              key={num}
              to={`/article/${num}`}
            >
              <Badge 
                variant="outline" 
                className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer text-xs"
              >
                Art. {num}
              </Badge>
            </Link>
          ))}
        </div>
      </TableCell>
      {showRecitals && topic.recital_numbers.length > 0 && (
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {topic.recital_numbers.slice(0, 3).map((num) => (
              <Link
                key={num}
                to={`/recital/${num}`}
              >
                <Badge 
                  variant="secondary" 
                  className="hover:bg-muted-foreground/20 transition-colors cursor-pointer text-xs"
                >
                  ({num})
                </Badge>
              </Link>
            ))}
            {topic.recital_numbers.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{topic.recital_numbers.length - 3}
              </span>
            )}
          </div>
        </TableCell>
      )}
    </TableRow>
  );
};

export default TopicIndexTable;
