'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  PanOnScrollMode,
  MarkerType,
  useNodesState,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ConfigFrameNode } from './nodes/ConfigFrameNode';
import { HeroFrameNode } from './nodes/HeroFrameNode';
import { NoteNode } from './nodes/NoteNode';
import { VARIANTS, type Variant } from './demoConfig';

const nodeTypes = {
  config: ConfigFrameNode,
  hero: HeroFrameNode,
  note: NoteNode,
};

function accentFor(v: Variant): 'neutral' | 'instagram' | 'campaign' {
  if (v.campaignKey) return 'campaign';
  if (v.sourceKey) return 'instagram';
  return 'neutral';
}

// Default frame layout. Spotlight (region A) nodes carry the toggled variant.
function buildNodes(spot: Variant): Node[] {
  return [
    // ── Region A — interactive spotlight ──────────────────────────────
    {
      id: 'note-intro',
      type: 'note',
      position: { x: -470, y: 20 },
      data: {
        kicker: 'Live demo',
        title: 'One landing page. The URL decides what it says.',
        body: 'Flip the toggle (top-left). The same page swaps its headline, copy and image based on the UTM params — driven by config, not a separate page.',
      },
    },
    {
      id: 'spot-config',
      type: 'config',
      position: { x: 0, y: 0 },
      data: { variant: spot, title: 'Resolved config', accent: accentFor(spot) },
    },
    {
      id: 'spot-hero',
      type: 'hero',
      position: { x: -170, y: 540 },
      data: { variant: spot, title: 'Landing hero', accent: accentFor(spot) },
    },

    // ── Region B — static three-up cascade map ────────────────────────
    {
      id: 'note-cascade',
      type: 'note',
      position: { x: -470, y: 1240 },
      data: {
        kicker: 'The cascade',
        title: 'Most-specific wins, field by field.',
        body: 'global default  ←  source (instagram)  ←  campaign (worship-wheel-1). Each tier overrides only what it needs; everything else is inherited.',
      },
    },
    ...VARIANTS.flatMap((v, i): Node[] => {
      const colX = i * 920;
      const titles = ['1 · No params', '2 · Instagram source', '3 · Instagram + campaign'];
      return [
        {
          id: `b-cfg-${i}`,
          type: 'config',
          position: { x: colX, y: 1240 },
          data: { variant: v, title: titles[i], accent: accentFor(v) },
        },
        {
          id: `b-hero-${i}`,
          type: 'hero',
          position: { x: colX - 170, y: 1760 },
          data: { variant: v, title: 'Hero', accent: accentFor(v) },
        },
      ];
    }),
  ];
}

// Persist the user's frame arrangement so spacing tweaks survive reloads.
const POSITIONS_KEY = 'ww-canvas-positions-v1';

