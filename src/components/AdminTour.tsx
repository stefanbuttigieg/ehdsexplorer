import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useTour } from '@/hooks/useTour';

const adminTourSteps: Step[] = [
  {
    target: 'body',
    content: 'Welcome to the Admin Dashboard! This tour will show you how to manage the EHDS Regulation content.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="admin-content-sections"]',
    content: 'These cards give you quick access to all content types. Click any card to manage that content type.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="admin-articles"]',
    content: 'Manage all 105 articles here. You can edit content, link to recitals, and update metadata.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="admin-recitals"]',
    content: 'Manage all 115 recitals. Each recital can be linked to related articles for cross-referencing.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="admin-implementing-acts"]',
    content: 'Track and update implementing acts status, feedback periods, and link to official documents.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="admin-user-management"]',
    content: 'Admin-only: Invite new editors and admins via email. Manage user roles and access permissions.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="admin-maintenance"]',
    content: 'Enable maintenance mode when updating content. Visitors will see a maintenance page while you work.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tour="admin-quick-actions"]',
    content: 'Quick actions for common tasks: view the public site, bulk import data, or jump to frequently edited content.',
    placement: 'top',
    disableBeacon: true,
  },
];

interface AdminTourProps {
  run: boolean;
  onComplete: () => void;
  onClose: () => void;
}

export const AdminTour = ({ run, onComplete, onClose }: AdminTourProps) => {
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
      steps={adminTourSteps}
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

export const useAdminTour = () => useTour('admin');
