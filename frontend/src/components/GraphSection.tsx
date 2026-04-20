import React, { useRef } from 'react';
import { useVenueGraph } from '../hooks/useVenueGraph';

interface GraphSectionProps {
  onZoneClick: (zoneName: string, status: string) => void;
  sessionToken: string;
  refreshTrigger?: number;
}

/**
 * Knowledge Graph UI component.
 * Displays the topological "GitNexus-style" connections between venue zones.
 */
export const GraphSection: React.FC<GraphSectionProps> = ({ 
  onZoneClick, 
  refreshTrigger,
  sessionToken
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Extract heavy D3 logic to custom hook
  useVenueGraph(sessionToken, refreshTrigger, svgRef, tooltipRef, onZoneClick);

  return (
    <section id="graph-section" className="card" aria-labelledby="graph-title">
      <div className="card-header">
        <h2 className="card-title" id="graph-title">
          Venue Knowledge Graph 
          <small className="text-muted" style={{ fontSize: '0.7rem', marginLeft: '8px' }}>
            — inspired by GitNexus
          </small>
        </h2>
        <span className="text-muted" style={{ fontSize: '0.72rem' }}>
          Nodes = zones · Edges = walkways · Width = crowd flow
        </span>
      </div>
      
      <div id="graph-container" className="graph-container" role="img" aria-label="Interactive venue connectivity graph">
        <svg 
          id="graph-svg" 
          ref={svgRef} 
          style={{ width: '100%', height: '100%' }} 
          aria-hidden="true" 
        />
        <div 
          id="graph-tooltip" 
          ref={tooltipRef} 
          className="graph-tooltip" 
          role="tooltip" 
          aria-live="polite" 
        />
      </div>

      <GraphLegend />
    </section>
  );
};

/**
 * Static legend for the graph status colors.
 */
const GraphLegend: React.FC = () => (
  <div className="graph-legend" aria-label="Graph status legend">
    {[
      { label: 'Low', color: 'var(--low)' },
      { label: 'Medium', color: 'var(--medium)' },
      { label: 'High', color: 'var(--high)' },
      { label: 'Critical', color: 'var(--critical)' },
    ].map(item => (
      <div key={item.label} className="legend-item">
        <div className="legend-dot" style={{ background: item.color }} />
        {item.label}
      </div>
    ))}
  </div>
);
