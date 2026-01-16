import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  AI_ROLES, 
  EXPLAIN_LEVELS, 
  type AIRole, 
  type ExplainLevel,
  getRoleById,
  getExplainLevelById
} from '@/data/aiRolePrompts';
import { 
  User, 
  Stethoscope, 
  Scale, 
  FlaskConical, 
  Code, 
  Landmark,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIRoleSelectorProps {
  selectedRole: AIRole;
  onRoleChange: (role: AIRole) => void;
  selectedLevel: ExplainLevel;
  onLevelChange: (level: ExplainLevel) => void;
  simplifyMode: boolean;
  onSimplifyModeChange: (enabled: boolean) => void;
  className?: string;
}

const roleIcons: Record<string, React.ReactNode> = {
  User: <User className="h-3.5 w-3.5" />,
  Stethoscope: <Stethoscope className="h-3.5 w-3.5" />,
  Scale: <Scale className="h-3.5 w-3.5" />,
  FlaskConical: <FlaskConical className="h-3.5 w-3.5" />,
  Code: <Code className="h-3.5 w-3.5" />,
  Landmark: <Landmark className="h-3.5 w-3.5" />,
};

const AIRoleSelector: React.FC<AIRoleSelectorProps> = ({
  selectedRole,
  onRoleChange,
  selectedLevel,
  onLevelChange,
  simplifyMode,
  onSimplifyModeChange,
  className,
}) => {
  const currentRole = getRoleById(selectedRole);
  const currentLevel = getExplainLevelById(selectedLevel);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Role Selector */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">I am a...</Label>
        <Select value={selectedRole} onValueChange={(v) => onRoleChange(v as AIRole)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue>
              <div className="flex items-center gap-2">
                {roleIcons[currentRole.icon]}
                <span>{currentRole.label}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {AI_ROLES.map((role) => (
              <SelectItem key={role.id} value={role.id} className="text-xs">
                <div className="flex items-center gap-2">
                  {roleIcons[role.icon]}
                  <div className="flex flex-col">
                    <span>{role.label}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {role.description}
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Explain Like I'm... Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
          <Label className="text-xs text-muted-foreground cursor-pointer" htmlFor="simplify-mode">
            Adjust complexity
          </Label>
        </div>
        <Switch
          id="simplify-mode"
          checked={simplifyMode}
          onCheckedChange={onSimplifyModeChange}
          className="scale-75"
        />
      </div>

      {/* Level Selector (shown when simplify mode is on) */}
      {simplifyMode && (
        <Select value={selectedLevel} onValueChange={(v) => onLevelChange(v as ExplainLevel)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue>
              <span>{currentLevel.label}</span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {EXPLAIN_LEVELS.map((level) => (
              <SelectItem key={level.id} value={level.id} className="text-xs">
                <div className="flex flex-col">
                  <span>{level.label}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {level.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default AIRoleSelector;
