# Quickstart: Worship Wheel Assessment Tool

**Feature Branch**: `001-worship-wheel-assessment`
**Date**: 2026-03-06

## Prerequisites

- Node.js 20+ and npm/pnpm
- Vercel account (for deployment)
- Supabase project (for database)
- Keap/Infusionsoft account with REST API access
- CookieBot account
- Google Analytics 4 property + GTM container
- Figma access to the WGS Brand Guide file

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Keap/Infusionsoft
KEAP_CLIENT_ID=xxx
KEAP_CLIENT_SECRET=xxx
KEAP_ACCESS_TOKEN=xxx
KEAP_REFRESH_TOKEN=xxx

# Keap Tag IDs (pre-created in Keap admin)
KEAP_TAG_WW_COMPLETED=123
KEAP_TAG_WW_BAND_0_29=124
KEAP_TAG_WW_BAND_30_50=125
KEAP_TAG_WW_BAND_51_65=126
KEAP_TAG_WW_BAND_66_80=127
KEAP_TAG_WW_WEAK_FB=128
KEAP_TAG_WW_WEAK_HM=129
KEAP_TAG_WW_WEAK_ML=130
KEAP_TAG_WW_WEAK_RH=131
KEAP_TAG_WW_WEAK_TO=132
KEAP_TAG_WW_WEAK_TH=133
KEAP_TAG_WW_WEAK_TE=134
KEAP_TAG_WW_WEAK_AU=135

# Analytics
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_COOKIEBOT_ID=xxx

# App
NEXT_PUBLIC_BASE_URL=https://worshipwheel.worshipguitarskills.com
```

## Project Setup

```bash
# Create Next.js app
npx create-next-app@latest worship-wheel --typescript --tailwind --app --src-dir

# Install dependencies
cd worship-wheel
npm install @supabase/supabase-js    # Supabase client
npm install recharts                  # Radar chart (or chosen library)
npm install zod                       # Request validation
npm install @vercel/og                # OG image generation

# Dev dependencies
npm install -D @types/node
```

## Project Structure

```
worship-wheel/
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout (GTM, CookieBot, fonts)
│   │   ├── page.tsx                 # Landing page
│   │   ├── assessment/
│   │   │   └── page.tsx             # Assessment quiz flow
│   │   ├── results/
│   │   │   └── [resultId]/
│   │   │       └── page.tsx         # Results page (SSR)
│   │   └── api/
│   │       ├── submit/
│   │       │   └── route.ts         # POST /api/submit
│   │       ├── og/
│   │       │   └── [resultId]/
│   │       │       └── route.ts     # GET /api/og/[resultId]
│   │       └── keap-retry/
│   │           └── route.ts         # Keap retry cron endpoint
│   ├── components/
│   │   ├── landing/                 # Landing page components
│   │   ├── assessment/              # Quiz flow components
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── AnswerOption.tsx
│   │   │   └── EmailGate.tsx
│   │   ├── results/                 # Results page components
│   │   │   ├── RadarChart.tsx
│   │   │   ├── ScoreSummary.tsx
│   │   │   ├── ArchetypeCard.tsx
│   │   │   ├── RecommendationList.tsx
│   │   │   ├── CTABanner.tsx
│   │   │   └── ShareButton.tsx
│   │   └── shared/                  # Shared UI components
│   │       ├── CookieConsent.tsx
│   │       └── GTMProvider.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # Browser client
│   │   │   └── server.ts            # Server client (service role)
│   │   ├── keap/
│   │   │   ├── client.ts            # Keap API client
│   │   │   └── sync.ts              # Contact sync logic
│   │   ├── scoring/
│   │   │   ├── calculator.ts        # Score calculation (server-side)
│   │   │   ├── archetype.ts         # Archetype determination
│   │   │   └── bands.ts             # Score band mapping
│   │   ├── analytics/
│   │   │   └── dataLayer.ts         # DataLayer push helpers
│   │   └── validation/
│   │       └── submission.ts        # Zod schemas for request validation
│   ├── data/
│   │   ├── questions.json           # 16 MVP questions
│   │   ├── elements.json            # 8 elements reference
│   │   └── recommendations.json     # Recommendations + archetypes + CTAs
│   └── types/
│       └── index.ts                 # TypeScript type definitions
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql   # Database schema
├── public/
│   └── fonts/                       # Montserrat font files
├── .env.local                       # Local environment variables
├── next.config.ts
├── tailwind.config.ts
└── vercel.json                      # Vercel config (cron, redirects)
```

## Database Setup

Run the migration in Supabase SQL editor or via CLI:

```sql
-- See data-model.md for full schema
CREATE TABLE assessment_sessions (...);
CREATE TABLE aggregate_stats (...);
CREATE INDEX idx_sessions_email ON assessment_sessions(email);
CREATE INDEX idx_sessions_keap_sync ON assessment_sessions(keap_sync_status) WHERE keap_sync_status != 'synced';
```

## Development Workflow

1. **Design first**: All UI screens must be designed in Figma using WGS brand tokens before coding
2. **Figma → Code**: Extract design tokens from the Brand Guide file for Tailwind config
3. **Mobile-first**: Build all components mobile-first, then enhance for larger screens
4. **Test scoring**: Use the scoring calculator tests to verify deterministic results

## Deployment

```bash
# Deploy to Vercel
vercel --prod

# Configure custom domain
# Add CNAME: worshipwheel.worshipguitarskills.com → cname.vercel-dns.com
```

## Pre-Launch Checklist

- [ ] Keap tags created and IDs configured in env vars
- [ ] Keap custom fields created for score storage
- [ ] Keap automation sequence built and linked to tag trigger
- [ ] GA4 property created and GTM container configured
- [ ] CookieBot configured with correct domain
- [ ] DNS CNAME record added for subdomain
- [ ] All placeholder content replaced (or accepted for soft launch)
- [ ] Privacy policy page exists and is linked from email consent
- [ ] Scoring tested with known answer sets
- [ ] Mobile testing on real devices (375px, 768px, 1024px, 1440px)
