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

interface EuropeMapProps {
  countryData: CountryData;
  selectedCountry: string | null;
  onCountryClick: (code: string | null) => void;
  isLegislationView: boolean;
  className?: string;
}

export function EuropeMap({ 
  countryData, 
  selectedCountry, 
  onCountryClick, 
  isLegislationView,
  className 
}: EuropeMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const getMarkerSize = (code: string) => {
    const count = countryData[code] || 0;
    const isSelected = selectedCountry === code;
    if (isSelected) return 40;
    if (count > 0) return 32 + Math.min(count * 2, 8);
    return 28;
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
      const count = countryData[country.code] || 0;
      const hasData = count > 0;
      const isSelected = selectedCountry === country.code;
      const size = getMarkerSize(country.code);
      const borderColor = getBorderColor(country.code);
      const flag = getFlagEmoji(country.code);

      // Create custom div icon with flag
      const icon = L.divIcon({
        className: 'custom-flag-marker',
        html: `
          <div style="
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            border: 3px solid ${borderColor};
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${size * 0.55}px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            cursor: pointer;
            transition: all 0.2s ease;
            ${isSelected ? 'transform: scale(1.1);' : ''}
            ${!hasData ? 'opacity: 0.6;' : ''}
          ">
            ${flag}
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([country.lat, country.lng], { icon });

      const popupContent = `
        <div style="text-align: center;">
          <strong style="display: block; font-size: 14px;">${flag} ${country.name}</strong>
          <span style="font-size: 12px; color: #666;">
            ${hasData 
              ? `${count} ${isLegislationView ? (count === 1 ? 'law' : 'laws') : (count === 1 ? 'entity' : 'entities')}`
              : 'No data yet'
            }
          </span>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        onCountryClick(isSelected ? null : country.code);
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });
  }, [countryData, selectedCountry, isLegislationView, onCountryClick]);

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
          <div className="h-4 w-4 rounded-full bg-gray-400 border-2 border-white shadow" />
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
