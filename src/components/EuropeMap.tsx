import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
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

// Component to handle map bounds/view updates
function MapController({ selectedCountry }: { selectedCountry: string | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedCountry) {
      const country = EU_COUNTRIES.find(c => c.code === selectedCountry);
      if (country) {
        map.setView([country.lat, country.lng], 6, { animate: true });
      }
    } else {
      // Reset to Europe view
      map.setView([54, 10], 4, { animate: true });
    }
  }, [selectedCountry, map]);
  
  return null;
}

export function EuropeMap({ 
  countryData, 
  selectedCountry, 
  onCountryClick, 
  isLegislationView,
  className 
}: EuropeMapProps) {
  const getMarkerColor = (code: string) => {
    const hasData = countryData[code] > 0;
    const isSelected = selectedCountry === code;
    
    if (isSelected) {
      return isLegislationView ? '#059669' : 'hsl(221, 83%, 53%)'; // emerald-600 or primary blue
    }
    if (hasData) {
      return isLegislationView ? '#10b981' : 'hsl(221, 83%, 53%)'; // emerald-500 or primary
    }
    return '#9ca3af'; // gray-400
  };

  const getMarkerRadius = (code: string) => {
    const count = countryData[code] || 0;
    const isSelected = selectedCountry === code;
    if (isSelected) return 14;
    if (count > 0) return 10 + Math.min(count * 2, 8);
    return 8;
  };

  return (
    <div className={cn("relative w-full h-[500px] rounded-lg overflow-hidden border", className)}>
      <MapContainer
        center={[54, 10]}
        zoom={4}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        style={{ background: '#e5e7eb' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <MapController selectedCountry={selectedCountry} />
        
        {EU_COUNTRIES.map(country => {
          const count = countryData[country.code] || 0;
          const hasData = count > 0;
          const isSelected = selectedCountry === country.code;
          
          return (
            <CircleMarker
              key={country.code}
              center={[country.lat, country.lng]}
              radius={getMarkerRadius(country.code)}
              pathOptions={{
                fillColor: getMarkerColor(country.code),
                fillOpacity: isSelected ? 1 : 0.8,
                color: isSelected ? '#ffffff' : hasData ? '#ffffff' : '#6b7280',
                weight: isSelected ? 3 : 2,
              }}
              eventHandlers={{
                click: () => onCountryClick(isSelected ? null : country.code),
              }}
            >
              <Popup>
                <div className="text-center">
                  <strong className="block text-sm">{country.name}</strong>
                  {hasData ? (
                    <span className="text-xs text-muted-foreground">
                      {count} {isLegislationView ? (count === 1 ? 'law' : 'laws') : (count === 1 ? 'entity' : 'entities')}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">No data yet</span>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg p-3 text-xs space-y-2 shadow-lg border z-[1000]">
        <div className="font-medium text-foreground mb-1">Legend</div>
        <div className="flex items-center gap-2">
          <div 
            className="h-4 w-4 rounded-full border-2 border-white shadow"
            style={{ backgroundColor: isLegislationView ? '#10b981' : 'hsl(221, 83%, 53%)' }}
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
