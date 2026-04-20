import { useEffect, useRef } from 'react';
import type { ZoneStatus } from '../types';

/**
 * Custom hook to manage the Google Maps instance and its dynamic elements.
 * Handles marker synchronization, path rendering, and infowindow reactivity.
 */
export const useVenueMap = (
  mapRef: React.RefObject<HTMLDivElement>,
  zones: ZoneStatus[],
  selectedZone: string | null,
  onZoneClick: (zoneName: string, status: string) => void
) => {
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Record<string, google.maps.Marker>>({});
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const hitexCenter = { lat: 17.470, lng: 78.375 };
    mapInstance.current = new google.maps.Map(mapRef.current, {
      center: hitexCenter,
      zoom: 16,
      mapId: 'SMART_VENUE_MOBILE_V1',
      disableDefaultUI: true,
      zoomControl: true,
      styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }]
    });

    infoWindowRef.current = new google.maps.InfoWindow({
      maxWidth: 240,
      disableAutoPan: true
    });
  }, [mapRef]);

  // Synchronize Markers
  useEffect(() => {
    if (!mapInstance.current) return;

    // Cleanup markers that are no longer in the zones list
    const currentZoneIds = new Set(zones.map(z => z.zone_id));
    Object.keys(markersRef.current).forEach(id => {
      if (!currentZoneIds.has(id)) {
        markersRef.current[id].setMap(null);
        delete markersRef.current[id];
      }
    });

    zones.forEach(zone => {
      const pos = { lat: zone.lat, lng: zone.lng };
      const statusColor = { 
        low: '#22c55e', medium: '#f59e0b', high: '#ef4444', critical: '#a855f7' 
      }[zone.status] || '#6b7a99';

      if (!markersRef.current[zone.zone_id]) {
        markersRef.current[zone.zone_id] = new google.maps.Marker({
          position: pos,
          map: mapInstance.current,
          title: zone.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: statusColor,
            fillOpacity: 0.9,
            strokeWeight: 2,
            strokeColor: '#FFFFFF',
            scale: 8 + zone.crowd_level * 6
          }
        });

        markersRef.current[zone.zone_id].addListener('click', () => {
          onZoneClick(zone.name, zone.status);
        });
      } else {
        const marker = markersRef.current[zone.zone_id];
        marker.setPosition(pos);
        marker.setIcon({
          ...(marker.getIcon() as google.maps.Symbol),
          fillColor: statusColor,
          scale: 8 + zone.crowd_level * 6
        });
      }

      // Update InfoWindow if it's the selected zone
      if (selectedZone === zone.name && infoWindowRef.current) {
        const content = `
          <div style="padding:4px; font-family:Inter,sans-serif; min-width:140px;">
            <b style="font-size:14px; display:block; margin-bottom:4px; color:#1e293b;">${zone.name}</b>
            <div style="font-size:12px; color:#64748b;">
              Crowd: <b>${Math.round(zone.crowd_level * 100)}%</b><br/>
              Status: <span style="color:${statusColor}; font-weight:600;">${zone.status.toUpperCase()}</span><br/>
              Wait: <b>${zone.predicted_wait_time}m</b>
            </div>
          </div>
        `;
        if (infoWindowRef.current.getContent() !== content) {
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(mapInstance.current, markersRef.current[zone.zone_id]);
        }
      }
    });

    return () => {
      // Final cleanup on unmount
      Object.values(markersRef.current).forEach(m => m.setMap(null));
      markersRef.current = {};
    };
  }, [zones, selectedZone, onZoneClick]);

  return { mapInstance };
};
