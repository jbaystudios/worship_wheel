// MVP feature flags (D-1 — v1 launch).
//
// These are deliberately static booleans, not env vars: scope changes for the
// MVP cut are tracked in git, the values flip in this single file, and there's
// no runtime config surface to misconfigure. When the underlying assets are
// ready (VSL video, real WGS landing pages for the CTA tiers), flip these to
// `true` and the on-screen + PDF rendering reappears automatically.
//
// Re-enable for v1.1: flip the relevant boolean(s) to `true` and ship. No
// other code changes required.

export const FEATURES = {
  /**
   * Sales-CTA banner on the web results page + the "Where to focus next" CTA
   * box on the PDF archetype page. Hidden for MVP — the four CTA tiers
   * (Free Training Video, 90-Day Breakthrough, WGS Academy, Advanced
   * Workshops) don't have live landing pages yet, so promoting them would
   * point users at dead ends.
   */
  showCta: false,

  /**
   * Video placeholder ("Watch: Your personalised results explained") inside
   * the archetype card on the web results page. Hidden for MVP — the
   * personalised VSL videos are not produced yet.
   */
  showVsl: false,
} as const;
