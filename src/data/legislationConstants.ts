import { 
  FileEdit, 
  Calendar, 
  Search, 
  CheckCircle, 
  BookOpen, 
  Gavel, 
  Archive,
  FileText,
  Shield,
  Handshake,
  Euro,
  AlertTriangle,
  Ban,
  ClipboardList,
  ClipboardCheck,
  Award,
  FileBarChart,
  LucideIcon
} from 'lucide-react';

export type LegislationStatus = 'draft' | 'tabled' | 'under_review' | 'adopted' | 'published' | 'in_force' | 'superseded';
export type LegislationType = 'transposition' | 'related' | 'amendment' | 'preparatory';
export type EnforcementMeasure = 
  | 'guidelines' 
  | 'standards' 
  | 'codes_of_conduct' 
  | 'administrative_fines' 
  | 'criminal_penalties' 
  | 'license_suspension' 
  | 'corrective_orders' 
  | 'audits' 
  | 'certification' 
  | 'reporting_obligations';

interface StatusConfig {
  label: string;
  color: string;
  icon: LucideIcon;
  order: number;
}

interface EnforcementConfig {
  label: string;
  icon: LucideIcon;
  severity: 'low' | 'medium' | 'high';
}

interface TypeConfig {
  label: string;
  color: string;
}

export const LEGISLATION_STATUSES: Record<LegislationStatus, StatusConfig> = {
  draft: { label: 'Draft', color: 'gray', icon: FileEdit, order: 1 },
  tabled: { label: 'Tabled for Discussion', color: 'yellow', icon: Calendar, order: 2 },
  under_review: { label: 'Under Review', color: 'orange', icon: Search, order: 3 },
  adopted: { label: 'Adopted', color: 'blue', icon: CheckCircle, order: 4 },
  published: { label: 'Published', color: 'purple', icon: BookOpen, order: 5 },
  in_force: { label: 'In Force', color: 'green', icon: Gavel, order: 6 },
  superseded: { label: 'Superseded', color: 'red', icon: Archive, order: 7 }
};

export const ENFORCEMENT_MEASURES: Record<EnforcementMeasure, EnforcementConfig> = {
  guidelines: { label: 'Guidelines', icon: FileText, severity: 'low' },
  standards: { label: 'Technical Standards', icon: Shield, severity: 'low' },
  codes_of_conduct: { label: 'Codes of Conduct', icon: Handshake, severity: 'low' },
  administrative_fines: { label: 'Administrative Fines', icon: Euro, severity: 'high' },
  criminal_penalties: { label: 'Criminal Penalties', icon: AlertTriangle, severity: 'high' },
  license_suspension: { label: 'License Suspension', icon: Ban, severity: 'high' },
  corrective_orders: { label: 'Corrective Orders', icon: ClipboardList, severity: 'medium' },
  audits: { label: 'Compliance Audits', icon: ClipboardCheck, severity: 'medium' },
  certification: { label: 'Certification Required', icon: Award, severity: 'medium' },
  reporting_obligations: { label: 'Reporting Obligations', icon: FileBarChart, severity: 'medium' }
};

export const LEGISLATION_TYPES: Record<LegislationType, TypeConfig> = {
  transposition: { label: 'EHDS Transposition', color: 'blue' },
  related: { label: 'Related Legislation', color: 'gray' },
  amendment: { label: 'Amendment', color: 'yellow' },
  preparatory: { label: 'Preparatory Act', color: 'purple' }
};

export const STATUS_ORDER: LegislationStatus[] = [
  'draft',
  'tabled',
  'under_review',
  'adopted',
  'published',
  'in_force',
  'superseded'
];

export function getStatusLabel(status: LegislationStatus): string {
  return LEGISLATION_STATUSES[status]?.label || status;
}

export function getStatusColor(status: LegislationStatus): string {
  return LEGISLATION_STATUSES[status]?.color || 'gray';
}

export function getEnforcementLabel(measure: EnforcementMeasure): string {
  return ENFORCEMENT_MEASURES[measure]?.label || measure;
}

export function getEnforcementSeverity(measure: EnforcementMeasure): 'low' | 'medium' | 'high' {
  return ENFORCEMENT_MEASURES[measure]?.severity || 'low';
}

export function getLegislationTypeLabel(type: LegislationType): string {
  return LEGISLATION_TYPES[type]?.label || type;
}

export function getLegislationTypeColor(type: LegislationType): string {
  return LEGISLATION_TYPES[type]?.color || 'gray';
}
