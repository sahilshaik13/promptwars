import React from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import type { Particle } from '../types';

interface ParticleLayerProps {
  particles?: Particle[];
}

/**
 * High-fidelity crowd particle layer for spatial intelligence map.
 */
export const ParticleLayer: React.FC<ParticleLayerProps> = ({ particles }) => {
  if (!particles || particles.length === 0) return null;

  return (
    <>
      {particles.map(p => (
        <AdvancedMarker
          key={p.id}
          position={{ lat: p.y, lng: p.x }}
          collisionBehavior="OPTIONAL_AND_HIDES_LOWER_PRIORITY"
        >
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: p.type === 'Biker' ? '#38bdf8' : '#fff',
            boxShadow: '0 0 8px rgba(255,255,255,0.8)',
            border: '1px solid rgba(0,0,0,0.3)',
            opacity: 0.8,
            transition: 'all 0.5s linear'
          }} aria-hidden="true" />
        </AdvancedMarker>
      ))}
    </>
  );
};
