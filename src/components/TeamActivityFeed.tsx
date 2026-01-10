import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTeamActivity, TeamActivity } from '@/hooks/useTeamActivity';
import { 
  UserPlus, 
  UserMinus, 
  Shield, 
  FileText, 
  MessageSquare, 
  Bookmark,
  LogIn,
  Activity
} from 'lucide-react';

interface TeamActivityFeedProps {
  teamId: string;
}

const getActivityIcon = (action: string) => {
  switch (action) {
    case 'invited_member':
      return <UserPlus className="h-4 w-4 text-green-500" />;
    case 'removed_member':
      return <UserMinus className="h-4 w-4 text-red-500" />;
    case 'member_joined':
      return <LogIn className="h-4 w-4 text-blue-500" />;
    case 'updated_role':
      return <Shield className="h-4 w-4 text-yellow-500" />;
    case 'shared_annotation':
      return <MessageSquare className="h-4 w-4 text-purple-500" />;
    case 'shared_note':
      return <FileText className="h-4 w-4 text-indigo-500" />;
    case 'shared_bookmark':
      return <Bookmark className="h-4 w-4 text-orange-500" />;
    default:
      return <Activity className="h-4 w-4 text-muted-foreground" />;
  }
};

const getActivityDescription = (activity: TeamActivity) => {
  const userName = activity.profile?.display_name || activity.profile?.email || 'Someone';
  const metadata = activity.metadata || {};

  switch (activity.action) {
    case 'invited_member':
      return (
        <>
          <span className="font-medium">{userName}</span> invited{' '}
          <span className="font-medium">{metadata.invited_email as string}</span> as {metadata.role as string}
        </>
      );
    case 'removed_member':
      return (
        <>
          <span className="font-medium">{userName}</span> removed a member from the team
        </>
      );
    case 'member_joined':
      return (
        <>
          <span className="font-medium">{userName}</span> joined the team as {metadata.role as string}
        </>
      );
    case 'updated_role':
      return (
        <>
          <span className="font-medium">{userName}</span> updated a member's role to{' '}
          <span className="font-medium">{metadata.new_role as string}</span>
        </>
      );
    case 'shared_annotation':
      return (
        <>
          <span className="font-medium">{userName}</span> shared an annotation
        </>
      );
    case 'shared_note':
      return (
        <>
          <span className="font-medium">{userName}</span> shared a note
        </>
      );
    case 'shared_bookmark':
      return (
        <>
          <span className="font-medium">{userName}</span> shared a bookmark
        </>
      );
    default:
      return (
        <>
          <span className="font-medium">{userName}</span> performed an action
        </>
      );
  }
};

export const TeamActivityFeed = ({ teamId }: TeamActivityFeedProps) => {
  const { activities, activitiesLoading } = useTeamActivity(teamId);

  if (activitiesLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No activity yet</h3>
        <p className="text-muted-foreground">
          Team activity will appear here as members collaborate
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
            <div className="flex-shrink-0 mt-1">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {(activity.profile?.display_name || activity.profile?.email || '?').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getActivityIcon(activity.action)}
                <p className="text-sm text-muted-foreground">
                  {getActivityDescription(activity)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default TeamActivityFeed;
