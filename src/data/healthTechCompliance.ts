// Health Tech Compliance Checklist Data
// Organized by actor type and obligation category

export interface ComplianceItem {
  id: string;
  requirement: string;
  description: string;
  articleReferences: number[];
  evidenceHint: string;
  priority: 'critical' | 'high' | 'medium';
}

export interface ComplianceCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  items: ComplianceItem[];
}

export const EHR_SYSTEM_COMPLIANCE: ComplianceCategory = {
  id: 'ehr-systems',
  title: 'EHR System Manufacturers',
  description: 'Requirements for manufacturers of electronic health record systems placed on the EU market',
  icon: 'Server',
  items: [
    {
      id: 'ehr-1',
      requirement: 'Meet essential requirements',
      description: 'EHR systems must meet the essential requirements set out in Annex II before being placed on the market.',
      articleReferences: [6],
      evidenceHint: 'Technical documentation demonstrating compliance with Annex II requirements',
      priority: 'critical'
    },
    {
      id: 'ehr-2',
      requirement: 'EU declaration of conformity',
      description: 'Draw up an EU declaration of conformity confirming the EHR system meets essential requirements.',
      articleReferences: [26],
      evidenceHint: 'Signed EU declaration of conformity document',
      priority: 'critical'
    },
    {
      id: 'ehr-3',
      requirement: 'CE marking',
      description: 'Affix the CE marking to indicate conformity before placing on the market.',
      articleReferences: [27],
      evidenceHint: 'CE marking visible on product and documentation',
      priority: 'critical'
    },
    {
      id: 'ehr-4',
      requirement: 'Interoperability with European EHR exchange format',
      description: 'Ensure the system can exchange data using the European electronic health record exchange format.',
      articleReferences: [6, 14],
      evidenceHint: 'Interoperability test results, API documentation',
      priority: 'critical'
    },
    {
      id: 'ehr-5',
      requirement: 'Logging capabilities',
      description: 'Implement logging mechanisms to record access to electronic health data.',
      articleReferences: [6],
      evidenceHint: 'Audit log specifications and sample logs',
      priority: 'high'
    },
    {
      id: 'ehr-6',
      requirement: 'Technical documentation',
      description: 'Prepare and maintain technical documentation as specified in Annex III.',
      articleReferences: [24],
      evidenceHint: 'Complete technical file per Annex III requirements',
      priority: 'high'
    },
    {
      id: 'ehr-7',
      requirement: 'Authorised representative (if outside EU)',
      description: 'Manufacturers outside the EU must designate an authorised representative within the EU.',
      articleReferences: [21],
      evidenceHint: 'Authorised representative agreement and contact details',
      priority: 'high'
    },
    {
      id: 'ehr-8',
      requirement: 'Report non-compliance',
      description: 'Notify market surveillance authorities of any non-compliance discovered after placing on market.',
      articleReferences: [20],
      evidenceHint: 'Non-compliance reporting procedure, incident records',
      priority: 'medium'
    }
  ]
};

export const WELLNESS_APP_COMPLIANCE: ComplianceCategory = {
  id: 'wellness-apps',
  title: 'Wellness Application Manufacturers',
  description: 'Voluntary labeling scheme for wellness apps claiming interoperability with EHR systems',
  icon: 'Smartphone',
  items: [
    {
      id: 'wellness-1',
      requirement: 'Voluntary labeling (if claimed)',
      description: 'If claiming interoperability with EHR systems, apply for the EU label for wellness applications.',
      articleReferences: [31],
      evidenceHint: 'Application for wellness app label, interoperability evidence',
      priority: 'medium'
    },
    {
      id: 'wellness-2',
      requirement: 'Interoperability standards',
      description: 'Meet interoperability requirements with the European EHR exchange format if seeking the label.',
      articleReferences: [31, 14],
      evidenceHint: 'Technical specifications showing format compliance',
      priority: 'medium'
    },
    {
      id: 'wellness-3',
      requirement: 'Security and data protection',
      description: 'Ensure appropriate security measures and GDPR compliance for any health data processed.',
      articleReferences: [31],
      evidenceHint: 'GDPR compliance documentation, security assessment',
      priority: 'high'
    }
  ]
};

