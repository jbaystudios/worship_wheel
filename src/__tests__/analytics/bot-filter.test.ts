import { describe, it, expect } from 'vitest';
import {
  isBotUserAgent,
  deviceTypeFromUserAgent,
  isImplausiblyFastCompletion,
} from '@/lib/analytics/bot-filter';

const CHROME_DESKTOP =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const IPAD =
  'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/604.1';

describe('isBotUserAgent', () => {
  it('flags known crawlers and automation', () => {
    expect(isBotUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe(true);
    expect(isBotUserAgent('facebookexternalhit/1.1')).toBe(true);
    expect(isBotUserAgent('Mozilla/5.0 ... HeadlessChrome/124.0 ...')).toBe(true);
    expect(isBotUserAgent('curl/8.4.0')).toBe(true);
  });

  it('treats a missing or empty UA as a bot', () => {
    expect(isBotUserAgent(null)).toBe(true);
    expect(isBotUserAgent('')).toBe(true);
  });

  it('does not flag real browsers', () => {
    expect(isBotUserAgent(CHROME_DESKTOP)).toBe(false);
    expect(isBotUserAgent(IPHONE)).toBe(false);
  });
});

describe('deviceTypeFromUserAgent', () => {
  it('classifies device families', () => {
    expect(deviceTypeFromUserAgent(CHROME_DESKTOP)).toBe('desktop');
    expect(deviceTypeFromUserAgent(IPHONE)).toBe('mobile');
    expect(deviceTypeFromUserAgent(IPAD)).toBe('tablet');
    expect(deviceTypeFromUserAgent(null)).toBe('unknown');
  });
});

describe('isImplausiblyFastCompletion', () => {
  it('flags completions below the plausibility floor', () => {
    expect(isImplausiblyFastCompletion(5)).toBe(true);
    expect(isImplausiblyFastCompletion(19)).toBe(true);
  });

  it('accepts realistic completion times', () => {
    expect(isImplausiblyFastCompletion(240)).toBe(false);
    expect(isImplausiblyFastCompletion(20)).toBe(false);
  });

  it('does not flag a missing value', () => {
    expect(isImplausiblyFastCompletion(null)).toBe(false);
    expect(isImplausiblyFastCompletion(undefined)).toBe(false);
  });
});
