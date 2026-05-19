// Bot detection, device classification, and spam heuristics (spec 005, US2 /
// task T026, research R7). Applied at event ingestion so dashboard queries can
// exclude non-human traffic with a cheap indexed predicate.
import type { DeviceType } from '@/types/admin';

const BOT_UA =
  /(bot\b|crawl|spider|slurp|mediapartners|facebookexternalhit|embedly|quora|pinterest|bitlybot|tumblr|w3c_validator|baiduspider|yandex|duckduckbot|applebot|semrush|ahrefs|mj12bot|dotbot|petalbot|headless|phantomjs|puppeteer|playwright|lighthouse|gtmetrix|pingdom|uptimerobot|curl\/|wget|python-requests|axios\/|node-fetch|go-http-client)/i;

/** True for known crawlers/automation, and for a missing UA (real browsers always send one). */
export function isBotUserAgent(ua?: string | null): boolean {
  if (!ua || ua.trim() === '') return true;
  return BOT_UA.test(ua);
}

/** Coarse device classification from the User-Agent string. */
export function deviceTypeFromUserAgent(ua?: string | null): DeviceType {
  if (!ua) return 'unknown';
  if (/iPad|Tablet|PlayBook|Silk|Kindle|Android(?!.*Mobile)/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobi|iPhone|iPod|Android.*Mobile|Windows Phone|BlackBerry|Opera Mini/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

/** Floor below which a full 24-question completion is treated as non-human. */
export const MIN_PLAUSIBLE_COMPLETION_SECONDS = 20;

/** True when a reported completion time is implausibly fast (spam/automation). */
export function isImplausiblyFastCompletion(
  completionSeconds?: number | null,
): boolean {
  return (
    completionSeconds !== null &&
    completionSeconds !== undefined &&
    completionSeconds < MIN_PLAUSIBLE_COMPLETION_SECONDS
  );
}
