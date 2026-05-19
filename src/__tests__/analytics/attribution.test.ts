import { describe, it, expect } from 'vitest';
import { classifyAttribution, parseReferrerDomain } from '@/lib/analytics/attribution';

describe('parseReferrerDomain', () => {
  it('extracts the bare host and strips www', () => {
    expect(parseReferrerDomain('https://www.youtube.com/watch?v=abc')).toBe('youtube.com');
    expect(parseReferrerDomain('https://facebook.com/page')).toBe('facebook.com');
  });

  it('returns null for empty or malformed referrers', () => {
    expect(parseReferrerDomain(null)).toBeNull();
    expect(parseReferrerDomain('')).toBeNull();
    expect(parseReferrerDomain('not a url')).toBeNull();
  });
});

describe('classifyAttribution', () => {
  it('uses UTM tags when present, combining source and medium', () => {
    const a = classifyAttribution({
      utmSource: 'youtube',
      utmMedium: 'social',
      utmCampaign: 'worship-wheel-launch',
    });
    expect(a).toEqual({
      kind: 'utm',
      source: 'youtube / social',
      campaign: 'worship-wheel-launch',
    });
  });

  it('falls back to the referrer domain when there is no UTM', () => {
    const a = classifyAttribution({ referrer: 'https://www.facebook.com/x' });
    expect(a).toEqual({ kind: 'referrer', source: 'facebook.com', campaign: null });
  });

  it('treats a self-referral as Direct', () => {
    const a = classifyAttribution({
      referrer: 'https://worshipwheel.worshipguitarskills.com/',
      selfHost: 'worshipwheel.worshipguitarskills.com',
    });
    expect(a.kind).toBe('direct');
  });

  it('classifies no UTM and no referrer as Direct', () => {
    const a = classifyAttribution({});
    expect(a).toEqual({ kind: 'direct', source: 'Direct', campaign: null });
  });

  it('classifies a malformed referrer as Direct', () => {
    const a = classifyAttribution({ referrer: 'garbage' });
    expect(a.kind).toBe('direct');
  });
});
