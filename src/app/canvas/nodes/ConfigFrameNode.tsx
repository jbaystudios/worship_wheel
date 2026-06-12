import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Frame } from './Frame';
import {
  HERO_FIELDS,
  resolveHero,
  resolveKeap,
  type Variant,
  type Tier,
  type HeroConfig,
} from '../demoConfig';

const TIER_STYLE: Record<Tier, { dot: string; label: string; row: string }> = {
  default: { dot: 'bg-neutral-500', label: 'default', row: 'text-neutral-400' },
  source: {
    dot: 'bg-accent-500',
    label: 'source',
    row: 'text-accent-300 bg-accent-500/10',
  },
  campaign: {
    dot: 'bg-success-500',
    label: 'campaign',
    row: 'text-success-300 bg-success-500/10',
  },
};

export type ConfigFrameData = {
  variant: Variant;
  title: string;
  accent?: 'neutral' | 'instagram' | 'campaign';
};

function shorten(field: keyof HeroConfig, value: string) {
  if (field === 'bgImage') return value;
  return value.length > 46 ? value.slice(0, 44) + '…' : value;
}

export function ConfigFrameNode({ data }: NodeProps) {
  const { variant, title, accent = 'neutral' } = data as ConfigFrameData;
  const { provenance, config } = resolveHero(variant);
  const keap = resolveKeap(variant);

  return (
    <div className="w-[420px]">
      <Handle type="target" position={Position.Left} id="in" className="!opacity-0" />
      <Handle type="source" position={Position.Right} id="out" className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} id="down" className="!opacity-0" />
      <Frame title={title} badge={variant.url} accent={accent} bodyClassName="p-space-4">
        <div className="flex flex-col gap-1.5">
          {HERO_FIELDS.map((field) => {
            const tier = provenance[field];
            const style = TIER_STYLE[tier];
            return (
              <div
                key={field}
                className={`flex items-baseline gap-space-2 rounded-sm px-space-2 py-1 ${style.row}`}
              >
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
                <span className="w-[88px] shrink-0 font-mono text-[11px] text-neutral-500">
                  {field}
                </span>
                <span className="font-mono text-[11px] leading-snug">
                  {shorten(field, config[field])}
                </span>
              </div>
            );
          })}
        </div>

        {/* Keap side of the same params: one Lead Source field + tags by tier */}
        <div className="mt-space-3 rounded-sm border border-neutral-800 bg-neutral-950/60 p-space-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
            <svg viewBox="0 0 24 24" className="h-3 w-3 text-accent-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 7h.01" />
              <path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L3 13V3h10l7.59 7.59a2 2 0 0 1 0 2.82Z" />
            </svg>
            Keap actions
          </div>
          <div className="flex items-baseline gap-space-2 font-mono text-[11px]">
            <span className="w-[88px] shrink-0 text-neutral-500">Lead Source</span>
            <span className="text-neutral-200">{keap.leadSource}</span>
          </div>
          <div className="mt-1 flex items-baseline gap-space-2 font-mono text-[11px]">
            <span className="w-[88px] shrink-0 text-neutral-500">Tags</span>
            <span className="flex flex-wrap gap-1.5">
              {keap.tags.length === 0 ? (
                <span className="text-neutral-600">— none —</span>
              ) : (
                keap.tags.map((t) => (
                  <span
                    key={t.label}
                    className={`rounded-sm px-1.5 py-0.5 text-[10px] ${
                      t.tier === 'source'
                        ? 'bg-accent-500/15 text-accent-300'
                        : 'bg-success-500/15 text-success-300'
                    }`}
                  >
                    {t.label}
                  </span>
                ))
              )}
            </span>
          </div>
        </div>

        <div className="mt-space-3 flex items-center gap-space-3 border-t border-neutral-800 pt-space-2 text-[10px] uppercase tracking-wide text-neutral-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-neutral-500" /> default
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-accent-500" /> source
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-success-500" /> campaign
          </span>
        </div>
      </Frame>
    </div>
  );
}
