export const EU_CODES = 'AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE'.split(' ');
const normal = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
export function assessEvidence(source: { official: boolean; country_code: string | null }, candidate: { country_code: string; evidence_quote: string; evidence_date: string | null; confidence: number; explicitly_ehds: boolean; obligation_specific: boolean; proposed_status: string; operational: boolean }, markdown: string, now = new Date()) {
  if (!source.official) return 'Research source requires official corroboration';
  if (source.country_code !== candidate.country_code) return 'Country-specific official source required';
  if (!EU_CODES.includes(candidate.country_code)) return 'Not an EU member state';
  if (!candidate.explicitly_ehds || !candidate.obligation_specific) return 'EHDS obligation not explicitly substantiated';
  if (candidate.evidence_quote.length < 40 || !normal(markdown).includes(normal(candidate.evidence_quote))) return 'Exact supporting passage not found';
  const date = candidate.evidence_date ? new Date(candidate.evidence_date) : null;
  if (!date || !Number.isFinite(date.getTime()) || date > now || now.getTime() - date.getTime() > 366 * 86400000) return 'Recent dated evidence required';
  if (candidate.confidence < 0.95) return 'Insufficient confidence';
  if (candidate.proposed_status === 'not_started') return 'Absence of evidence is not evidence of no implementation';
  if (candidate.proposed_status === 'completed' && !candidate.operational) return 'Completion requires operational evidence';
  return 'Verified official country evidence';
}