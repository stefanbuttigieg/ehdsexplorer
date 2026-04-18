import type { AIRole } from '@/data/aiRolePrompts';
import andreaGeneral from '@/assets/andrea-avatar.png';
import andreaCitizen from '@/assets/andrea-citizen.png';
import andreaHealthcare from '@/assets/andrea-healthcare.png';
import andreaLegal from '@/assets/andrea-legal.png';
import andreaResearcher from '@/assets/andrea-researcher.png';
import andreaDeveloper from '@/assets/andrea-developer.png';
import andreaPolicy from '@/assets/andrea-policy.png';

const ANDREA_AVATARS: Record<AIRole, string> = {
  general: andreaGeneral,
  citizen: andreaCitizen,
  healthcare: andreaHealthcare,
  legal: andreaLegal,
  researcher: andreaResearcher,
  developer: andreaDeveloper,
  policy: andreaPolicy,
};

export const getAndreaAvatar = (role?: AIRole | null): string => {
  if (!role) return andreaGeneral;
  return ANDREA_AVATARS[role] ?? andreaGeneral;
};
