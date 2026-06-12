import Image from 'next/image';
import type { HeroConfig } from './demoConfig';

// A faithful, scaled-down render of the REAL hero (src/app/page.tsx),
// parameterised by config so the canvas can show content swapping live.
export function HeroMock({ config }: { config: HeroConfig }) {
  return (
    <section className="relative flex w-[760px] flex-col items-center justify-center gap-space-5 overflow-hidden rounded-sm px-space-6 py-space-7 text-center">
      <div className="absolute inset-0 z-0">
        <Image
          src={config.bgImage}
          alt=""
          fill
          sizes="760px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-neutral-950/60" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-space-5">
        <span className="text-text-sm font-bold uppercase tracking-[0.2em] text-accent-500">
          {config.eyebrow}
        </span>
        <h1 className="max-w-[24ch] text-h3 font-bold leading-none [text-wrap:balance]">
          {config.headline}
        </h1>
        <p className="max-w-[480px] text-text-base text-theme-text-muted">
          {config.subcopy}
        </p>
        <span className="inline-flex items-center justify-center rounded-sm bg-btn-primary px-space-6 py-space-3 text-text-lg font-bold text-btn-primary-text">
          {config.ctaLabel}
        </span>
        <span className="text-text-sm font-bold text-theme-text-muted">
          {config.badge}
        </span>
      </div>
    </section>
  );
}
