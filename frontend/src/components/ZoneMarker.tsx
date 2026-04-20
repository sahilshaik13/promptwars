import React from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import type { Zone } from '../types';

interface ZoneMarkerProps {
  zone: Zone;
  isSelected: boolean;
  onClick: (id: string) => void;
}

const getStatusColor = (status: string) => {
  switch(status) {
    case 'low': return '#22c55e';
    case 'medium': return '#fbbf24';
    case 'high': return '#f97316';
    case 'critical': return '#ef4444';
    default: return '#6b7a99';
  }
};

const getAriaLabel = (zone: Zone): string => {
  const waitTime = zone.predicted_wait_time ? `${Math.round(zone.predicted_wait_time)} minutes` : 'unknown';
  return `${zone.name}, ${zone.type}, crowd level ${Math.round(zone.crowd_level * 100)}%, status ${zone.status}, predicted wait time ${waitTime}`;
};

export const ZoneMarker: React.FC<ZoneMarkerProps> = ({ zone, isSelected, onClick }) => {
  if (!zone.lat || !zone.lng) return null;
  const color = getStatusColor(zone.status);
  const ariaLabel = getAriaLabel(zone);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(zone.zone_id);
    }
  };

  return (
    <AdvancedMarker
      position={{ lat: zone.lat, lng: zone.lng }}
      onClick={() => onClick(zone.zone_id)}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div
        style={{
          position: 'relative',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 20px ${color}`,
          border: '3px solid white',
          cursor: 'pointer',
          transition: 'all 0.3s ease-out',
          transform: isSelected ? 'scale(1.2)' : 'scale(1)',
          pointerEvents: 'auto'
        }}
        role="button"
        aria-label={ariaLabel}
        aria-pressed={isSelected}
        aria-describedby={`zone-wait-${zone.zone_id}`}
      >
        {zone.status === 'critical' && (
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: `2px solid ${color}`,
            animation: 'ping 1.5s infinite',
            pointerEvents: 'none'
          }} />
        )}

        {(zone.predicted_wait_time ?? 0) > 0.5 && (
          <div
            id={`zone-wait-${zone.zone_id}`}
            style={{
              position: 'absolute',
              top: '-20px',
              background: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
              zIndex: 10
            }}
          >
            {Math.round(zone.predicted_wait_time!)}m wait
          </div>
        )}
      </div>
    </AdvancedMarker>
  );
};