export const DATA_HOLDER_COMPLIANCE: ComplianceCategory = {
  id: 'data-holders',
  title: 'Health Data Holders',
  description: 'Obligations for entities holding electronic health data for secondary use purposes',
  icon: 'Database',
  items: [
    {
      id: 'dh-1',
      requirement: 'Make data available for secondary use',
      description: 'Make electronic health data available to health data access bodies upon request for permitted purposes.',
      articleReferences: [41],
      evidenceHint: 'Data inventory, data sharing agreements, technical infrastructure',
      priority: 'critical'
    },
    {
      id: 'dh-2',
      requirement: 'Data quality and documentation',
      description: 'Provide data quality and utility labels, including metadata describing the datasets.',
      articleReferences: [43],
      evidenceHint: 'Data quality framework, metadata catalog',
      priority: 'high'
    },
    {
      id: 'dh-3',
      requirement: 'Response timelines',
      description: 'Respond to data access body requests within the specified timeframes.',
      articleReferences: [41],
      evidenceHint: 'SLA documentation, response tracking system',
      priority: 'high'
    },
    {
      id: 'dh-4',
      requirement: 'Secure data transmission',
      description: 'Transmit data securely to the health data access body or secure processing environment.',
      articleReferences: [50],
      evidenceHint: 'Encryption standards, secure transfer protocols documentation',
      priority: 'critical'
    },
    {
      id: 'dh-5',
      requirement: 'Fee transparency',
      description: 'Fees charged must be transparent, proportionate, and non-discriminatory.',
      articleReferences: [42],
      evidenceHint: 'Published fee schedule, cost justification methodology',
      priority: 'medium'
    }
  ]
};

export const DATA_USER_COMPLIANCE: ComplianceCategory = {
  id: 'data-users',
  title: 'Health Data Users',
  description: 'Requirements for researchers and organizations accessing health data for secondary use',
  icon: 'FileSearch',
  items: [
    {
      id: 'du-1',
      requirement: 'Obtain data permit',
      description: 'Apply for and obtain a data permit from a health data access body before accessing data.',
      articleReferences: [46],
      evidenceHint: 'Data permit application, approval documentation',
      priority: 'critical'
    },
    {
      id: 'du-2',
      requirement: 'Use only for permitted purposes',
      description: 'Use data only for the purposes specified in the data permit (Article 34 purposes).',
      articleReferences: [34, 46],
      evidenceHint: 'Research protocol aligned with permit, usage audit logs',
      priority: 'critical'
    },
    {
      id: 'du-3',
      requirement: 'Process in secure environment',
      description: 'Process data only within the secure processing environment provided.',
      articleReferences: [50],
      evidenceHint: 'Access logs showing SPE-only processing',
      priority: 'critical'
    },
    {
      id: 'du-4',
      requirement: 'No re-identification attempts',
      description: 'Do not attempt to re-identify natural persons from anonymized or pseudonymized data.',
      articleReferences: [48],
      evidenceHint: 'Signed data use agreement, staff training records',
      priority: 'critical'
    },
    {
      id: 'du-5',
      requirement: 'Publish results',
      description: 'Make research results publicly available within specified timeframes.',
      articleReferences: [48],
      evidenceHint: 'Publication plan, published results with permit reference',
      priority: 'high'
    },
    {
      id: 'du-6',
      requirement: 'Report security incidents',
      description: 'Notify the health data access body of any security incidents or breaches.',
      articleReferences: [48],
      evidenceHint: 'Incident response procedure, notification records',
      priority: 'high'
    }
  ]
};

export const ALL_COMPLIANCE_CATEGORIES = [
  EHR_SYSTEM_COMPLIANCE,
  WELLNESS_APP_COMPLIANCE,
  DATA_HOLDER_COMPLIANCE,
  DATA_USER_COMPLIANCE
];

// Key articles grouped by theme for health tech
export interface ArticleGroup {
  title: string;
  description: string;
  articles: { number: number; title: string }[];
}

export const HEALTH_TECH_ARTICLE_GROUPS: ArticleGroup[] = [
  {
    title: 'EHR System Requirements',
    description: 'Core requirements for electronic health record systems',
    articles: [
      { number: 6, title: 'Essential requirements for EHR systems' },
      { number: 14, title: 'European electronic health record exchange format' },
      { number: 24, title: 'Technical documentation' },
      { number: 26, title: 'EU declaration of conformity' },
      { number: 27, title: 'CE marking' }
    ]
  },
  {
    title: 'Market Obligations',
    description: 'Requirements for placing EHR systems on the market',
    articles: [
      { number: 17, title: 'Obligations of manufacturers' },
      { number: 20, title: 'Corrective actions and notification duties' },
      { number: 21, title: 'Authorised representatives' },
      { number: 22, title: 'Obligations of importers' },
      { number: 23, title: 'Obligations of distributors' }
    ]
  },
  {
    title: 'Secondary Use Infrastructure',
    description: 'Requirements for health data sharing and access',
    articles: [
      { number: 36, title: 'Health data access bodies' },
      { number: 41, title: 'Obligations of data holders' },
      { number: 46, title: 'Data permit' },
      { number: 50, title: 'Secure processing environment' }
    ]
  },
  {
    title: 'Cross-Border & Interoperability',
    description: 'EU-wide data exchange requirements',
    articles: [
      { number: 12, title: 'Right to data portability' },
      { number: 13, title: 'MyHealth@EU infrastructure' },
      { number: 52, title: 'HealthData@EU infrastructure' },
      { number: 14, title: 'European EHR exchange format' }
    ]
  }
];
