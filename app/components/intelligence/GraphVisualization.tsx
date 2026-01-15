/**
 * Graph Visualization Component
 * Interactive visualization of decision graph (North, Vectors, Pivots, Kinetics)
 */

import { useEffect, useRef, useState } from 'react';
import styles from './GraphVisualization.module.css';

export interface GraphNode {
    id: string;
    type: 'north' | 'bound' | 'vector' | 'pivot' | 'kinetic';
    label: string;
    description: string;
    confidence?: number;
    createdAt: string;
    x?: number;
    y?: number;
}

export interface GraphEdge {
    from: string;
    to: string;
    type: 'defines' | 'constrains' | 'suggests' | 'decides' | 'acts';
}

export interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

export interface GraphVisualizationProps {
    data: GraphData;
    onNodeClick?: (node: GraphNode) => void;
    onClose: () => void;
}

export function GraphVisualization({ data, onNodeClick, onClose }: GraphVisualizationProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply transformations
        ctx.save();
        ctx.translate(pan.x, pan.y);
        ctx.scale(zoom, zoom);

        // Draw edges
        data.edges.forEach((edge) => {
            const fromNode = data.nodes.find((n) => n.id === edge.from);
            const toNode = data.nodes.find((n) => n.id === edge.to);

            if (fromNode && toNode) {
                drawEdge(ctx, fromNode, toNode, edge.type);
            }
        });

        // Draw nodes
        data.nodes.forEach((node) => {
            drawNode(ctx, node, node.id === selectedNode?.id);
        });

        ctx.restore();
    }, [data, selectedNode, zoom, pan]);

    const drawNode = (ctx: CanvasRenderingContext2D, node: GraphNode, selected: boolean) => {
        const x = node.x || 0;
        const y = node.y || 0;
        const radius = getNodeRadius(node.type);
        const color = getNodeColor(node.type);

        // Draw node circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        if (selected) {
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Draw label
        ctx.fillStyle = '#1f2937';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, x, y + radius + 15);
    };

    const drawEdge = (
        ctx: CanvasRenderingContext2D,
        from: GraphNode,
        to: GraphNode,
        type: string,
    ) => {
        const x1 = from.x || 0;
        const y1 = from.y || 0;
        const x2 = to.x || 0;
        const y2 = to.y || 0;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = getEdgeColor(type);
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw arrow
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowSize = 10;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(
            x2 - arrowSize * Math.cos(angle - Math.PI / 6),
            y2 - arrowSize * Math.sin(angle - Math.PI / 6),
        );
        ctx.lineTo(
            x2 - arrowSize * Math.cos(angle + Math.PI / 6),
            y2 - arrowSize * Math.sin(angle + Math.PI / 6),
        );
        ctx.closePath();
        ctx.fillStyle = getEdgeColor(type);
        ctx.fill();
    };

    const getNodeRadius = (type: string): number => {
        switch (type) {
            case 'north':
                return 30;
            case 'vector':
                return 25;
            case 'pivot':
                return 20;
            case 'kinetic':
                return 15;
            case 'bound':
                return 18;
            default:
                return 20;
        }
    };

    const getNodeColor = (type: string): string => {
        switch (type) {
            case 'north':
                return '#3b82f6';
            case 'vector':
                return '#8b5cf6';
            case 'pivot':
                return '#10b981';
            case 'kinetic':
                return '#f59e0b';
            case 'bound':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    const getEdgeColor = (type: string): string => {
        switch (type) {
            case 'defines':
                return '#3b82f6';
            case 'constrains':
                return '#ef4444';
            case 'suggests':
                return '#8b5cf6';
            case 'decides':
                return '#10b981';
            case 'acts':
                return '#f59e0b';
            default:
                return '#9ca3af';
        }
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - pan.x) / zoom;
        const y = (e.clientY - rect.top - pan.y) / zoom;

        // Find clicked node
        const clickedNode = data.nodes.find((node) => {
            const nx = node.x || 0;
            const ny = node.y || 0;
            const radius = getNodeRadius(node.type);
            const distance = Math.sqrt((x - nx) ** 2 + (y - ny) ** 2);
            return distance <= radius;
        });

        if (clickedNode) {
            setSelectedNode(clickedNode);
            onNodeClick?.(clickedNode);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>Decision Map</h3>
                <div className={styles.controls}>
                    <button onClick={() => setZoom(Math.min(zoom + 0.1, 2))}>+</button>
                    <button onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))}>-</button>
                    <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Reset</button>
                    <button onClick={onClose}>×</button>
                </div>
            </div>

            <canvas
                ref={canvasRef}
                className={styles.canvas}
                onClick={handleCanvasClick}
            />

            {selectedNode && (
                <div className={styles.nodeDetails}>
                    <h4>{selectedNode.label}</h4>
                    <p className={styles.nodeType}>{selectedNode.type}</p>
                    <p>{selectedNode.description}</p>
                    {selectedNode.confidence && (
                        <p className={styles.confidence}>Confidence: {selectedNode.confidence}%</p>
                    )}
                    <p className={styles.date}>
                        Created: {new Date(selectedNode.createdAt).toLocaleDateString()}
                    </p>
                </div>
            )}

            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <div className={styles.legendColor} style={{ background: '#3b82f6' }} />
                    <span>North (Goal)</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.legendColor} style={{ background: '#ef4444' }} />
                    <span>Bounds (Constraints)</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.legendColor} style={{ background: '#8b5cf6' }} />
                    <span>Vectors (Paths)</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.legendColor} style={{ background: '#10b981' }} />
                    <span>Pivots (Decisions)</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.legendColor} style={{ background: '#f59e0b' }} />
                    <span>Kinetics (Actions)</span>
                </div>
            </div>
        </div>
    );
}
