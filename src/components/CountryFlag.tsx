import { cn } from '@/lib/utils';

interface CountryFlagProps {
  countryCode: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  sm: 'w-4 h-3',
  md: 'w-5 h-4',
  lg: 'w-6 h-4',
  xl: 'w-8 h-6',
};

export function CountryFlag({ countryCode, size = 'md', className }: CountryFlagProps) {
  const code = countryCode.toLowerCase();
  
  return (
    <img
      src={`https://flagcdn.com/24x18/${code}.png`}
      srcSet={`https://flagcdn.com/48x36/${code}.png 2x`}
      alt={`${countryCode} flag`}
      className={cn(SIZE_MAP[size], 'inline-block rounded-[2px] object-cover', className)}
      loading="lazy"
    />
  );
}
