import { type NodeProps } from '@xyflow/react';

export type NoteData = {
  kicker?: string;
  title: string;
  body: string;
};

export function NoteNode({ data }: NodeProps) {
  const { kicker, title, body } = data as NoteData;
  return (
    <div className="w-[360px] rounded-md border border-neutral-700 bg-neutral-950/80 p-space-5 shadow-xl backdrop-blur">
      {kicker && (
        <span className="text-text-sm font-bold uppercase tracking-[0.2em] text-accent-500">
          {kicker}
        </span>
      )}
      <h3 className="mt-space-2 text-h5 font-bold leading-tight text-neutral-50">
        {title}
      </h3>
      <p className="mt-space-3 text-text-base leading-relaxed text-neutral-300">
        {body}
      </p>
    </div>
  );
}
