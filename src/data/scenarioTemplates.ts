// Predefined scenarios for the Scenario Finder
export interface ScenarioTemplate {
  id: string;
  title: string;
  category: 'citizen' | 'healthtech' | 'healthcare' | 'research' | 'general';
  description: string;
  promptText: string;
  icon: string;
}

export const SCENARIO_CATEGORIES = [
  { id: 'citizen', label: 'Citizens & Patients', icon: 'Heart' },
  { id: 'healthtech', label: 'Health Tech Companies', icon: 'Laptop' },
  { id: 'healthcare', label: 'Healthcare Providers', icon: 'Stethoscope' },
  { id: 'research', label: 'Researchers', icon: 'FlaskConical' },
  { id: 'general', label: 'General Questions', icon: 'HelpCircle' },
] as const;

export const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
  // Citizen scenarios
  {
    id: 'citizen-access-records',
    title: 'Accessing my health records',
    category: 'citizen',
    description: 'I want to view my electronic health records from my healthcare provider',
    promptText: 'I am a patient and I want to access my electronic health records. What are my rights under the EHDS? How can I request access, what format will I receive my data in, and how long should my healthcare provider take to respond?',
    icon: 'FileText',
  },
  {
    id: 'citizen-cross-border',
    title: 'Healthcare while traveling in EU',
    category: 'citizen',
    description: 'I need medical care while visiting another EU country',
    promptText: 'I am traveling to another EU country and need medical treatment. How does the EHDS help me access healthcare abroad? Can doctors there see my health records from my home country? What should I know about cross-border health data sharing?',
    icon: 'Plane',
  },
  {
    id: 'citizen-data-correction',
    title: 'Correcting errors in my health data',
    category: 'citizen',
    description: 'I found incorrect information in my medical records',
    promptText: 'I discovered errors in my electronic health records. What are my rights to request corrections under the EHDS? How do I submit a correction request and what happens if my healthcare provider refuses?',
    icon: 'Pencil',
  },
  {
    id: 'citizen-opt-out',
    title: 'Opting out of secondary data use',
    category: 'citizen',
    description: 'I want to prevent my health data being used for research',
    promptText: 'I do not want my health data to be used for research purposes or secondary use. What are my opt-out rights under the EHDS? How do I exercise this right, and are there any exceptions where my data might still be used?',
    icon: 'ShieldOff',
  },
  {
    id: 'citizen-data-portability',
    title: 'Switching healthcare providers',
    category: 'citizen',
    description: 'I want to transfer my health data to a new provider',
    promptText: 'I am changing to a new healthcare provider and want to transfer all my health data. What are my data portability rights under the EHDS? How do I initiate the transfer, and what data should be included?',
    icon: 'ArrowRightLeft',
  },
  
  // Health Tech scenarios
  {
    id: 'healthtech-ehr-certification',
    title: 'EHR system certification requirements',
    category: 'healthtech',
    description: 'Our company develops EHR software and needs to understand certification',
    promptText: 'Our company develops Electronic Health Record (EHR) software for the EU market. What are the certification and compliance requirements under the EHDS? What standards must our system meet, what is the certification process, and what are the timelines for compliance?',
    icon: 'Award',
  },
  {
    id: 'healthtech-wellness-app',
    title: 'Wellness app data obligations',
    category: 'healthtech',
    description: 'We have a fitness/wellness app that collects health data',
    promptText: 'We operate a wellness/fitness app that collects health-related data from users. What obligations do we have under the EHDS? Are we considered a data holder? What happens if users want to export their data to their EHR?',
    icon: 'Smartphone',
  },
  {
    id: 'healthtech-interoperability',
    title: 'Interoperability requirements',
    category: 'healthtech',
    description: 'Understanding data format and exchange requirements',
    promptText: 'What are the interoperability requirements for health data systems under the EHDS? What data formats must we support (like European EHR Exchange Format)? How do we ensure our system can exchange data with other EU health systems?',
    icon: 'Network',
  },
  {
    id: 'healthtech-labeling',
    title: 'EU labeling for health software',
    category: 'healthtech',
    description: 'What labels and declarations are required for our product',
    promptText: 'What labeling and declaration requirements apply to health software products under the EHDS? What information must be included in the EU declaration of conformity? What labels must be displayed on our product or documentation?',
    icon: 'Tag',
  },
  
  // Healthcare provider scenarios
  {
    id: 'healthcare-patient-request',
    title: 'Handling patient data requests',
    category: 'healthcare',
    description: 'A patient wants a copy of all their health data',
    promptText: 'A patient has requested a complete copy of their electronic health data. What are our obligations as a healthcare provider under the EHDS? What data must we provide, in what format, within what timeframe, and can we charge a fee?',
    icon: 'ClipboardList',
  },
  {
    id: 'healthcare-cross-border-treatment',
    title: 'Treating patients from other EU countries',
    category: 'healthcare',
    description: 'Accessing health records of foreign EU patients',
    promptText: 'We are treating a patient visiting from another EU country. How can we access their health records under the EHDS and MyHealth@EU? What systems do we need to connect to, and what are our obligations for recording the treatment?',
    icon: 'Globe',
  },
  {
    id: 'healthcare-proxy-access',
    title: 'Managing proxy access rights',
    category: 'healthcare',
    description: 'Handling data access for minors or incapacitated patients',
    promptText: 'How should we handle proxy access to health data under the EHDS? When a parent requests access to their child\'s records, or a carer requests access for an incapacitated adult, what are the rules and verification requirements?',
    icon: 'Users',
  },
  
  // Research scenarios
  {
    id: 'research-secondary-data',
    title: 'Accessing health data for research',
    category: 'research',
    description: 'How to request access to health data for scientific research',
    promptText: 'I am a researcher wanting to access health data for a scientific study. What is the process for requesting secondary use of health data under the EHDS? What are health data access bodies, how do I apply for a data permit, and what conditions must I meet?',
    icon: 'Search',
  },
  {
    id: 'research-data-permit',
    title: 'Data permit requirements',
    category: 'research',
    description: 'Understanding the data permit application process',
    promptText: 'What information must be included in a data permit application under the EHDS? What are the permitted purposes for secondary use, what security measures are required, and how long does the approval process typically take?',
    icon: 'FileCheck',
  },
  {
    id: 'research-secure-environment',
    title: 'Secure processing environments',
    category: 'research',
    description: 'Requirements for processing health data securely',
    promptText: 'What are the requirements for secure processing environments under the EHDS? Where can I process health data obtained through a data permit? What technical and organizational measures must be in place?',
    icon: 'Lock',
  },
  
  // General scenarios
  {
    id: 'general-ehds-overview',
    title: 'What is the EHDS?',
    category: 'general',
    description: 'Get a high-level overview of the European Health Data Space',
    promptText: 'What is the European Health Data Space (EHDS) and why was it created? What are the main goals and how will it affect healthcare across the EU? When does it come into effect?',
    icon: 'Info',
  },
  {
    id: 'general-primary-secondary',
    title: 'Primary vs secondary use of data',
    category: 'general',
    description: 'Understanding the difference between data use types',
    promptText: 'What is the difference between primary use and secondary use of health data under the EHDS? Who can access data for each purpose and what are the different rules and safeguards?',
    icon: 'Split',
  },
  {
    id: 'general-enforcement',
    title: 'Enforcement and penalties',
    category: 'general',
    description: 'What happens if EHDS rules are not followed',
    promptText: 'What are the enforcement mechanisms and penalties under the EHDS? Who enforces compliance, what are the potential fines for violations, and how can individuals lodge complaints?',
    icon: 'Scale',
  },
];

export const getScenariosByCategory = (category: ScenarioTemplate['category']) => 
  SCENARIO_TEMPLATES.filter(s => s.category === category);

export const getScenarioById = (id: string) => 
  SCENARIO_TEMPLATES.find(s => s.id === id);
