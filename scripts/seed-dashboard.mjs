// One-off seed script: pushes simulated funnel events + completed submissions
// at the local dev server so the admin dashboard has data to render.
//
//   node scripts/seed-dashboard.mjs
//
// Safe to re-run; each run uses fresh UUIDs so it always inserts new rows.
// Targets http://localhost:3000 by default (override with SEED_BASE_URL).
//
// ⚠️ PRODUCTION-SIDE EFFECTS ⚠️
// This script hits the LOCAL dev server, but the dev server uses .env.local —
// which by default points at PRODUCTION Supabase and PRODUCTION Keap. Running
// this script will:
//   1. Insert ~6 rows into the production assessment_sessions table
//   2. Insert ~150+ rows into the production assessment_events table
//   3. Create ~6 contacts in production Keap, each tagged with the start-of-
//      automation tag (KEAP_TAG_WW_COMPLETED) — this WILL fire the post-
//      launch automation if it is live
//
// Before running, either point .env.local at staging Supabase/Keap, or
// temporarily blank out KEAP_SERVICE_ACCOUNT_KEY to skip the Keap push.
// Always clean up afterwards (DELETE from both tables; delete the Keap test
// contacts) before any cohort traffic lands.
//
// Intended for: local dashboard development and demo prep only. Not for use
// against live data.

const BASE = process.env.SEED_BASE_URL ?? 'http://localhost:3000';

const CODES = ['fb', 'hm', 'ml', 'rh', 'to', 'th', 'te', 'au'];
const SLOT_TYPE = ['scenario', 'checklist', 'experience'];

const UA = {
  desktop:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  mobile:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (Version/17.5 Mobile/15E148 Safari/604.1)',
  tablet:
    'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (Version/17.5 Mobile/15E148 Safari/604.1)',
};

const PERSONAS = [
  {
    name: 'Sarah',
    email: 'sarah.test@worshipwheel.dev',
    skill: 'beginner',
    device: 'desktop',
    acq: { utmSource: 'google', utmMedium: 'cpc', utmCampaign: 'wheel-launch', landingPath: '/' },
    completionSeconds: 410,
    finish: true,
  },
  {
    name: 'Marcus',
    email: 'marcus.test@worshipwheel.dev',
    skill: 'intermediate',
    device: 'mobile',
    acq: { utmSource: 'facebook', utmMedium: 'social', utmCampaign: 'spring-2026', landingPath: '/' },
    completionSeconds: 305,
    finish: true,
  },
  {
    name: 'Priya',
    email: 'priya.test@worshipwheel.dev',
    skill: 'advanced',
    device: 'desktop',
    acq: { referrer: 'https://www.worshipguitarskills.com/blog/scales', landingPath: '/' },
    completionSeconds: 240,
    finish: true,
  },
  {
    name: 'Daniel',
    email: 'daniel.test@worshipwheel.dev',
    skill: 'intermediate',
    device: 'mobile',
    acq: { referrer: 'https://www.youtube.com/@worshipguitarskills', landingPath: '/' },
    completionSeconds: 360,
    finish: true,
  },
  {
    name: 'Hannah',
    email: 'hannah.test@worshipwheel.dev',
    skill: 'beginner',
    device: 'tablet',
    acq: { landingPath: '/' }, // direct
    completionSeconds: 480,
    finish: true,
  },
  {
    name: 'Liam',
    email: 'liam.test@worshipwheel.dev',
    skill: 'advanced',
    device: 'desktop',
    acq: { utmSource: 'newsletter', utmMedium: 'email', utmCampaign: 'monthly-tips', landingPath: '/' },
    completionSeconds: 215,
    finish: true,
  },
  // Two drop-offs (no submit) — give the funnel some fallout to display.
  {
    name: null,
    email: null,
    skill: 'beginner',
    device: 'mobile',
    acq: { utmSource: 'google', utmMedium: 'cpc', utmCampaign: 'wheel-launch', landingPath: '/' },
    dropAtPosition: 5,
    finish: false,
  },
  {
    name: null,
    email: null,
    skill: 'intermediate',
    device: 'desktop',
    acq: { referrer: 'https://www.google.com/', landingPath: '/' },
    dropAtPosition: 14,
    finish: false,
  },
];

function uuid() {
  return crypto.randomUUID();
}

function pickWeighted(options, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < options.length; i++) {
    r -= weights[i];
    if (r <= 0) return options[i];
  }
  return options[options.length - 1];
}

