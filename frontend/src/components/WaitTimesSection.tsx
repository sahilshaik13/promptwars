import React, { useEffect, useState } from 'react';
import type { Zone, WaitTimePrediction } from '../types';
import { getApiUrl } from '../utils/config';

interface WaitTimesSectionProps {
  zones: Zone[];
}

export const WaitTimesSection: React.FC<WaitTimesSectionProps> = ({ zones }) => {
  // Sort zones by crowd level (descending: most congested at top)
  const sortedZones = [...zones].sort((a, b) => b.crowd_level - a.crowd_level);

  const getTrendIcon = (trend: string = 'stable') => {
    switch(trend) {
      case 'rising': return '↑';
      case 'falling': return '↓';
      default: return '→';
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'low') return 'var(--low)';
    if (status === 'medium') return 'var(--medium)';
    if (status === 'high') return 'var(--high)';
    return 'var(--critical)';
  };

  return (
    <section id="waittimes-section" className="card" aria-labelledby="wait-title">
      <div className="card-header">
        <h2 className="card-title" id="wait-title">Predicted Wait Times</h2>
      </div>
      <div className="card-body" style={{ padding: '0px' }}>
        <div 
          id="wait-cards" 
          className="wait-cards" 
          aria-live="polite" 
          aria-label="Wait time predictions per zone"
          style={{ 
            maxHeight: '740px', 
            overflowY: 'auto', 
            padding: '16px 18px',
            scrollBehavior: 'smooth'
          }}
        >
          {!sortedZones.length ? (
            <div className="skeleton" style={{ height: '200px' }}></div>
          ) : (
            sortedZones.map(zone => {
              const waitMinutes = Math.round(zone.predicted_wait_time ?? 0);
              const trend = zone.trend || 'stable';
              
              return (
                <div key={zone.zone_id} className="wait-card">
                  <div className="wait-left">
                    <div className="wait-zone">{zone.name}</div>
                    <div className="wait-type">{zone.type}</div>
                  </div>
                  <div className="wait-right">
                    <div className="wait-minutes" style={{ color: getStatusColor(zone.status) }}>
                      {waitMinutes}m
                    </div>
                    <div className={`wait-trend trend-${trend}`} aria-label={`Trend: ${trend}`}>
                      {getTrendIcon(trend)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
