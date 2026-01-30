// Citizen rights mapped to EHDS articles for the rights card component

export interface CitizenRight {
  id: string;
  title: string;
  description: string;
  articleNumbers: number[];
  icon: string;
  category: 'access' | 'control' | 'protection' | 'cross-border';
}

export const CITIZEN_RIGHTS: CitizenRight[] = [
  {
    id: 'access-data',
    title: 'Access your health data',
    description: 'View your electronic health records including diagnoses, prescriptions, test results, and medical imaging.',
    articleNumbers: [3, 7],
    icon: 'FileSearch',
    category: 'access',
  },
  {
    id: 'receive-data',
    title: 'Receive a copy of your data',
    description: 'Get your health data in electronic format, free of charge, in an accessible and machine-readable form.',
    articleNumbers: [3, 5],
    icon: 'Download',
    category: 'access',
  },
  {
    id: 'request-corrections',
    title: 'Request corrections',
    description: 'Ask healthcare providers to correct inaccurate personal health data in your records.',
    articleNumbers: [4],
    icon: 'PenLine',
    category: 'control',
  },
  {
    id: 'data-portability',
    title: 'Transfer your data',
    description: 'Move your health data to another healthcare provider of your choice within the EU.',
    articleNumbers: [5],
    icon: 'ArrowLeftRight',
    category: 'control',
  },
  {
    id: 'access-logs',
    title: 'Know who accessed your data',
    description: 'See a log of who has accessed your electronic health records and when.',
    articleNumbers: [12],
    icon: 'Eye',
    category: 'protection',
  },
  {
    id: 'restrict-access',
    title: 'Restrict access to your data',
    description: 'Limit which healthcare professionals can see certain parts of your health records.',
    articleNumbers: [9],
    icon: 'ShieldCheck',
    category: 'protection',
  },
  {
    id: 'opt-out-secondary',
    title: 'Opt out of secondary use',
    description: 'Withdraw consent for your health data to be used for research and policy-making purposes.',
    articleNumbers: [51],
    icon: 'UserX',
    category: 'protection',
  },
  {
    id: 'cross-border-access',
    title: 'Access care across borders',
    description: 'Have your health data available when receiving healthcare in another EU country via MyHealth@EU.',
    articleNumbers: [15, 16, 17],
    icon: 'Globe',
    category: 'cross-border',
  },
  {
    id: 'prescriptions-abroad',
    title: 'Use prescriptions abroad',
    description: 'Have your electronic prescriptions recognized and dispensed in other EU member states.',
    articleNumbers: [17],
    icon: 'Pill',
    category: 'cross-border',
  },
  {
    id: 'complaint-rights',
    title: 'File a complaint',
    description: 'Lodge complaints with your national digital health authority if your rights are violated.',
    articleNumbers: [19, 20],
    icon: 'MessageSquareWarning',
    category: 'protection',
  },
];

export const RIGHTS_CATEGORIES = {
  access: {
    label: 'Access Rights',
    description: 'Your rights to access and receive your health data',
    color: 'blue',
  },
  control: {
    label: 'Control Rights',
    description: 'Your rights to manage and correct your data',
    color: 'green',
  },
  protection: {
    label: 'Protection Rights',
    description: 'Your rights to protect and restrict your data',
    color: 'purple',
  },
  'cross-border': {
    label: 'Cross-Border Rights',
    description: 'Your rights when receiving care in other EU countries',
    color: 'orange',
  },
} as const;
