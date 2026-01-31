// Healthcare Professionals Workflow Data
// Organized by clinical scenario and workflow type

export interface WorkflowStep {
  step: number;
  action: string;
  ehdsReference: string;
  articleNumbers: number[];
}

export interface ClinicalWorkflow {
  id: string;
  title: string;
  description: string;
  icon: string;
  scenario: string;
  steps: WorkflowStep[];
  keyTakeaway: string;
}

export const CLINICAL_WORKFLOWS: ClinicalWorkflow[] = [
  {
    id: 'patient-data-access',
    title: 'Patient Requests Their Health Data',
    description: 'When a patient asks to view or receive a copy of their electronic health records',
    icon: 'FileText',
    scenario: 'A patient visits your practice and requests access to their complete health records, including lab results, imaging reports, and consultation notes.',
    steps: [
      {
        step: 1,
        action: 'Verify patient identity using established identification procedures',
        ehdsReference: 'Right to access personal electronic health data',
        articleNumbers: [3]
      },
      {
        step: 2,
        action: 'Provide access free of charge through patient portal or EHR system',
        ehdsReference: 'Access must be provided free of charge',
        articleNumbers: [3]
      },
      {
        step: 3,
        action: 'Ensure data is provided in the European EHR exchange format if requested',
        ehdsReference: 'Interoperable format requirement',
        articleNumbers: [3, 14]
      },
      {
        step: 4,
        action: 'Include all priority categories: patient summaries, prescriptions, lab results, imaging, discharge reports',
        ehdsReference: 'Priority categories of personal electronic health data',
        articleNumbers: [5]
      }
    ],
    keyTakeaway: 'Patients have the right to access their health data free of charge, immediately through electronic means, in an interoperable format.'
  },
  {
    id: 'cross-border-care',
    title: 'Treating a Patient from Another EU Country',
    description: 'Accessing health data for a patient who is normally treated in another Member State',
    icon: 'Globe',
    scenario: 'A German tourist is injured while visiting and needs treatment. You need access to their medical history, allergies, and current medications.',
    steps: [
      {
        step: 1,
        action: 'Request patient consent for cross-border data access via MyHealth@EU',
        ehdsReference: 'Cross-border data exchange infrastructure',
        articleNumbers: [13]
      },
      {
        step: 2,
        action: 'Access patient summary through the national contact point connected to MyHealth@EU',
        ehdsReference: 'MyHealth@EU for cross-border primary use',
        articleNumbers: [13]
      },
      {
        step: 3,
        action: 'Review allergies, current medications, and relevant medical history',
        ehdsReference: 'Patient summary as priority data category',
        articleNumbers: [5]
      },
      {
        step: 4,
        action: 'Document the treatment and ensure it can be transmitted back to their home country',
        ehdsReference: 'Cross-border data sharing',
        articleNumbers: [13, 12]
      }
    ],
    keyTakeaway: 'MyHealth@EU enables real-time access to patient summaries across EU borders, improving care continuity for traveling patients.'
  },
  {
    id: 'data-portability',
    title: 'Patient Transfers to Another Provider',
    description: 'Facilitating data transfer when a patient moves to a new healthcare provider',
    icon: 'ArrowRightLeft',
    scenario: 'A patient is moving to another city and needs their complete medical records transferred to their new GP or specialist.',
    steps: [
      {
        step: 1,
        action: 'Receive and verify patient request for data portability',
        ehdsReference: 'Right to health data portability',
        articleNumbers: [12]
      },
      {
        step: 2,
        action: 'Compile all relevant health data in the European EHR exchange format',
        ehdsReference: 'Interoperable format for portability',
        articleNumbers: [12, 14]
      },
      {
        step: 3,
        action: 'Transmit data securely to the new provider as specified by the patient',
        ehdsReference: 'Transmission to designated recipient',
        articleNumbers: [12]
      },
      {
        step: 4,
        action: 'Complete transfer within 1 month (or 3 months for complex requests)',
        ehdsReference: 'Timeline for portability requests',
        articleNumbers: [12]
      }
    ],
    keyTakeaway: 'Healthcare providers must support data portability in the EU standard format, enabling seamless transitions between providers.'
  },
  {
    id: 'access-logging',
    title: 'Maintaining Access Logs',
    description: 'Recording and managing logs of who accessed patient health data',
    icon: 'ClipboardList',
    scenario: 'Your organization needs to maintain audit trails of all access to electronic health records as required by EHDS.',
    steps: [
      {
        step: 1,
        action: 'Ensure EHR system automatically logs all data access events',
        ehdsReference: 'Logging mechanism requirements for EHR systems',
        articleNumbers: [6]
      },
      {
        step: 2,
        action: 'Include user identity, timestamp, and data categories accessed in logs',
        ehdsReference: 'Essential requirements for EHR systems',
        articleNumbers: [6]
      },
      {
        step: 3,
        action: 'Make access logs available to patients upon request',
        ehdsReference: 'Right to information about data access',
        articleNumbers: [8]
      },
      {
        step: 4,
        action: 'Retain logs for the legally required period and protect from tampering',
        ehdsReference: 'Audit trail integrity',
        articleNumbers: [6]
      }
    ],
    keyTakeaway: 'Comprehensive access logging is mandatory for EHR systems, and patients can request to see who has accessed their data.'
  },
  {
    id: 'patient-restrictions',
    title: 'Patient Restricts Data Sharing',
    description: 'Handling a patient request to limit who can access their health data',
    icon: 'ShieldOff',
    scenario: 'A patient requests that certain sensitive information (e.g., mental health records) not be shared with specific healthcare providers or for secondary use.',
    steps: [
      {
        step: 1,
        action: 'Receive and document patient restriction request',
        ehdsReference: 'Right to restriction on access',
        articleNumbers: [9]
      },
      {
        step: 2,
        action: 'Configure EHR system to apply the restriction as specified',
        ehdsReference: 'Implementation of access restrictions',
        articleNumbers: [9]
      },
      {
        step: 3,
        action: 'Inform patient of potential impact on care (but respect their decision)',
        ehdsReference: 'Patient autonomy in access control',
        articleNumbers: [9]
      },
      {
        step: 4,
        action: 'Note that emergency access may override restrictions in life-threatening situations',
        ehdsReference: 'Emergency access provisions',
        articleNumbers: [9]
      }
    ],
    keyTakeaway: 'Patients can restrict access to their health data, but emergency situations may allow override. Always document restrictions clearly.'
  },
  {
    id: 'secondary-use-optout',
    title: 'Patient Opts Out of Secondary Use',
    description: 'Processing a patient opt-out from research and policy use of their data',
    icon: 'UserX',
    scenario: 'A patient informs you they do not want their health data used for research, public health monitoring, or policy-making purposes.',
    steps: [
      {
        step: 1,
        action: 'Explain the opt-out right for secondary use and its scope',
        ehdsReference: 'Right to opt-out of secondary use',
        articleNumbers: [51]
      },
      {
        step: 2,
        action: 'Record the opt-out in your system according to national procedures',
        ehdsReference: 'Member State opt-out mechanisms',
        articleNumbers: [51]
      },
      {
        step: 3,
        action: 'Ensure opt-out applies to future secondary use data requests',
        ehdsReference: 'Application of opt-out',
        articleNumbers: [51]
      },
      {
        step: 4,
        action: 'Note that some public health uses may be exempt from opt-out (national law dependent)',
        ehdsReference: 'Limitations on opt-out right',
        articleNumbers: [51]
      }
    ],
    keyTakeaway: 'Patients can opt out of secondary use of their data for research and policy purposes. Member States implement specific opt-out mechanisms.'
  }
];

