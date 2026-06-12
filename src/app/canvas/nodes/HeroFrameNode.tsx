import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Frame } from './Frame';
import { HeroMock } from '../HeroMock';
import { resolveHero, type Variant } from '../demoConfig';

export type HeroFrameData = {
  variant: Variant;
  title: string;
  accent?: 'neutral' | 'instagram' | 'campaign';
};

export function HeroFrameNode({ data }: NodeProps) {
  const { variant, title, accent = 'neutral' } = data as HeroFrameData;
  const { config } = resolveHero(variant);

  return (
    <div className="w-[760px]">
      <Handle type="target" position={Position.Top} id="up" className="!opacity-0" />
      <Handle type="target" position={Position.Left} id="in" className="!opacity-0" />
      <Frame title={title} badge="live render" accent={accent} bodyClassName="">
        {/* key forces a remount on swap so the content fades in */}
        <div key={variant.id} className="canvas-fade">
          <HeroMock config={config} />
        </div>
      </Frame>
    </div>
  );
}
