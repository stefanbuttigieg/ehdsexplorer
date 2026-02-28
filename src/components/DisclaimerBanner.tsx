import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useDisclaimers } from '@/hooks/useDisclaimers';
import { cn } from '@/lib/utils';

const variantStyles: Record<string, { border: string; bg: string; icon: typeof AlertTriangle }> = {
  warning: { border: 'border-amber-500/30', bg: 'bg-amber-500/5', icon: AlertTriangle },
  info: { border: 'border-blue-500/30', bg: 'bg-blue-500/5', icon: Info },
  error: { border: 'border-red-500/30', bg: 'bg-red-500/5', icon: AlertCircle },
};

const iconColors: Record<string, string> = {
  warning: 'text-amber-500',
  info: 'text-blue-500',
  error: 'text-red-500',
};

interface DisclaimerBannerProps {
  placement: string;
  className?: string;
}

export function DisclaimerBanner({ placement, className }: DisclaimerBannerProps) {
  const { data: disclaimers } = useDisclaimers(placement);

  if (!disclaimers?.length) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {disclaimers.map(d => {
        const style = variantStyles[d.variant] || variantStyles.warning;
        const IconComponent = style.icon;
        const iconColor = iconColors[d.variant] || iconColors.warning;

        return (
          <div key={d.id} className={cn('flex items-start gap-3 rounded-lg border p-4', style.border, style.bg)}>
            <IconComponent className={cn('h-5 w-5 mt-0.5 shrink-0', iconColor)} />
            <div>
              <p className="text-sm font-medium">{d.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{d.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
