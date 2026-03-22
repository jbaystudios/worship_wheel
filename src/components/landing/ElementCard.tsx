import { ElementIcon } from './ElementIcon';
import { AnimateOnScroll } from '@/components/shared/AnimateOnScroll';

interface ElementCardProps {
  code: string;
  name: string;
  description: string;
  index: number;
}

export function ElementCard({ code, name, description, index }: ElementCardProps) {
  return (
    <AnimateOnScroll stagger={index}>
      <div className="flex flex-col gap-space-2 rounded-md border border-accent-500 bg-neutral-950 p-space-5">
        <ElementIcon code={code} />
        <h3 className="text-h6 font-bold">{name}</h3>
        <p className="text-text-sm text-theme-text-muted">
          {description}
        </p>
      </div>
    </AnimateOnScroll>
  );
}
