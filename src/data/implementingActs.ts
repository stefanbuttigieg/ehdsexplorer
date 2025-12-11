export type ActStatus = 'pending' | 'feedback' | 'progress' | 'adopted';

export type ActTheme = 
  | 'primary-use'
  | 'ehr-systems'
  | 'secondary-use'
  | 'health-data-access'
  | 'cross-border'
  | 'ehds-board';

export interface ImplementingAct {
  id: string;
  articleReference: string;
  title: string;
  description: string;
  type: 'implementing' | 'delegated';
  theme: ActTheme;
  status: ActStatus;
  feedbackDeadline?: string;
  adoptionDate?: string;
  officialLink?: string;
  deliverableLink?: string;
  deliverableName?: string;
  relatedArticles: number[];
}

export const implementingActs: ImplementingAct[] = [
  // Primary Use Acts
  {
    id: "art-4-4",
    articleReference: "Art. 4(4)",
    title: "Proxy Services Interoperability",
    description: "Technical specifications for the interoperability of proxy services among Member States, enabling cross-border authorization for health data access.",
    type: "implementing",
    theme: "primary-use",
    status: "pending",
    relatedArticles: [4],
  },
  {
    id: "art-14-1",
    articleReference: "Art. 14(1)",
    title: "Priority Categories Amendment",
    description: "Delegated act to amend the list of priority categories of personal electronic health data for primary use.",
    type: "delegated",
    theme: "primary-use",
    status: "pending",
    relatedArticles: [14],
  },
  {
    id: "art-15-1",
    articleReference: "Art. 15(1)",
    title: "European Electronic Health Record Exchange Format",
    description: "Technical specifications for the European electronic health record exchange format for each priority category.",
    type: "implementing",
    theme: "primary-use",
    status: "pending",
    relatedArticles: [15],
  },
  {
    id: "art-17",
    articleReference: "Art. 17",
    title: "Technical Implementation of Rights",
    description: "Requirements for the technical implementation of natural persons' rights regarding access and portability of health data.",
    type: "implementing",
    theme: "primary-use",
    status: "pending",
    relatedArticles: [17],
  },
  {
    id: "art-23-4",
    articleReference: "Art. 23(4)",
    title: "MyHealth@EU Technical Development",
    description: "Measures for the technical development of MyHealth@EU, including security, confidentiality, and compliance requirements.",
    type: "implementing",
    theme: "cross-border",
    status: "pending",
    relatedArticles: [23],
  },
  // EHR Systems Acts
  {
    id: "art-36-1",
    articleReference: "Art. 36(1)",
    title: "Common Specifications for EHR Systems",
    description: "Common specifications for essential requirements of EHR systems, including interoperability standards and data formats.",
    type: "implementing",
    theme: "ehr-systems",
    status: "pending",
    relatedArticles: [36],
  },
  {
    id: "art-42",
    articleReference: "Art. 42",
    title: "Additional Requirements for EHR Systems",
    description: "Additional requirements applicable to EHR systems to ensure safety, interoperability, and compliance.",
    type: "implementing",
    theme: "ehr-systems",
    status: "pending",
    relatedArticles: [42],
  },
  {
    id: "art-49",
    articleReference: "Art. 49",
    title: "EU Database for EHR Systems",
    description: "Specifications for the EU database for registration of EHR systems and wellness applications.",
    type: "implementing",
    theme: "ehr-systems",
    status: "pending",
    deliverableLink: "https://acceptance.data.health.europa.eu/ehr-systems",
    deliverableName: "EU Database of registered EHR systems and wellness applications",
    relatedArticles: [49],
  },
  {
    id: "art-51",
    articleReference: "Art. 51",
    title: "Wellness Applications Requirements",
    description: "Requirements for wellness applications regarding interoperability with EHR systems and data quality standards.",
    type: "implementing",
    theme: "ehr-systems",
    status: "pending",
    relatedArticles: [51],
  },
  // Secondary Use Acts
  {
    id: "art-52-3",
    articleReference: "Art. 52(3)",
    title: "Secondary Use Categories Amendment",
    description: "Delegated act to amend the list of minimum categories of electronic health data for secondary use.",
    type: "delegated",
    theme: "secondary-use",
    status: "pending",
    relatedArticles: [52],
  },
  {
    id: "art-55",
    articleReference: "Art. 55",
    title: "Data Minimisation Requirements",
    description: "Specifications for data minimisation and pseudonymisation requirements for secondary use.",
    type: "delegated",
    theme: "secondary-use",
    status: "pending",
    relatedArticles: [55],
  },
  {
    id: "art-63",
    articleReference: "Art. 63",
    title: "Dataset Descriptions",
    description: "Minimum elements for dataset descriptions to be included in dataset catalogues.",
    type: "delegated",
    theme: "secondary-use",
    status: "pending",
    relatedArticles: [63],
  },
  {
    id: "art-64",
    articleReference: "Art. 64",
    title: "Data Quality and Utility Labels",
    description: "Framework for data quality and utility labels to describe the quality and conditions of use of datasets.",
    type: "delegated",
    theme: "secondary-use",
    status: "pending",
    relatedArticles: [64],
  },
  {
    id: "art-70",
    articleReference: "Art. 70",
    title: "Fee Policies",
    description: "Implementing act on fee policies and structure for health data access bodies.",
    type: "implementing",
    theme: "health-data-access",
    status: "pending",
    relatedArticles: [70],
  },
  // Health Data Access Acts
  {
    id: "art-68",
    articleReference: "Art. 68",
    title: "Application Templates",
    description: "Templates for health data access applications and data requests.",
    type: "implementing",
    theme: "health-data-access",
    status: "pending",
    relatedArticles: [68],
  },
  {
    id: "art-69",
    articleReference: "Art. 69",
    title: "Data Permit Templates",
    description: "Harmonised templates for data permits issued by health data access bodies.",
    type: "implementing",
    theme: "health-data-access",
    status: "pending",
    relatedArticles: [69],
  },
  {
    id: "art-72",
    articleReference: "Art. 72",
    title: "Secure Processing Environments",
    description: "Requirements for secure processing environments used for secondary use of health data.",
    type: "delegated",
    theme: "health-data-access",
    status: "pending",
    relatedArticles: [72],
  },
  {
    id: "art-73",
    articleReference: "Art. 73",
    title: "Trusted Health Data Holders",
    description: "Criteria and procedures for designation of trusted health data holders.",
    type: "implementing",
    theme: "health-data-access",
    status: "pending",
    relatedArticles: [73],
  },
  // Cross-Border Infrastructure Acts
  {
    id: "art-23-8",
    articleReference: "Art. 23(8)",
    title: "MyHealth@EU Cybersecurity Requirements",
    description: "Rules on cybersecurity, technical interoperability, and operations management for MyHealth@EU.",
    type: "implementing",
    theme: "cross-border",
    status: "pending",
    relatedArticles: [23],
  },
  {
    id: "art-24-1",
    articleReference: "Art. 24(1)",
    title: "Supplementary Cross-Border Services",
    description: "Technical aspects of supplementary services provided through MyHealth@EU.",
    type: "implementing",
    theme: "cross-border",
    status: "pending",
    relatedArticles: [24],
  },
  {
    id: "art-81-3",
    articleReference: "Art. 81(3)",
    title: "HealthData@EU Development",
    description: "Measures for the establishment, development, and deployment of HealthData@EU.",
    type: "implementing",
    theme: "cross-border",
    status: "pending",
    deliverableLink: "https://acceptance.data.health.europa.eu/healthdata-central-platform",
    deliverableName: "HealthData@EU Central Platform",
    relatedArticles: [81],
  },
  {
    id: "art-76",
    articleReference: "Art. 76",
    title: "Dataset Interoperability",
    description: "Standards and specifications for dataset interoperability for secondary use.",
    type: "delegated",
    theme: "cross-border",
    status: "pending",
    relatedArticles: [76],
  },
  {
    id: "art-77",
    articleReference: "Art. 77",
    title: "Cross-Border Data Access Requirements",
    description: "Requirements for cross-border data access through HealthData@EU.",
    type: "delegated",
    theme: "cross-border",
    status: "pending",
    relatedArticles: [77],
  },
  // EHDS Board & Governance Acts
  {
    id: "art-92-1",
    articleReference: "Art. 92(1)",
    title: "EHDS Board Composition and Functioning",
    description: "Rules on the composition, organisation, and functioning of the European Health Data Space Board.",
    type: "implementing",
    theme: "ehds-board",
    status: "feedback",
    feedbackDeadline: "09 December 2025 - 06 January 2026",
    officialLink: "https://ec.europa.eu/info/law/better-regulation/have-your-say/initiatives/14992-European-Health-Data-Space-Board-operations_en",
    relatedArticles: [92],
  },
  {
    id: "art-93",
    articleReference: "Art. 93",
    title: "EHDS Board Subgroups",
    description: "Rules on the establishment and functioning of EHDS Board subgroups.",
    type: "implementing",
    theme: "ehds-board",
    status: "pending",
    relatedArticles: [93],
  },
  {
    id: "art-94",
    articleReference: "Art. 94",
    title: "Coordination Mechanisms",
    description: "Coordination mechanisms between digital health authorities and health data access bodies.",
    type: "implementing",
    theme: "ehds-board",
    status: "pending",
    relatedArticles: [94],
  },
  {
    id: "art-25-2",
    articleReference: "Art. 25(2)",
    title: "Third Country Access to MyHealth@EU",
    description: "Decisions on connecting third country contact points to MyHealth@EU.",
    type: "implementing",
    theme: "cross-border",
    status: "pending",
    relatedArticles: [25],
  },
];

