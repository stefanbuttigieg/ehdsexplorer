import { useMemo } from "react";
import { useHeaderItems } from "@/hooks/useHeaderItems";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { StakeholderFilter } from "@/components/StakeholderFilter";
import { KidsModeToggle } from "@/components/KidsModeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { AccessibilityControls } from "@/components/AccessibilityControls";
import { UserMenu } from "@/components/UserMenu";

interface HeaderItemsRendererProps {
  /** Override device detection — useful when the same renderer is shown in different layout slots */
  forceDevice?: "mobile" | "desktop";
  className?: string;
}

const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  stakeholder_filter: (props) => <StakeholderFilter compact {...props} />,
  kids_mode: (props) => <KidsModeToggle compact {...props} />,
  language_selector: (props) => <LanguageSelector variant="compact" {...props} />,
  accessibility: AccessibilityControls,
  user_menu: UserMenu,
};

export function HeaderItemsRenderer({ forceDevice, className }: HeaderItemsRendererProps) {
  const { data: items } = useHeaderItems();
  const { user } = useAuth();
  const detectedMobile = useIsMobile();
  const isMobile = forceDevice ? forceDevice === "mobile" : detectedMobile;
  const isLoggedIn = !!user;

  const visibleItems = useMemo(() => {
    return [...(items || [])]
      .filter((i) => i.is_visible)
      .filter((i) => (isMobile ? i.show_on_mobile : i.show_on_desktop))
      .filter((i) => (isLoggedIn ? i.show_when_logged_in : i.show_when_logged_out))
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [items, isMobile, isLoggedIn]);

  return (
    <div className={className}>
      {visibleItems.map((item) => {
        const Component = COMPONENT_MAP[item.component_key];
        if (!Component) return null;
        return <Component key={item.id} />;
      })}
    </div>
  );
}