// Key rights that healthcare professionals should know
export interface PatientRight {
  right: string;
  description: string;
  articleNumber: number;
  practicalImplication: string;
}

export const KEY_PATIENT_RIGHTS: PatientRight[] = [
  {
    right: 'Access to health data',
    description: 'Patients can access all their electronic health data free of charge',
    articleNumber: 3,
    practicalImplication: 'Provide immediate electronic access through patient portals'
  },
  {
    right: 'Data rectification',
    description: 'Patients can request corrections to inaccurate health data',
    articleNumber: 4,
    practicalImplication: 'Have a process for reviewing and correcting data upon request'
  },
  {
    right: 'Data portability',
    description: 'Patients can have their data transferred to another provider',
    articleNumber: 12,
    practicalImplication: 'Export data in the European EHR exchange format'
  },
  {
    right: 'Access logging visibility',
    description: 'Patients can see who has accessed their health records',
    articleNumber: 8,
    practicalImplication: 'Make access logs viewable through patient portal'
  },
  {
    right: 'Restrict access',
    description: 'Patients can limit which providers see their data',
    articleNumber: 9,
    practicalImplication: 'Configure access controls per patient preferences'
  },
  {
    right: 'Opt-out of secondary use',
    description: 'Patients can refuse use of their data for research/policy',
    articleNumber: 51,
    practicalImplication: 'Know your national opt-out mechanism and inform patients'
  }
];

// Quick reference for healthcare professionals
export interface QuickReference {
  topic: string;
  description: string;
  articles: number[];
}

export const QUICK_REFERENCES: QuickReference[] = [
  {
    topic: 'Priority Health Data Categories',
    description: 'Patient summaries, ePrescriptions, lab results, medical images, discharge reports, rare disease records',
    articles: [5]
  },
  {
    topic: 'European EHR Exchange Format',
    description: 'Standard format for cross-border and cross-provider data exchange',
    articles: [14]
  },
  {
    topic: 'MyHealth@EU',
    description: 'Infrastructure for cross-border primary use of health data',
    articles: [13]
  },
  {
    topic: 'Digital Health Authority',
    description: 'National body overseeing EHDS implementation and handling complaints',
    articles: [15]
  },
  {
    topic: 'Healthcare Provider Obligations',
    description: 'Register health data electronically, use certified EHR systems, respect patient rights',
    articles: [6, 7]
  }
];
