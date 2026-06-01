import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Maximize2, ZoomIn, ZoomOut, Layers, Database } from 'lucide-react';
import { BTreeNode, BTreeSnapshot } from '../types/btree';

interface TreeViewProps {
  currentStepData: BTreeSnapshot | null;
  onNodeClick: (node: BTreeNode) => void;
}

interface VisualNode {
  id: string;
  keys: number[];
  isLeaf: boolean;
  x: number; // left edge of node rect
  y: number; // top edge of node rect
  width: number;
  height: number;
  nodeRef: BTreeNode;
}

interface VisualLink {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  childIndex: number;
  fromNodeId: string;
  toNodeId: string;
}

export const TreeView: React.FC<TreeViewProps> = ({ currentStepData, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [panOffset, setPanOffset] = useState({ x: 400, y: 60 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredKey, setHoveredKey] = useState<{ nodeId: string; keyIndex: number } | null>(null);
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<BTreeNode | null>(null);

  const tree = currentStepData?.tree || null;
  const activeNodeId = currentStepData?.activeNodeId || null;
  const activeKeyIndex = currentStepData?.activeKeyIndex || null;
  const highlightedNodeIds = currentStepData?.highlightedNodeIds || [];

  const CELL_WIDTH = 42;
  const CELL_HEIGHT = 36;
  const NODE_PADDING = 12; // Left/Right extra padding inside node card

  // Calculate node dimensions
  const getNodeWidth = (keysCount: number) => {
    const slots = Math.max(1, keysCount);
    return slots * CELL_WIDTH + NODE_PADDING * 2;
  };

  // 1. Layout Calculation Engine: Post-order DFS to compute subtree widths
  const layoutData = useMemo(() => {
    if (!tree) return { nodes: [], links: [] };

    const subtreeWidths = new Map<string, number>();

    const calculateWidths = (node: BTreeNode): number => {
      const nodeW = getNodeWidth(node.keys.length);
      if (node.isLeaf) {
        subtreeWidths.set(node.id, nodeW);
        return nodeW;
      }

      let childrenWidth = 0;
      node.children.forEach((child) => {
        childrenWidth += calculateWidths(child);
      });
      
      const gaps = (node.children.length - 1) * 32; // Horizontal gap between subtrees
      const totalSubtreeW = childrenWidth + gaps;
      
      // Subtree width must be at least the node's own width
      const finalW = Math.max(nodeW, totalSubtreeW);
      subtreeWidths.set(node.id, finalW);
      return finalW;
    };

    calculateWidths(tree);

    const visualNodes: VisualNode[] = [];
    const visualLinks: VisualLink[] = [];

    // 2. Coordinate Assignment: Pre-order DFS to place nodes at exact x, y coordinates
    const assignCoords = (
      node: BTreeNode,
      x: number, // Horizontal center of this subtree
      y: number, // Vertical top of this node
      depth: number
    ) => {
      const nodeW = getNodeWidth(node.keys.length);
      const nodeH = CELL_HEIGHT;

      // Store node details
      visualNodes.push({
        id: node.id,
        keys: node.keys,
        isLeaf: node.isLeaf,
        x: x - nodeW / 2,
        y,
        width: nodeW,
        height: nodeH,
        nodeRef: node,
      });

      if (!node.isLeaf && node.children.length > 0) {
        // Calculate left edge of children subtrees
        let totalChildrenW = 0;
        node.children.forEach((child) => {
          totalChildrenW += subtreeWidths.get(child.id) || 0;
        });
        const gaps = (node.children.length - 1) * 32;
        let startX = x - (totalChildrenW + gaps) / 2;

        node.children.forEach((child, i) => {
          const childW = subtreeWidths.get(child.id) || 0;
          const childCenterX = startX + childW / 2;
          const childY = y + 100; // 100px vertical separation

          assignCoords(child, childCenterX, childY, depth + 1);

          // Link starts from corresponding child slot of parent
          // Slot points are exactly aligned under the key separators
          const parentLeft = x - nodeW / 2;
          // The ith slot starts after i keys:
          // X = parentLeft + padding + i * CELL_WIDTH
          // Let's position it at the bottom boundary of parent
          const fromX = parentLeft + NODE_PADDING + i * CELL_WIDTH;
          const fromY = y + nodeH;

          // The link goes to the center-top of the child node
          const toX = childCenterX;
          const toY = childY;

          visualLinks.push({
            id: `${node.id}-to-${child.id}`,
            fromX,
            fromY,
            toX,
            toY,
            childIndex: i,
            fromNodeId: node.id,
            toNodeId: child.id,
          });

          startX += childW + 32;
        });
      }
    };

    const rootSubtreeW = subtreeWidths.get(tree.id) || 0;
    assignCoords(tree, rootSubtreeW / 2, 0, 0);

    return { nodes: visualNodes, links: visualLinks };
  }, [tree]);

  // Auto center tree on load or tree changes
  const autoCenter = () => {
    if (layoutData.nodes.length === 0) return;
    
    // Find bounding box of nodes
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    layoutData.nodes.forEach((n) => {
      minX = Math.min(minX, n.x);
      maxX = Math.max(maxX, n.x + n.width);
      minY = Math.min(minY, n.y);
      maxY = Math.max(maxY, n.y + n.height);
    });

    const treeWidth = maxX - minX;
    const treeHeight = maxY - minY;

    // Set offset centered on the canvas
    const canvasElement = svgRef.current?.parentElement;
    if (canvasElement) {
      const cWidth = canvasElement.clientWidth;
      const cHeight = canvasElement.clientHeight;
      
      // Determine ideal scale
      const scaleX = (cWidth * 0.8) / Math.max(100, treeWidth);
      const scaleY = (cHeight * 0.8) / Math.max(100, treeHeight);
      const newScale = Math.max(0.4, Math.min(1.2, Math.min(scaleX, scaleY)));
      
      setZoomLevel(newScale);
      setPanOffset({
        x: cWidth / 2 - (minX + treeWidth / 2) * newScale,
        y: 50,
      });
    }
  };

  useEffect(() => {
    autoCenter();
  }, [tree]);

  // Mouse Dragging handlers for Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel handlers for Zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleChange = e.deltaY < 0 ? 1.08 : 0.92;
    const newScale = Math.max(0.25, Math.min(2.5, zoomLevel * scaleChange));
    
    // Zoom centered on mouse cursor location inside SVG
    const svg = svgRef.current;
    if (svg) {
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Compute new panOffset to keep mouse cursor stationary
      const sRatio = newScale / zoomLevel;
      setPanOffset((prev) => ({
        x: mouseX - (mouseX - prev.x) * sRatio,
        y: mouseY - (mouseY - prev.y) * sRatio,
      }));
      setZoomLevel(newScale);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(2.5, prev * 1.15));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(0.25, prev * 0.85));
  };

  return (
    <div className="relative w-full h-[520px] bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden select-none shadow-inner">
      
      {/* Animated Dots Background Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.025]" 
        style={{
          backgroundImage: `radial-gradient(#cffafe 1.5px, transparent 1.5px)`,
          backgroundSize: '24px 24px',
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: '0 0',
        }}
      />

      {/* SVG Canvas Area */}
      <div
        className={`w-full h-full overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {layoutData.nodes.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
            <Database className="w-10 h-10 text-slate-700 mb-2 animate-pulse" />
            <span className="text-xs font-mono">Tree empty. Load keys or select random template.</span>
          </div>
        ) : (
          <svg
            ref={svgRef}
            className="w-full h-full"
          >
            {/* Gradients definitions for premium neon glow lines */}
            <defs>
              <linearGradient id="active-glow-link" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="1" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="neutral-link" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#334155" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#1e293b" stopOpacity="0.8" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Main viewport group responding to Zoom & Pan */}
            <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}>
              
              {/* 1. Render Connections (Links) */}
              <g>
                {layoutData.links.map((link) => {
                  // Is this link connecting nodes that are currently active or highlighted?
                  const isActiveLink = 
                    (link.fromNodeId === activeNodeId || highlightedNodeIds.includes(link.fromNodeId)) &&
                    (link.toNodeId === activeNodeId || highlightedNodeIds.includes(link.toNodeId));
                  
                  // Draw a cubic-bezier curve or straight lines
                  const dy = link.toY - link.fromY;
                  // Control points for beautiful smooth curve paths
                  const cp1Y = link.fromY + dy * 0.4;
                  const cp2Y = link.toY - dy * 0.4;
                  const pathData = `M ${link.fromX} ${link.fromY} C ${link.fromX} ${cp1Y}, ${link.toX} ${cp2Y}, ${link.toX} ${link.toY}`;

                  return (
                    <g key={link.id}>
                      {/* Thick glowing background path if active */}
                      {isActiveLink && (
                        <path
                          d={pathData}
                          fill="none"
                          stroke="#06b6d4"
                          strokeWidth="5.5"
                          strokeOpacity="0.3"
                          filter="url(#glow)"
                          className="animate-pulse"
                        />
                      )}

                      {/* Primary connection line */}
                      <path
                        d={pathData}
                        fill="none"
                        stroke={isActiveLink ? "url(#active-glow-link)" : "url(#neutral-link)"}
                        strokeWidth={isActiveLink ? "2.5" : "1.5"}
                        strokeDasharray="none"
                        className="transition-all duration-500"
                      />

                      {/* Cute bubble point on parent node where link originates */}
                      <circle
                        cx={link.fromX}
                        cy={link.fromY}
                        r={isActiveLink ? 3.5 : 2.5}
                        fill={isActiveLink ? "#06b6d4" : "#475569"}
                      />
                    </g>
                  );
                })}
              </g>

              {/* 2. Render Nodes */}
              <g>
                {layoutData.nodes.map((vNode) => {
                  const isActive = vNode.id === activeNodeId;
                  const isHighlighted = highlightedNodeIds.includes(vNode.id);

                  // Border glow style
                  let borderStrokeColor = '#334155'; // default border
                  let borderStrokeWidth = '1.5';

                  if (isActive) {
                    borderStrokeColor = '#06b6d4'; // active neon cyan
                    borderStrokeWidth = '2.5';
                  } else if (isHighlighted) {
                    borderStrokeColor = '#eab308'; // rebalance yellow
                    borderStrokeWidth = '2.5';
                  }

                  return (
                    <g
                      key={vNode.id}
                      transform={`translate(${vNode.x}, ${vNode.y})`}
                      className="cursor-pointer group"
                      onClick={() => {
                        onNodeClick(vNode.nodeRef);
                        setSelectedNodeDetails(vNode.nodeRef);
                      }}
                    >
                      {/* Thick Outer Glowing node boundary */}
                      <rect
                        x="0"
                        y="0"
                        width={vNode.width}
                        height={vNode.height}
                        rx="10"
                        fill="#0f172a"
                        stroke={borderStrokeColor}
                        strokeWidth={borderStrokeWidth}
                        filter={isActive || isHighlighted ? "url(#glow)" : "none"}
                        className="transition-all duration-300"
                        opacity={isActive || isHighlighted ? 0.15 : 0}
                      />

                      {/* Actual card rectangle */}
                      <rect
                        x="0"
                        y="0"
                        width={vNode.width}
                        height={vNode.height}
                        rx="10"
                        fill="#0f172a"
                        stroke={borderStrokeColor}
                        strokeWidth={borderStrokeWidth}
                        className="transition-all duration-300 shadow-2xl"
                      />

                      {/* Render key cells */}
                      {vNode.keys.map((key, kIdx) => {
                        // Highlight if this specific key cell is currently active
                        const isKeyActive = isActive && kIdx === activeKeyIndex;
                        const cellX = NODE_PADDING + kIdx * CELL_WIDTH;

                        return (
                          <g
                            key={kIdx}
                            onMouseEnter={() => setHoveredKey({ nodeId: vNode.id, keyIndex: kIdx })}
                            onMouseLeave={() => setHoveredKey(null)}
                          >
                            {/* Cell Background */}
                            <rect
                              x={cellX}
                              y="4"
                              width={CELL_WIDTH - 4}
                              height={CELL_HEIGHT - 8}
                              rx="6"
                              className={`transition-all duration-300 ${
                                isKeyActive
                                  ? 'fill-cyan-500/20 stroke-cyan-400/50'
                                  : 'fill-slate-900 stroke-slate-800 hover:stroke-slate-700'
                              }`}
                              strokeWidth="1.2"
                            />

                            {/* Cell Key Label */}
                            <text
                              x={cellX + (CELL_WIDTH - 4) / 2}
                              y={CELL_HEIGHT / 2 + 2}
                              textAnchor="middle"
                              className={`font-mono text-[12px] font-black tracking-tight ${
                                isKeyActive ? 'fill-cyan-300' : 'fill-slate-200'
                              }`}
                            >
                              {key}
                            </text>

                            {/* Hover Tooltip detailing array indexes */}
                            {hoveredKey?.nodeId === vNode.id && hoveredKey?.keyIndex === kIdx && (
                              <g transform={`translate(${cellX}, -24)`} className="pointer-events-none">
                                <rect
                                  x="-10"
                                  y="0"
                                  width={CELL_WIDTH + 16}
                                  height="18"
                                  rx="4"
                                  fill="#020617"
                                  stroke="#475569"
                                  strokeWidth="1"
                                />
                                <text
                                  x={CELL_WIDTH / 2 - 2}
                                  y="12"
                                  textAnchor="middle"
                                  className="fill-slate-400 font-mono text-[9px]"
                                >
                                  idx [{kIdx}]
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}

                      {/* Empty indicator if node has no keys (e.g. initial empty leaf root) */}
                      {vNode.keys.length === 0 && (
                        <text
                          x={vNode.width / 2}
                          y={CELL_HEIGHT / 2 + 4}
                          textAnchor="middle"
                          className="fill-slate-600 font-mono text-[9.5px] uppercase tracking-wider"
                        >
                          EMPTY PAGE
                        </text>
                      )}

                      {/* Leaf / Internal tiny badge mark */}
                      <circle
                        cx={NODE_PADDING / 2}
                        cy={CELL_HEIGHT / 2}
                        r="3"
                        className={vNode.isLeaf ? "fill-emerald-500" : "fill-purple-500"}
                      >
                        <title>{vNode.isLeaf ? "Leaf Node" : "Internal Node"}</title>
                      </circle>
                    </g>
                  );
                })}
              </g>

            </g>
          </svg>
        )}
      </div>

      {/* Canvas HUD Overlays / Controls */}
      <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-1">
        <span className="px-3 py-1 bg-slate-900/90 text-[10px] font-mono text-slate-300 border border-slate-800 rounded-lg flex items-center gap-1.5 backdrop-blur shadow">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>DRAG TO PAN // SCROLL TO ZOOM</span>
        </span>
      </div>

      {/* Active Node click detailed modal panel inside canvas */}
      {selectedNodeDetails && (
        <div className="absolute bottom-4 left-4 max-w-xs bg-slate-900/95 border border-slate-800 rounded-xl p-3.5 backdrop-blur text-[10.5px] space-y-2 text-slate-300 shadow-lg animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-[9.5px] uppercase text-cyan-400">NODE EXPLORER</span>
            <button
              onClick={() => setSelectedNodeDetails(null)}
              className="text-slate-500 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1 font-mono">
            <div><span className="text-slate-500">ID:</span> <span className="text-slate-200">{selectedNodeDetails.id}</span></div>
            <div><span className="text-slate-500">TYPE:</span> <span className={selectedNodeDetails.isLeaf ? 'text-emerald-400' : 'text-purple-400'}>{selectedNodeDetails.isLeaf ? 'LEAF PAGE' : 'INTERNAL INDEX'}</span></div>
            <div><span className="text-slate-500">KEYS:</span> <span className="text-slate-200 font-semibold">[{selectedNodeDetails.keys.join(', ')}]</span></div>
            <div><span className="text-slate-500">SUB-PAGES:</span> <span className="text-slate-200">{selectedNodeDetails.children.length} links</span></div>
          </div>
        </div>
      )}

      {/* Viewport Action HUD Buttons */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        <button
          onClick={handleZoomIn}
          className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition-all cursor-pointer shadow"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition-all cursor-pointer shadow"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={autoCenter}
          className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition-all cursor-pointer shadow"
          title="Auto Center Tree View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
