import { AnimateOnScroll } from '@/components/shared/AnimateOnScroll';

interface StepCardProps {
  number: string;
  title: string;
  description: string;
  index: number;
}

export function StepCard({ number, title, description, index }: StepCardProps) {
  return (
    <AnimateOnScroll stagger={index} className="flex-1">
      <div className="flex flex-col items-center gap-space-3 text-center">
        <span className="inline-flex items-center justify-center rounded-sm bg-accent-500 px-space-3 py-space-2 text-h5 font-bold text-neutral-950">
          {number}
        </span>
        <h3 className="text-h5 font-bold">{title}</h3>
        <p className="text-text-base text-theme-text-muted">
          {description}
        </p>
      </div>
    </AnimateOnScroll>
  );
}