function answerForQuestion(position, skill) {
  const type = SLOT_TYPE[(position - 1) % 3];

  if (type === 'checklist') {
    // pick top-N item indices based on skill
    const n =
      skill === 'beginner' ? 1 + Math.floor(Math.random() * 2)
      : skill === 'intermediate' ? 3 + Math.floor(Math.random() * 2)
      : 5 + Math.floor(Math.random() * 2);
    // most checklists have 7-10 items; index 0..6 covers all of them safely
    const all = [0, 1, 2, 3, 4, 5, 6];
    return all.slice(0, n);
  }

  const opts = ['a', 'b', 'c', 'd', 'e'];
  const weights =
    skill === 'beginner' ? [5, 4, 2, 1, 1]
    : skill === 'intermediate' ? [1, 3, 5, 3, 1]
    : [1, 1, 2, 4, 5];
  return pickWeighted(opts, weights);
}

function questionId(position) {
  const code = CODES[Math.floor((position - 1) / 3)];
  const slot = ((position - 1) % 3) + 1;
  return `${code}_0${slot}`;
}

async function postEvents(events, userAgent, ip) {
  const res = await fetch(`${BASE}/api/events`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': userAgent,
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(events.length === 1 ? events[0] : events),
  });
  if (!res.ok && res.status !== 204) {
    console.warn(`  ! events POST ${res.status}`);
  }
}

async function postSubmit(payload, userAgent, ip) {
  const res = await fetch(`${BASE}/api/submit`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': userAgent,
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`submit POST ${res.status}: ${body}`);
  }
  return res.json();
}

async function runPersona(p, index) {
  const anonSessionId = uuid();
  const ua = UA[p.device];
  const acquisition = p.acq;
  const label = p.name ?? `(drop@${p.dropAtPosition})`;
  // unique per-persona IP so each gets its own rate-limit bucket
  const ip = `10.42.0.${10 + index}`;

  console.log(`→ ${label} [${p.skill}/${p.device}]`);

  // 1) page_view
  await postEvents(
    [{ anonSessionId, eventType: 'page_view', acquisition }],
    ua,
    ip,
  );

  // 2) assessment_started
  await postEvents(
    [{ anonSessionId, eventType: 'assessment_started', acquisition }],
    ua,
    ip,
  );

  // 3) walk through questions, batched in groups of 10 (schema limit)
  const lastPosition = p.finish ? 24 : p.dropAtPosition;
  const events = [];
  const answers = {};
  for (let pos = 1; pos <= lastPosition; pos++) {
    const qId = questionId(pos);
    events.push({
      anonSessionId,
      eventType: 'question_viewed',
      questionId: qId,
      questionPosition: pos,
      acquisition,
    });
    // record an answer for the persona regardless of drop — only used at submit
    const ans = answerForQuestion(pos, p.skill);
    answers[String(pos - 1)] = ans;
    // simulate dropping after viewing the question they bailed on:
    if (!p.finish && pos === lastPosition) break;
    events.push({
      anonSessionId,
      eventType: 'question_answered',
      questionId: qId,
      questionPosition: pos,
      acquisition,
    });
  }

  // flush in chunks of 10 (events route caps batches at 10)
  for (let i = 0; i < events.length; i += 10) {
    await postEvents(events.slice(i, i + 10), ua, ip);
  }

  if (!p.finish) {
    console.log(`  ✓ dropped at q${p.dropAtPosition}`);
    return;
  }

  // 4) submit
  const utmParams = {
    source: acquisition.utmSource ?? null,
    medium: acquisition.utmMedium ?? null,
    campaign: acquisition.utmCampaign ?? null,
    term: acquisition.utmTerm ?? null,
    content: acquisition.utmContent ?? null,
  };

  const result = await postSubmit(
    {
      firstName: p.name,
      email: p.email,
      answers,
      anonSessionId,
      completionTimeSeconds: p.completionSeconds,
      utmParams,
    },
    ua,
    ip,
  );

  // 5) assessment_submitted with resultId backlink
  await postEvents(
    [
      {
        anonSessionId,
        eventType: 'assessment_submitted',
        resultId: result.resultId,
        acquisition,
      },
    ],
    ua,
    ip,
  );

  console.log(
    `  ✓ submitted ${result.resultId.slice(0, 8)} — ${result.archetype?.name ?? '?'} (${result.overallScore}/80)`,
  );
}

async function main() {
  console.log(`Seeding dashboard data at ${BASE}\n`);
  for (let i = 0; i < PERSONAS.length; i++) {
    try {
      await runPersona(PERSONAS[i], i);
    } catch (err) {
      console.error(`  ✗ ${err.message}`);
    }
  }
  console.log('\nDone. Reload /admin to see the new data.');
}

main();