function loadPositions(): Record<string, { x: number; y: number }> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(POSITIONS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function savePositions(nodes: Node[]) {
  if (typeof window === 'undefined') return;
  const map: Record<string, { x: number; y: number }> = {};
  nodes.forEach((n) => {
    map[n.id] = n.position;
  });
  try {
    window.localStorage.setItem(POSITIONS_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

const arrow = { type: MarkerType.ArrowClosed, width: 18, height: 18, color: '#a78bfa' };
const edgeBase = {
  type: 'smoothstep' as const,
  markerEnd: arrow,
  style: { stroke: '#a78bfa', strokeWidth: 2 },
  labelStyle: { fill: '#e5e7eb', fontSize: 12, fontWeight: 600 },
  labelBgStyle: { fill: '#1f2937' },
  labelBgPadding: [6, 3] as [number, number],
  labelBgBorderRadius: 4,
};

export function CanvasBoard() {
  const [spotId, setSpotId] = useState<string>('ww1');
  const spot = VARIANTS.find((v) => v.id === spotId) ?? VARIANTS[0];

  // SSR-safe initial layout (no localStorage on the server).
  const [nodes, setNodes, onNodesChange] = useNodesState(buildNodes(spot));

  // After mount, restore any saved arrangement.
  useEffect(() => {
    const saved = loadPositions();
    if (saved) {
      setNodes((nds) =>
        nds.map((n) => (saved[n.id] ? { ...n, position: saved[n.id] } : n))
      );
    }
  }, [setNodes]);

  // Toggle swaps the spotlight variant — update data only, keep positions.
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === 'spot-config' || n.id === 'spot-hero'
          ? { ...n, data: { ...n.data, variant: spot, accent: accentFor(spot) } }
          : n
      )
    );
  }, [spot, setNodes]);

  const persist = useCallback((_: unknown, __: Node, ___?: Node[]) => {
    setNodes((nds) => {
      savePositions(nds);
      return nds;
    });
  }, [setNodes]);

  const resetLayout = useCallback(() => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(POSITIONS_KEY);
    setNodes(buildNodes(spot));
  }, [spot, setNodes]);

  const edges = useMemo<Edge[]>(
    () => [
      // Region A vertical
      {
        id: 'a-resolve',
        source: 'spot-config',
        sourceHandle: 'down',
        target: 'spot-hero',
        targetHandle: 'up',
        label: 'resolves to',
        animated: true,
        ...edgeBase,
      },
      // Region B cascade (horizontal)
      {
        id: 'b-cascade-1',
        source: 'b-cfg-0',
        sourceHandle: 'out',
        target: 'b-cfg-1',
        targetHandle: 'in',
        label: '+ source override',
        ...edgeBase,
      },
      {
        id: 'b-cascade-2',
        source: 'b-cfg-1',
        sourceHandle: 'out',
        target: 'b-cfg-2',
        targetHandle: 'in',
        label: '+ campaign override',
        ...edgeBase,
      },
      // Region B vertical (config → hero per column)
      ...VARIANTS.map((_, i) => ({
        id: `b-resolve-${i}`,
        source: `b-cfg-${i}`,
        sourceHandle: 'down',
        target: `b-hero-${i}`,
        targetHandle: 'up',
        label: 'resolves to',
        ...edgeBase,
      })),
    ],
    []
  );

  return (
    <div className="h-screen w-screen bg-neutral-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onNodeDragStop={persist}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.1}
        maxZoom={2.5}
        // Figma-style navigation: scroll pans, Cmd/Ctrl+scroll (or pinch) zooms
        panOnScroll
        panOnScrollMode={PanOnScrollMode.Free}
        zoomOnScroll={false}
        zoomOnPinch
        zoomActivationKeyCode={['Meta', 'Control']}
        panOnDrag
        zoomOnDoubleClick={false}
        // Frames are draggable; arrangement is saved to localStorage on drop.
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={1} color="#2a2a2a" />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable className="!bg-neutral-900" maskColor="rgba(0,0,0,0.6)" />

        <Panel position="top-left">
          <div className="rounded-md border border-neutral-700 bg-neutral-900/95 p-space-3 shadow-xl backdrop-blur">
            <div className="mb-space-2 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
              Live demo · pick a URL
            </div>
            <div className="flex flex-col gap-1.5">
              {VARIANTS.map((v) => {
                const active = v.id === spotId;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSpotId(v.id)}
                    className={`cursor-pointer rounded-sm px-space-3 py-space-2 text-left font-mono text-[11px] transition-colors ${
                      active
                        ? 'bg-accent-500 text-neutral-950'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    {v.tab}
                  </button>
                );
              })}
            </div>
            <div className="mt-space-2 flex items-center justify-between gap-space-2 border-t border-neutral-800 pt-space-2">
              <span className="text-[10px] text-neutral-500">
                Cmd/Ctrl + scroll = zoom · drag frames to arrange
              </span>
              <button
                onClick={resetLayout}
                className="cursor-pointer rounded-sm px-1.5 py-0.5 text-[10px] font-bold text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
                title="Reset all frames to the default layout"
              >
                Reset layout
              </button>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
