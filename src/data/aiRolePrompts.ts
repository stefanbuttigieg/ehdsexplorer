// AI Role definitions and their specific prompts

export type AIRole = 
  | 'general'
  | 'healthcare'
  | 'legal'
  | 'researcher'
  | 'developer'
  | 'policy';

export type ExplainLevel = 
  | 'expert'
  | 'professional'
  | 'student'
  | 'beginner';

export interface AIRoleConfig {
  id: AIRole;
  label: string;
  description: string;
  icon: string;
  promptAddition: string;
}

export interface ExplainLevelConfig {
  id: ExplainLevel;
  label: string;
  description: string;
  promptAddition: string;
}

export const AI_ROLES: AIRoleConfig[] = [
  {
    id: 'general',
    label: 'General User',
    description: 'Balanced explanations for all audiences',
    icon: 'User',
    promptAddition: `
USER ROLE: General User
Focus on providing balanced, accessible explanations that cover the key points without assuming specialized knowledge. Use everyday language while maintaining accuracy. Provide practical examples when helpful.`
  },
  {
    id: 'healthcare',
    label: 'Healthcare Professional',
    description: 'Clinical context, patient rights focus',
    icon: 'Stethoscope',
    promptAddition: `
USER ROLE: Healthcare Professional
Focus on clinical implications, patient rights under EHDS, and how the regulation affects healthcare delivery. Emphasize:
- Primary use of health data (Articles 3-14)
- Patient access rights and control mechanisms
- EHR system requirements and interoperability
- MyHealth@EU cross-border data exchange
- Data quality requirements for clinical use
- Obligations for healthcare providers and data holders
Use medical/clinical terminology where appropriate.`
  },
  {
    id: 'legal',
    label: 'Legal/Compliance Officer',
    description: 'Regulatory compliance, obligations, penalties',
    icon: 'Scale',
    promptAddition: `
USER ROLE: Legal/Compliance Officer
Focus on legal obligations, compliance requirements, and regulatory framework. Emphasize:
- Specific obligations for different actors (manufacturers, data holders, data users)
- Penalties and enforcement mechanisms
- Relationship with GDPR and other EU regulations
- Data governance and accountability requirements
- Contractual and procedural requirements
- Timeline for compliance and transitional provisions
- Legal basis for data processing under primary and secondary use
Cite specific articles and legal provisions precisely.`
  },
  {
    id: 'researcher',
    label: 'Researcher',
    description: 'Secondary use focus, data access procedures',
    icon: 'FlaskConical',
    promptAddition: `
USER ROLE: Researcher
Focus on secondary use of health data for research purposes. Emphasize:
- Chapter IV provisions on secondary use (Articles 33-50)
- Health data access body procedures and requirements
- Data permit application process
- Eligible purposes for secondary use (Article 34)
- Data minimization and secure processing environments
- Cross-border research collaboration through HealthData@EU
- Publication and result sharing requirements
- Fees and access timelines
Explain processes in practical, actionable terms.`
  },
  {
    id: 'developer',
    label: 'Health Tech Developer',
    description: 'Technical requirements, certification, APIs',
    icon: 'Code',
    promptAddition: `
USER ROLE: Health Tech Developer
Focus on technical implementation requirements. Emphasize:
- EHR system essential requirements (Article 6, Annex II)
- EU self-declaration and conformity assessment procedures
- Interoperability requirements and European EHR exchange format
- API and data exchange standards
- Certification and market surveillance
- Cybersecurity and logging requirements
- Wellness application voluntary labeling
- Integration with existing health IT infrastructure
Use technical terminology and reference specific technical annexes.`
  },
  {
    id: 'policy',
    label: 'Policy Maker',
    description: 'Governance, cross-border, implementation timeline',
    icon: 'Landmark',
    promptAddition: `
USER ROLE: Policy Maker
Focus on governance structures and implementation strategy. Emphasize:
- EHDS Board composition and responsibilities
- National digital health authority roles
- Cross-border cooperation mechanisms (MyHealth@EU, HealthData@EU)
- Implementation timeline and key milestones
- Member State obligations and flexibility
- Relationship with national health systems
- Funding and resource requirements
- Monitoring and evaluation frameworks
- Delegated and implementing acts timeline
Provide strategic, high-level perspective while connecting to specific provisions.`
  }
];

export const EXPLAIN_LEVELS: ExplainLevelConfig[] = [
  {
    id: 'expert',
    label: 'Expert',
    description: 'Technical legal language, minimal explanation',
    promptAddition: `
EXPLANATION LEVEL: Expert
Use precise legal and technical terminology without simplification. Assume deep familiarity with EU regulatory framework, health data governance, and legal concepts. Reference specific articles, recitals, and annexes with minimal context. Focus on nuances, exceptions, and edge cases.`
  },
  {
    id: 'professional',
    label: 'Professional',
    description: 'Clear professional language, moderate detail',
    promptAddition: `
EXPLANATION LEVEL: Professional
Use clear professional language with appropriate technical terms. Provide context for legal references. Balance detail with accessibility. Include practical implications alongside regulatory text. Assume working knowledge of the healthcare or legal sector.`
  },
  {
    id: 'student',
    label: 'Student',
    description: 'Educational tone, examples included',
    promptAddition: `
EXPLANATION LEVEL: Student
Use an educational tone that builds understanding step by step. Define technical and legal terms when first introduced. Include concrete examples to illustrate abstract concepts. Explain the "why" behind provisions, not just the "what". Connect concepts to real-world scenarios students might encounter.`
  },
  {
    id: 'beginner',
    label: 'Complete Beginner',
    description: 'Simple language, lots of examples',
    promptAddition: `
EXPLANATION LEVEL: Complete Beginner
Use simple, everyday language. Avoid jargon or define all terms clearly. Use analogies and relatable examples extensively. Break complex concepts into small, digestible pieces. Focus on the big picture before details. Use phrases like "In simple terms..." or "Think of it like...". Make no assumptions about prior knowledge of EU law or health data governance.`
  }
];

export const getRoleById = (id: AIRole): AIRoleConfig => {
  return AI_ROLES.find(r => r.id === id) || AI_ROLES[0];
};

export const getExplainLevelById = (id: ExplainLevel): ExplainLevelConfig => {
  return EXPLAIN_LEVELS.find(l => l.id === id) || EXPLAIN_LEVELS[1];
};

// Build additional context for system prompt
export const buildRoleContext = (role: AIRole, explainLevel: ExplainLevel): string => {
  const roleConfig = getRoleById(role);
  const levelConfig = getExplainLevelById(explainLevel);
  
  return `${roleConfig.promptAddition}
${levelConfig.promptAddition}`;
};
