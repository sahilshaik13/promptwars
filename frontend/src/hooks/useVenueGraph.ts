import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import type { VenueGraph } from '../types';
import { getApiUrl } from '../utils/config';

/**
 * Custom hook to manage the D3 Knowledge Graph lifecycle.
 * Handles fetching, rendering, zoom persistence, and real-time updates.
 */
export const useVenueGraph = (
  sessionToken: string,
  refreshTrigger: number | undefined,
  svgRef: React.RefObject<SVGSVGElement>,
  tooltipRef: React.RefObject<HTMLDivElement>,
  onZoneClick: (zoneName: string, status: string) => void
) => {
  const lastTransform = useRef<d3.ZoomTransform | null>(null);
  const activeNodeId = useRef<string | null>(null);
  const graphDataRef = useRef<VenueGraph | null>(null);

  // Update tooltip live from the data stream without full re-render
  useEffect(() => {
    if (activeNodeId.current && graphDataRef.current && tooltipRef.current) {
      const node = graphDataRef.current.nodes.find(n => n.id === activeNodeId.current);
      if (node) {
        const statusToColor = (s: string) => ({ 
          low: '#22c55e', medium: '#f59e0b', high: '#ef4444', critical: '#a855f7' 
        }[s] || '#6b7a99');
        
        tooltipRef.current.innerHTML = `
          <strong>${node.label}</strong><br>
          Type: ${node.type}<br>
          Crowd: ${Math.round(node.crowd_level * 100)}%<br>
          Status: <span style="color:${statusToColor(node.status)}">${node.status}</span><br>
          ${node.current_count} / ${node.capacity} people
        `;
      }
    }
  }, [refreshTrigger, tooltipRef]);

  // Main rendering loop
  useEffect(() => {
    const render = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/graph`, {
          headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        if (!res.ok) return;
        const graph: VenueGraph = await res.json();
        graphDataRef.current = graph;
        
        if (!svgRef.current) return;

        const width = 1200;
        const height = 1000;

        // Coordinate scaling
        const nodes = graph.nodes.map(n => ({
          ...n,
          x: n.x_hint * width,
          y: n.y_hint * height,
        }));
        const nodeById = Object.fromEntries(nodes.map(n => [n.id, n]));
        const edges = graph.edges.map(e => ({
          ...e,
          source: nodeById[e.source],
          target: nodeById[e.target],
        })).filter(e => e.source && e.target) as (Omit<import('../types').GraphEdge, 'source' | 'target'> & { source: import('../types').GraphNode, target: import('../types').GraphNode })[];

        const svg = d3.select(svgRef.current)
          .attr("viewBox", `0 0 ${width} ${height}`)
          .attr("preserveAspectRatio", "xMidYMid meet");

        svg.selectAll('*').remove();
        const g = svg.append('g');
        
        const statusToColor = (s: string) => ({ 
          low: '#22c55e', medium: '#f59e0b', high: '#ef4444', critical: '#a855f7' 
        }[s] || '#6b7a99');

        const zoom = d3.zoom<SVGSVGElement, unknown>()
          .scaleExtent([0.1, 8])
          .on('zoom', (evt) => {
            g.attr('transform', evt.transform);
            lastTransform.current = evt.transform;
          });
          
        svg.call(zoom);

        // Apply persistent transform or auto-fit
        if (lastTransform.current) {
          svg.call(zoom.transform, lastTransform.current);
        } else {
          const xExtent = d3.extent(nodes, d => d.x) as [number, number];
          const yExtent = d3.extent(nodes, d => d.y) as [number, number];
          const graphWidth = xExtent[1] - xExtent[0];
          const graphHeight = yExtent[1] - yExtent[0];
          const scale = 0.7 / Math.max(graphWidth / width, graphHeight / height);
          const t = d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(scale)
            .translate(-(xExtent[0] + graphWidth / 2), -(yExtent[0] + graphHeight / 2));
          svg.call(zoom.transform, t);
        }

        // Draw Links
        g.append('g').selectAll('line')
          .data(edges).enter().append('line')
          .attr('class', d => d.weight > 0.8 ? 'graph-link jammed' : d.weight > 0.45 ? 'graph-link slow' : 'graph-link flowing')
          .attr('stroke-width', d => 1.5 + d.weight * 6)
          .attr('x1', d => d.source.x_hint * width).attr('y1', d => d.source.y_hint * height)
          .attr('x2', d => d.target.x_hint * width).attr('y2', d => d.target.y_hint * height);

        // Draw Nodes
        const node = g.append('g').selectAll('g')
          .data(nodes).enter().append('g')
          .attr('class', 'graph-node')
          .attr('transform', d => `translate(${d.x},${d.y})`)
          .on('click', (evt, d) => onZoneClick(d.label, d.status));

        const radius = (d: import('../types').GraphNode) => 10 + d.crowd_level * 16;
        
        node.append('circle')
          .attr('r', radius)
          .attr('fill', d => statusToColor(d.status) + '22')
          .attr('stroke', d => statusToColor(d.status))
          .on('mouseover', (evt, d) => {
            activeNodeId.current = d.id;
            const tt = tooltipRef.current;
            if (tt) {
              tt.style.opacity = '1';
              tt.style.left = (evt.offsetX + 12) + 'px';
              tt.style.top  = (evt.offsetY - 10) + 'px';
              tt.innerHTML = `
                <strong>${d.label}</strong><br>
                Type: ${d.type}<br>
                Crowd: ${Math.round(d.crowd_level * 100)}%<br>
                Status: <span style="color:${statusToColor(d.status)}">${d.status}</span><br>
                ${d.current_count} / ${d.capacity} people
              `;
            }
          })
          .on('mouseleave', () => {
            activeNodeId.current = null;
            if (tooltipRef.current) tooltipRef.current.style.opacity = '0';
          });

        node.append('text')
          .attr('dy', d => radius(d) + 11)
          .text(d => d.label.split('—')[0].trim().substring(0, 12));

      } catch (e) {
        console.warn('Graph initialization error', e);
      }
    };
    render();
  }, [sessionToken, refreshTrigger, svgRef, tooltipRef, onZoneClick]);

  return { graphDataRef, activeNodeId };
};
