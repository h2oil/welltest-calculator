import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Droplets, Thermometer, Gauge, Zap, Filter, Flame, 
  ChevronRight, ChevronDown, AlertTriangle, Info
} from 'lucide-react';
import type { NetworkResult, NodeState } from '@/types/well-testing';

interface ProcessFlowDiagramProps {
  outputs: NetworkResult | null;
  isCalculating: boolean;
  onNodeClick?: (nodeId: string) => void;
  selectedNode?: string;
}

interface EquipmentNode {
  id: string;
  name: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  status: 'normal' | 'warning' | 'critical';
}

const ProcessFlowDiagram = ({ 
  outputs, 
  isCalculating, 
  onNodeClick, 
  selectedNode 
}: ProcessFlowDiagramProps) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Equipment configuration
  const equipmentNodes: EquipmentNode[] = [
    { id: 'wellhead', name: 'Wellhead', icon: '⛽', x: 50, y: 150, width: 80, height: 60, color: '#e3f2fd', status: 'normal' },
    { id: 'esd', name: 'ESD/SSV', icon: '🔒', x: 200, y: 150, width: 80, height: 60, color: '#f3e5f5', status: 'normal' },
    { id: 'filter', name: 'Sand Filter', icon: '🔍', x: 350, y: 150, width: 80, height: 60, color: '#e8f5e8', status: 'normal' },
    { id: 'choke', name: 'Choke', icon: '🎛️', x: 500, y: 150, width: 80, height: 60, color: '#fff3e0', status: 'normal' },
    { id: 'heater', name: 'Heater', icon: '🔥', x: 650, y: 150, width: 80, height: 60, color: '#ffebee', status: 'normal' },
    { id: 'separator', name: 'Separator', icon: '🛢️', x: 800, y: 150, width: 80, height: 60, color: '#e0f2f1', status: 'normal' },
    { id: 'flare', name: 'Flare', icon: '💨', x: 950, y: 150, width: 80, height: 60, color: '#f1f8e9', status: 'normal' }
  ];

  // Update node status based on outputs
  useEffect(() => {
    if (outputs) {
      equipmentNodes.forEach((node, index) => {
        if (index < outputs.nodes.length) {
          const nodeData = outputs.nodes[index];
          if (nodeData.warnings.length > 0) {
            node.status = 'warning';
          } else {
            node.status = 'normal';
          }
        }
      });
    }
  }, [outputs]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'warning': return '#ff9800';
      case 'critical': return '#f44336';
      default: return '#4caf50';
    }
  };

  const getNodeData = (nodeId: string): NodeState | null => {
    if (!outputs) return null;
    const nodeIndex = equipmentNodes.findIndex(node => node.id === nodeId);
    return nodeIndex >= 0 && nodeIndex < outputs.nodes.length ? outputs.nodes[nodeIndex] : null;
  };

  const formatPressure = (pressure: number) => {
    return `${(pressure / 1000).toFixed(0)} kPa`;
  };

  const formatTemperature = (temperature: number) => {
    return `${(temperature - 273.15).toFixed(0)}°C`;
  };

  const formatVelocity = (velocity: number | undefined) => {
    return velocity ? `${velocity.toFixed(1)} m/s` : 'N/A';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Process Flow Diagram</h3>
        <div className="flex items-center gap-2">
          {isCalculating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              Calculating...
            </div>
          )}
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-muted/20 overflow-x-auto">
        <svg
          width="1100"
          height="300"
          viewBox="0 0 1100 300"
          className="w-full h-auto"
          style={{ minWidth: '100%' }}
        >
          {/* Background */}
          <rect width="1100" height="300" fill="#fafafa" />
          
          {/* Flow line */}
          <line
            x1="90"
            y1="180"
            x2="1010"
            y2="180"
            stroke="#0066cc"
            strokeWidth="4"
            strokeDasharray="5,5"
          />

          {/* Equipment nodes */}
          {equipmentNodes.map((node) => {
            const nodeData = getNodeData(node.id);
            const isSelected = selectedNode === node.id;
            const isHovered = hoveredNode === node.id;
            const hasWarnings = nodeData?.warnings.length > 0;

            return (
              <g key={node.id}>
                {/* Equipment block */}
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  fill={isSelected ? '#e3f2fd' : node.color}
                  stroke={isSelected ? '#1976d2' : hasWarnings ? getStatusColor('warning') : '#dee2e6'}
                  strokeWidth={isSelected ? 3 : hasWarnings ? 2 : 1}
                  rx="8"
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => onNodeClick?.(node.id)}
                />

                {/* Equipment icon */}
                <text
                  x={node.x + node.width / 2}
                  y={node.y + 25}
                  textAnchor="middle"
                  fontSize="24"
                  fill="#495057"
                  className="pointer-events-none"
                >
                  {node.icon}
                </text>

                {/* Equipment name */}
                <text
                  x={node.x + node.width / 2}
                  y={node.y + 45}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#495057"
                  className="pointer-events-none"
                >
                  {node.name}
                </text>

                {/* Data tile above equipment */}
                {nodeData && (
                  <g>
                    {/* Data tile background */}
                    <rect
                      x={node.x - 10}
                      y={node.y - 35}
                      width={node.width + 20}
                      height="30"
                      fill="white"
                      stroke="#dee2e6"
                      strokeWidth="1"
                      rx="4"
                    />

                    {/* Data text */}
                    <text
                      x={node.x + node.width / 2}
                      y={node.y - 20}
                      textAnchor="middle"
                      fontSize="8"
                      fill="#495057"
                      className="pointer-events-none"
                    >
                      P: {formatPressure(nodeData.pressure_kPa * 1000)}
                    </text>
                    <text
                      x={node.x + node.width / 2}
                      y={node.y - 10}
                      textAnchor="middle"
                      fontSize="8"
                      fill="#495057"
                      className="pointer-events-none"
                    >
                      T: {formatTemperature(nodeData.temperature_K)}
                    </text>
                    <text
                      x={node.x + node.width / 2}
                      y={node.y - 2}
                      textAnchor="middle"
                      fontSize="8"
                      fill="#495057"
                      className="pointer-events-none"
                    >
                      V: {formatVelocity(nodeData.velocity_m_s)}
                    </text>
                  </g>
                )}

                {/* Warning badge */}
                {hasWarnings && (
                  <g>
                    <circle
                      cx={node.x + node.width + 15}
                      cy={node.y + 15}
                      r="12"
                      fill="#ff9800"
                    />
                    <text
                      x={node.x + node.width + 15}
                      y={node.y + 20}
                      textAnchor="middle"
                      fontSize="10"
                      fill="white"
                      fontWeight="bold"
                      className="pointer-events-none"
                    >
                      !
                    </text>
                  </g>
                )}

                {/* Flow arrows between equipment */}
                {node.id !== 'wellhead' && (
                  <path
                    d={`M ${node.x - 20} ${node.y + 30} L ${node.x - 5} ${node.y + 30}`}
                    stroke="#0066cc"
                    strokeWidth="2"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                  />
                )}
              </g>
            );
          })}

          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#0066cc"
              />
            </marker>
          </defs>

          {/* Legend */}
          <g>
            <rect x="50" y="250" width="200" height="40" fill="white" stroke="#dee2e6" rx="4" />
            <text x="60" y="265" fontSize="10" fill="#495057" fontWeight="bold">
              Legend:
            </text>
            <circle cx="70" cy="275" r="4" fill="#4caf50" />
            <text x="80" y="280" fontSize="8" fill="#495057">Normal</text>
            <circle cx="120" cy="275" r="4" fill="#ff9800" />
            <text x="130" y="280" fontSize="8" fill="#495057">Warning</text>
            <circle cx="170" cy="275" r="4" fill="#f44336" />
            <text x="180" y="280" fontSize="8" fill="#495057">Critical</text>
          </g>
        </svg>
      </div>

      {/* Node details panel */}
      {selectedNode && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-4 w-4" />
              Node Details: {equipmentNodes.find(n => n.id === selectedNode)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const nodeData = getNodeData(selectedNode);
              if (!nodeData) return <p>No data available</p>;

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Pressure</p>
                      <p className="text-lg font-semibold">{formatPressure(nodeData.pressure_kPa * 1000)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Temperature</p>
                      <p className="text-lg font-semibold">{formatTemperature(nodeData.temperature_K)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Velocity</p>
                      <p className="text-lg font-semibold">{formatVelocity(nodeData.velocity_m_s)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Density</p>
                      <p className="text-lg font-semibold">{nodeData.density_kg_m3.toFixed(1)} kg/m³</p>
                    </div>
                  </div>

                  {nodeData.warnings.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-orange-600">Warnings:</p>
                      <ul className="space-y-1">
                        {nodeData.warnings.map((warning, index) => (
                          <li key={index} className="text-sm text-orange-600 flex items-center gap-2">
                            <AlertTriangle className="h-3 w-3" />
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Flow Rate:</p>
                    <p className="text-sm">{nodeData.q_actual_m3_s.toFixed(3)} m³/s</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Mass Flow:</p>
                    <p className="text-sm">{nodeData.mdot_kg_s.toFixed(2)} kg/s</p>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProcessFlowDiagram;
