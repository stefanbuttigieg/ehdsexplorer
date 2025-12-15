import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useTour } from '@/hooks/useTour';

const tourSteps: Step[] = [
  {
    target: 'body',
    content: 'Welcome to the EHDS Regulation Explorer! Let me show you around so you can navigate the European Health Data Space Regulation with ease.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="sidebar-search"]',
    content: 'Use the search bar to quickly find articles, recitals, definitions, and more. You can also press "/" on your keyboard to open search.',
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="sidebar-nav"]',
    content: 'Navigate through different sections: Overview, Definitions, Articles, Recitals, Annexes, and track Implementing Acts progress.',
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="sidebar-chapters"]',
    content: 'Explore the regulation by chapters. Click on any chapter to see its articles and detailed content.',
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="quick-explorers"]',
    content: 'Use these quick explorer grids to jump directly to any article or recital by number. Hover over numbers to see previews.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tour="implementing-acts"]',
    content: 'Track the progress of implementing acts. See which ones are open for feedback and their deadlines.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tour="accessibility"]',
    content: 'Adjust font size and accessibility settings here to customize your reading experience.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="keyboard-shortcuts"]',
    content: 'Press "?" anytime to see all keyboard shortcuts for faster navigation.',
    placement: 'right',
    disableBeacon: true,
  },
];

interface PublicTourProps {
  run: boolean;
  onComplete: () => void;
  onClose: () => void;
}

export const PublicTour = ({ run, onComplete, onClose }: PublicTourProps) => {
  const handleCallback = (data: CallBackProps) => {
    const { status, action } = data;
    
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      onComplete();
    }
    
    if (action === 'close') {
      onClose();
    }
  };

  return (
    <Joyride
      steps={tourSteps}
      run={run}
      continuous
      showProgress
      showSkipButton
      hideCloseButton={false}
      scrollToFirstStep
      spotlightClicks
      callback={handleCallback}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          backgroundColor: 'hsl(var(--card))',
          textColor: 'hsl(var(--card-foreground))',
          arrowColor: 'hsl(var(--card))',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '8px',
          padding: '16px',
        },
        tooltipTitle: {
          fontSize: '16px',
          fontWeight: 600,
        },
        tooltipContent: {
          fontSize: '14px',
          lineHeight: 1.5,
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          borderRadius: '6px',
          padding: '8px 16px',
          fontSize: '14px',
        },
        buttonBack: {
          marginRight: '8px',
          color: 'hsl(var(--muted-foreground))',
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
        },
        spotlight: {
          borderRadius: '8px',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
};

export const usePublicTour = () => useTour('public');