export const themeLabels: Record<ActTheme, string> = {
  'primary-use': 'Primary Use of Health Data',
  'ehr-systems': 'EHR Systems & Certification',
  'secondary-use': 'Secondary Use Framework',
  'health-data-access': 'Health Data Access Bodies',
  'cross-border': 'Cross-Border Infrastructure',
  'ehds-board': 'EHDS Board & Governance',
};

export const statusLabels: Record<ActStatus, string> = {
  pending: 'Pending',
  feedback: 'Open for Feedback',
  progress: 'In Progress',
  adopted: 'Adopted',
};

export function getActById(id: string): ImplementingAct | undefined {
  return implementingActs.find((a) => a.id === id);
}

export function getActsByTheme(theme: ActTheme): ImplementingAct[] {
  return implementingActs.filter((a) => a.theme === theme);
}

export function getActsByStatus(status: ActStatus): ImplementingAct[] {
  return implementingActs.filter((a) => a.status === status);
}

export function getActsByArticle(articleId: number): ImplementingAct[] {
  return implementingActs.filter((a) => a.relatedArticles.includes(articleId));
}

export function getActStats(): Record<ActStatus, number> {
  return implementingActs.reduce((acc, act) => {
    acc[act.status] = (acc[act.status] || 0) + 1;
    return acc;
  }, {} as Record<ActStatus, number>);
}
