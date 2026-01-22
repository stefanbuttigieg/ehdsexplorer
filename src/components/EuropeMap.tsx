import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

// EU country coordinates (capital cities approximate)
const EU_COUNTRIES = [
  { code: 'AT', name: 'Austria', lat: 48.2082, lng: 16.3738 },
  { code: 'BE', name: 'Belgium', lat: 50.8503, lng: 4.3517 },
  { code: 'BG', name: 'Bulgaria', lat: 42.6977, lng: 23.3219 },
  { code: 'HR', name: 'Croatia', lat: 45.815, lng: 15.9819 },
  { code: 'CY', name: 'Cyprus', lat: 35.1856, lng: 33.3823 },
  { code: 'CZ', name: 'Czechia', lat: 50.0755, lng: 14.4378 },
  { code: 'DK', name: 'Denmark', lat: 55.6761, lng: 12.5683 },
  { code: 'EE', name: 'Estonia', lat: 59.437, lng: 24.7536 },
  { code: 'FI', name: 'Finland', lat: 60.1699, lng: 24.9384 },
  { code: 'FR', name: 'France', lat: 48.8566, lng: 2.3522 },
  { code: 'DE', name: 'Germany', lat: 52.52, lng: 13.405 },
  { code: 'GR', name: 'Greece', lat: 37.9838, lng: 23.7275 },
  { code: 'HU', name: 'Hungary', lat: 47.4979, lng: 19.0402 },
  { code: 'IE', name: 'Ireland', lat: 53.3498, lng: -6.2603 },
  { code: 'IT', name: 'Italy', lat: 41.9028, lng: 12.4964 },
  { code: 'LV', name: 'Latvia', lat: 56.9496, lng: 24.1052 },
  { code: 'LT', name: 'Lithuania', lat: 54.6872, lng: 25.2797 },
  { code: 'LU', name: 'Luxembourg', lat: 49.6116, lng: 6.1319 },
  { code: 'MT', name: 'Malta', lat: 35.8989, lng: 14.5146 },
  { code: 'NL', name: 'Netherlands', lat: 52.3676, lng: 4.9041 },
  { code: 'PL', name: 'Poland', lat: 52.2297, lng: 21.0122 },
  { code: 'PT', name: 'Portugal', lat: 38.7223, lng: -9.1393 },
  { code: 'RO', name: 'Romania', lat: 44.4268, lng: 26.1025 },
  { code: 'SK', name: 'Slovakia', lat: 48.1486, lng: 17.1077 },
  { code: 'SI', name: 'Slovenia', lat: 46.0569, lng: 14.5058 },
  { code: 'ES', name: 'Spain', lat: 40.4168, lng: -3.7038 },
  { code: 'SE', name: 'Sweden', lat: 59.3293, lng: 18.0686 },
];

// Convert country code to flag emoji
const getFlagEmoji = (countryCode: string) => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

interface CountryData {
  [code: string]: number;
}

interface CountryDetails {
  [code: string]: {
    entities?: Array<{ name: string; type: string; status: string }>;
    legislation?: Array<{ title: string; type: string; status: string }>;
  };
}

interface EuropeMapProps {
  countryData: CountryData;
  countryDetails?: CountryDetails;
  selectedCountry: string | null;
  onCountryClick: (code: string | null) => void;
  isLegislationView: boolean;
  className?: string;
}

