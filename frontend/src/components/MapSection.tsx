import React, { useState, useRef, useEffect } from 'react';
import { 
  APIProvider, 
  Map, 
  InfoWindow,
  useMap
} from '@vis.gl/react-google-maps';
import type { Zone, Particle } from '../types';
import { ZoneMarker } from './ZoneMarker';
import { ParticleLayer } from './ParticleLayer';

interface MapSectionProps {
  zones: Zone[];
  particles?: Particle[];
}

/**
 * Internal helper to handle map bounds and initialization.
 */
const MapAutoFit = ({ zones }: { zones: Zone[] }) => {
  const map = useMap();
  const hasFit = useRef(false);

  useEffect(() => {
    if (hasFit.current || !map || zones.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    zones.forEach(z => {
      if (z.lat && z.lng) bounds.extend({ lat: z.lat, lng: z.lng });
    });
    map.fitBounds(bounds);
    hasFit.current = true;
  }, [map, zones]);
  
  return null;
};

/**
 * Spatial Intelligence Map.
 * Provides a high-fidelity geographic twin of the venue with real-time zone status 
 * and ML-driven wait time predictions.
 */
export const MapSection: React.FC<MapSectionProps> = ({ zones, particles }) => {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const mapId = 'bf51a910020fa25a'; // Production Map ID for Advanced Markers

  const center = { lat: 17.4720, lng: 78.3740 };
  const selectedZone = zones.find(z => z.zone_id === selectedZoneId);

  return (
    <section id="map-section" className="card map-section" aria-labelledby="map-title">
      <div className="card-header">
         <h2 className="card-title" id="map-title">Live HITEX Spatial Intelligence</h2>
         <MapLegend />
      </div>
      
      <div id="map-container" className="map-container" style={{ minHeight: '600px' }}>
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={center}
            defaultZoom={17}
            mapId={mapId}
            disableDefaultUI={true}
            gestureHandling={'greedy'}
            tilt={45}
            style={{ width: '100%', height: '100%', borderRadius: '12px' }}
          >
            <MapAutoFit zones={zones} />
            <ParticleLayer particles={particles} />
            
            {zones.map(z => (
              <ZoneMarker 
                key={z.zone_id} 
                zone={z} 
                isSelected={selectedZoneId === z.zone_id}
                onClick={setSelectedZoneId}
              />
            ))}

            {selectedZone && (
              <InfoWindow
                position={{ lat: selectedZone.lat!, lng: selectedZone.lng! }}
                onCloseClick={() => setSelectedZoneId(null)}
              >
                <div style={{ color: '#000', padding: '8px', minWidth: '150px', fontFamily: 'Inter, sans-serif' }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>{selectedZone.name}</h3>
                  <p style={{ margin: '0', fontSize: '0.85rem', lineHeight: '1.4' }}>
                    <strong>Crowd:</strong> {selectedZone.current_count} / {selectedZone.capacity}<br/>
                    <strong>Density:</strong> {(selectedZone.crowd_level * 100).toFixed(1)}%<br/>
                    <strong>Status:</strong> <span style={{ fontWeight: 'bold' }}>{selectedZone.status.toUpperCase()}</span>
                  </p>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>
    </section>
  );
};

const MapLegend: React.FC = () => (
  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
    <span style={{ fontSize: '0.75rem', color: '#fff', opacity: 0.8 }}>● Historical Trajectory</span>
    <span style={{ fontSize: '0.75rem', color: '#22c55e' }}>● Low</span>
    <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>● Crit</span>
  </div>
);
