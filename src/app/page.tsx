import Image from 'next/image';
import { ElementCard } from '@/components/landing/ElementCard';
import { StepCard } from '@/components/landing/StepCard';

const elements = [
  { code: 'FB', name: 'Fretboard', description: 'Navigate the neck and find chords in any key' },
  { code: 'HM', name: 'Harmony', description: 'Understand chord relationships and progressions' },
  { code: 'ML', name: 'Melody', description: 'Play fills, lead lines, and melodic passages' },
  { code: 'RH', name: 'Rhythm', description: 'Keep time and play with rhythmic variety' },
  { code: 'TO', name: 'Tone', description: 'Shape your sound with gear and technique' },
  { code: 'TH', name: 'Theory', description: 'Understand keys, scales, and musical structure' },
  { code: 'TE', name: 'Technique', description: 'Execute picking, strumming, and fingering cleanly' },
  { code: 'AU', name: 'Aural', description: 'Identify chords, intervals, and progressions by ear' },
];

const steps = [
  { number: '01', title: 'Answer 16 Questions', description: 'Real-world worship scenarios that reveal your true skill level across 8 dimensions.' },
  { number: '02', title: 'Get Your Worship Wheel', description: 'See your personalised radar chart showing your strengths and growth areas at a glance.' },
  { number: '03', title: 'Receive Your Action Plan', description: 'Get tailored recommendations and next steps to level up where it matters most.' },
];

export default function Home() {
  return (
    <main>
      {/* Navbar */}
      <nav className="flex items-center justify-center px-space-8 py-space-1 bg-neutral-0">
        <Image
          src="/logo.svg"
          alt="Worship Guitar Skills"
          width={62}
          height={62}
          priority
        />
      </nav>

      {/* Hero Section */}
      <section className="relative flex min-h-[900px] flex-col items-center justify-center gap-space-6 px-site-margin py-section-lg text-center max-md:min-h-[auto] max-md:py-section-md">
        {/* Background image + overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-bg.webp"
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-neutral-950/60" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-space-6">
          <span className="text-text-sm font-bold uppercase tracking-[0.2em] text-accent-500">
            Free Worship Guitar Assessment
          </span>
          <h1 className="max-w-[30ch] text-h1 font-bold leading-none [text-wrap:balance]">
            Discover Your Worship{'\n'}Guitar Strengths
          </h1>
          <p className="max-w-[630px] text-text-lg text-theme-text-muted">
            Take the Worship Wheel assessment and get a personalised breakdown of
            your skills across 8 essential musical dimensions.
          </p>
          <a
            href="/assessment"
            className="inline-flex items-center justify-center rounded-sm bg-btn-primary px-space-6 py-space-3 text-text-lg font-bold text-btn-primary-text hover:bg-btn-primary-hover hover:text-btn-primary-hover-text transition-colors cursor-pointer"
          >
            Start the Assessment →
          </a>
          <span className="text-text-sm font-bold text-theme-text-muted">
            5 minutes · 16 questions · Completely free
          </span>
        </div>
      </section>

      {/* Measure Yourself Across 8 Dimensions */}
      <section className="flex flex-col items-center gap-space-8 px-site-margin py-section-md bg-[radial-gradient(ellipse_at_center,_#423923_0%,_#262216_45%,_#100f0e_100%)]">
        <h2 className="text-h4 font-bold text-center">
          Measure Yourself Across 8 Dimensions
        </h2>
        <div className="grid w-full max-w-[1344px] grid-cols-4 gap-space-5 max-md:grid-cols-2 max-sm:grid-cols-1">
          {elements.map((el, i) => (
            <ElementCard key={el.code} {...el} index={i + 1} />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="relative flex flex-col items-center gap-space-5 px-site-margin py-section-sm text-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/how-it-works-bg.webp"
            alt=""
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-neutral-950/50" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-space-5 w-full">
          <h2 className="text-h4 font-bold">How It Works</h2>
          <div className="flex w-full max-w-[1344px] gap-space-5 max-md:flex-col">
            {steps.map((step, i) => (
              <StepCard key={step.number} {...step} index={i + 1} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="flex flex-col items-center gap-space-6 px-site-margin py-section-md text-center bg-gradient-to-b from-neutral-950 to-neutral-800">
        <h2 className="text-h3 font-bold">
          Ready to Find Out Where You Stand?
        </h2>
        <p className="max-w-[655px] text-text-lg text-theme-text-muted">
          Join thousands of worship guitarists who have already discovered their
          strengths and started levelling up their playing.
        </p>
        <a
          href="/assessment"
          className="inline-flex items-center justify-center rounded-sm bg-btn-primary px-space-6 py-space-3 text-text-lg font-bold text-btn-primary-text hover:bg-btn-primary-hover hover:text-btn-primary-hover-text transition-colors cursor-pointer"
        >
          Start the Assessment →
        </a>
        <span className="text-text-sm text-theme-text-muted">
          Free · No login required · Results in 5 minutes
        </span>
      </section>
    </main>
  );
}