export function EuropeMap({ 
  countryData, 
  countryDetails,
  selectedCountry, 
  onCountryClick, 
  isLegislationView,
  className 
}: EuropeMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const getMarkerSize = (code: string, isHovered = false) => {
    const count = countryData[code] || 0;
    const isSelected = selectedCountry === code;
    let size = 28;
    if (isSelected) size = 40;
    else if (count > 0) size = 32 + Math.min(count * 2, 8);
    return isHovered ? size * 1.2 : size;
  };

  const getBorderColor = (code: string) => {
    const hasData = countryData[code] > 0;
    const isSelected = selectedCountry === code;
    
    if (isSelected) {
      return isLegislationView ? '#059669' : '#3b82f6';
    }
    if (hasData) {
      return isLegislationView ? '#10b981' : '#3b82f6';
    }
    return '#9ca3af';
  };

  const createIcon = (country: typeof EU_COUNTRIES[0], isHovered = false) => {
    const count = countryData[country.code] || 0;
    const hasData = count > 0;
    const isSelected = selectedCountry === country.code;
    const size = getMarkerSize(country.code, isHovered);
    const borderColor = getBorderColor(country.code);
    const flag = getFlagEmoji(country.code);

    return L.divIcon({
      className: 'custom-flag-marker',
      html: `
        <div class="flag-marker-inner" style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          border: 3px solid ${borderColor};
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${size * 0.55}px;
          box-shadow: ${isHovered ? '0 4px 16px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.2)'};
          cursor: pointer;
          transition: all 0.2s ease;
          transform: scale(${isSelected ? 1.1 : 1});
          ${!hasData ? 'opacity: 0.6;' : ''}
        ">
          ${flag}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  const createTooltipContent = (country: typeof EU_COUNTRIES[0]) => {
    const count = countryData[country.code] || 0;
    const flag = getFlagEmoji(country.code);
    const details = countryDetails?.[country.code];
    
    // Check if there's any data in countryDetails (unfiltered) for the current view
    const hasDetailsData = isLegislationView 
      ? (details?.legislation?.length ?? 0) > 0
      : (details?.entities?.length ?? 0) > 0;
    
    const hasData = count > 0 || hasDetailsData;

    let detailsHtml = '';
    
    if (details) {
      if (isLegislationView && details.legislation?.length) {
        const items = details.legislation.slice(0, 3);
        detailsHtml = `
          <div style="margin-top: 8px; border-top: 1px solid #e5e7eb; padding-top: 8px;">
            ${items.map(leg => `
              <div style="margin-bottom: 4px; font-size: 11px;">
                <div style="font-weight: 500; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">
                  ${leg.title}
                </div>
                <div style="color: #6b7280; display: flex; gap: 6px;">
                  <span style="background: #f3f4f6; padding: 1px 4px; border-radius: 3px;">${leg.type}</span>
                  <span style="background: ${leg.status === 'In Force' ? '#d1fae5' : '#fef3c7'}; padding: 1px 4px; border-radius: 3px;">${leg.status}</span>
                </div>
              </div>
            `).join('')}
            ${details.legislation.length > 3 ? `<div style="font-size: 10px; color: #9ca3af; margin-top: 4px;">+${details.legislation.length - 3} more</div>` : ''}
          </div>
        `;
      } else if (!isLegislationView && details.entities?.length) {
        const items = details.entities.slice(0, 3);
        detailsHtml = `
          <div style="margin-top: 8px; border-top: 1px solid #e5e7eb; padding-top: 8px;">
            ${items.map(entity => `
              <div style="margin-bottom: 4px; font-size: 11px;">
                <div style="font-weight: 500; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">
                  ${entity.name}
                </div>
                <div style="color: #6b7280; display: flex; gap: 6px;">
                  <span style="background: ${entity.type === 'DHA' ? '#dbeafe' : '#fce7f3'}; padding: 1px 4px; border-radius: 3px;">${entity.type}</span>
                  <span style="background: ${entity.status === 'Active' ? '#d1fae5' : '#fef3c7'}; padding: 1px 4px; border-radius: 3px;">${entity.status}</span>
                </div>
              </div>
            `).join('')}
            ${details.entities.length > 3 ? `<div style="font-size: 10px; color: #9ca3af; margin-top: 4px;">+${details.entities.length - 3} more</div>` : ''}
          </div>
        `;
      }
    }

    // Get the count to display based on unfiltered data for the current view
    const displayCount = isLegislationView 
      ? (details?.legislation?.length ?? 0)
      : (details?.entities?.length ?? 0);

    return `
      <div style="min-width: 160px; max-width: 220px;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
          <span style="font-size: 18px;">${flag}</span>
          <strong style="font-size: 14px; color: #111827;">${country.name}</strong>
        </div>
        <div style="font-size: 12px; color: #6b7280;">
          ${hasData 
            ? `<span style="font-weight: 600; color: ${isLegislationView ? '#059669' : '#3b82f6'};">${displayCount}</span> ${isLegislationView ? (displayCount === 1 ? 'law' : 'laws') : (displayCount === 1 ? 'entity' : 'entities')}`
            : '<span style="color: #9ca3af;">No data yet</span>'
          }
        </div>
        ${detailsHtml}
        ${hasData ? '<div style="font-size: 10px; color: #9ca3af; margin-top: 6px; text-align: center;">Click to filter</div>' : ''}
      </div>
    `;
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [54, 10],
      zoom: 4,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    EU_COUNTRIES.forEach(country => {
      const isSelected = selectedCountry === country.code;

      const marker = L.marker([country.lat, country.lng], { 
        icon: createIcon(country, false),
        zIndexOffset: isSelected ? 1000 : 0
      });

      // Add tooltip with details
      marker.bindTooltip(createTooltipContent(country), {
        direction: 'top',
        offset: [0, -15],
        className: 'custom-leaflet-tooltip',
        opacity: 1,
      });

      // Hover effects - enlarge marker
      marker.on('mouseover', function() {
        this.setIcon(createIcon(country, true));
        this.setZIndexOffset(500);
      });

      marker.on('mouseout', function() {
        this.setIcon(createIcon(country, false));
        this.setZIndexOffset(isSelected ? 1000 : 0);
      });

      marker.on('click', () => {
        onCountryClick(isSelected ? null : country.code);
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });
  }, [countryData, countryDetails, selectedCountry, isLegislationView, onCountryClick]);

  // Pan to selected country
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedCountry) {
      const country = EU_COUNTRIES.find(c => c.code === selectedCountry);
      if (country) {
        map.setView([country.lat, country.lng], 6, { animate: true });
      }
    } else {
      map.setView([54, 10], 4, { animate: true });
    }
  }, [selectedCountry]);

  return (
    <div className={cn("relative w-full h-[500px] rounded-lg overflow-hidden border", className)}>
      <style>{`
        .custom-leaflet-tooltip {
          background: white !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 8px !important;
          padding: 10px 12px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          font-family: inherit !important;
        }
        .custom-leaflet-tooltip::before {
          border-top-color: white !important;
        }
        .custom-flag-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
      <div ref={mapRef} className="h-full w-full z-0" style={{ background: '#e5e7eb' }} />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg p-3 text-xs space-y-2 shadow-lg border z-[1000]">
        <div className="font-medium text-foreground mb-1">Legend</div>
        <div className="flex items-center gap-2">
          <div 
            className="h-4 w-4 rounded-full border-2 border-white shadow"
            style={{ backgroundColor: isLegislationView ? '#10b981' : '#3b82f6' }}
          />
          <span>Has {isLegislationView ? 'legislation' : 'entities'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-muted-foreground/40 border-2 border-white shadow" />
          <span>No data yet</span>
        </div>
      </div>

      {/* Title */}
      <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border z-[1000]">
        <span className="text-sm font-medium">
          {isLegislationView ? 'National EHDS Legislation' : 'National EHDS Entities'}
        </span>
      </div>
    </div>
  );
}
