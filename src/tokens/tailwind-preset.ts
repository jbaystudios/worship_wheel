/**
 * WGS Tailwind Preset — maps Figma design tokens to Tailwind theme
 *
 * Usage in tailwind.config.ts:
 *   import { wgsPreset } from './src/tokens/tailwind-preset';
 *   export default { presets: [wgsPreset], ... }
 *
 * This preset extends (not replaces) the default Tailwind theme,
 * so all default utilities remain available alongside WGS tokens.
 */

import type { Config } from 'tailwindcss';
import { colorPrimitives, theme, sizes, typography } from './design-tokens';

const px = (v: number) => `${v}px`;
const rem = (v: number) => `${v / 16}rem`;

/**
 * Fluid clamp between mobile (375px) and desktop (1440px) viewports.
 * Uses rem for min/max and a vw-based preferred value for smooth scaling.
 */
function fluidSize(minPx: number, maxPx: number): string {
  const minRem = minPx / 16;
  const maxRem = maxPx / 16;
  // slope = (maxPx - minPx) / (1440 - 375)
  const slope = (maxPx - minPx) / (1440 - 375);
  const vw = +(slope * 100).toFixed(4);
  // intercept in rem = (minPx - slope * 375) / 16
  const interceptRem = +((minPx - slope * 375) / 16).toFixed(4);
  const preferred = interceptRem >= 0
    ? `${interceptRem}rem + ${vw}vw`
    : `${vw}vw - ${Math.abs(interceptRem)}rem`;
  return `clamp(${minRem}rem, ${preferred}, ${maxRem}rem)`;
}

export const wgsPreset: Partial<Config> = {
  theme: {
    extend: {
      // ---------------------------------------------------------------
      // Colors — primitives + semantic dark theme as defaults
      // ---------------------------------------------------------------
      colors: {
        // Primitive scales (use as: bg-accent-500, text-neutral-200, etc.)
        accent: colorPrimitives.accent,
        neutral: colorPrimitives.neutral,
        success: colorPrimitives.success,
        warning: colorPrimitives.warning,
        error: colorPrimitives.error,
        info: colorPrimitives.info,

        // Semantic theme tokens — dark mode is the app default
        // Use as: bg-theme-bg, text-theme-text, border-theme-border, etc.
        theme: {
          bg: theme.dark.background,
          'bg-2': theme.dark.background2,
          text: theme.dark.text,
          'text-muted': theme.dark.textMuted,
          border: theme.dark.border,
        },

        // Button tokens
        'btn-primary': {
          DEFAULT: theme.dark.button.primary.background,
          text: theme.dark.button.primary.text,
          border: theme.dark.button.primary.border,
          hover: theme.dark.button.primary.backgroundHover,
          'hover-text': theme.dark.button.primary.textHover,
          'hover-border': theme.dark.button.primary.borderHover,
        },
        'btn-secondary': {
          DEFAULT: theme.dark.button.secondary.background,
          text: theme.dark.button.secondary.text,
          border: theme.dark.button.secondary.border,
          hover: theme.dark.button.secondary.backgroundHover,
          'hover-text': theme.dark.button.secondary.textHover,
          'hover-border': theme.dark.button.secondary.borderHover,
        },

        // Text link tokens
        'text-link': {
          DEFAULT: theme.dark.textLink.text,
          border: theme.dark.textLink.border,
          hover: theme.dark.textLink.textHover,
          'hover-border': theme.dark.textLink.borderHover,
        },

        // Brand accent color (gold)
        gold: colorPrimitives.accent[500],
      },

      // ---------------------------------------------------------------
      // Spacing — maps to Figma space scale (desktop values)
      // Mobile overrides handled via responsive utilities
      // ---------------------------------------------------------------
      spacing: {
        'space-0': px(sizes.space.desktop[0]),
        'space-1': px(sizes.space.desktop[1]),
        'space-2': px(sizes.space.desktop[2]),
        'space-3': px(sizes.space.desktop[3]),
        'space-4': px(sizes.space.desktop[4]),
        'space-5': px(sizes.space.desktop[5]),
        'space-6': px(sizes.space.desktop[6]),
        'space-7': px(sizes.space.desktop[7]),
        'space-8': px(sizes.space.desktop[8]),
        'site-margin': px(sizes.site.desktop.margin),
        'site-gutter': px(sizes.site.desktop.gutter),
        'section-sm': px(sizes.sectionSpace.desktop.small),
        'section-md': px(sizes.sectionSpace.desktop.main),
        'section-lg': px(sizes.sectionSpace.desktop.large),
        'section-top': px(sizes.sectionSpace.desktop.pageTop),
      },

      // ---------------------------------------------------------------
      // Border radius — from Figma Sizes collection
      // ---------------------------------------------------------------
      borderRadius: {
        sm: px(sizes.radius.small),
        md: px(sizes.radius.main),
        full: px(sizes.radius.round),
      },

      // ---------------------------------------------------------------
      // Border width
      // ---------------------------------------------------------------
      borderWidth: {
        DEFAULT: `${sizes.borderWidth.main}px`,
      },

      // ---------------------------------------------------------------
      // Font family — Montserrat
      // ---------------------------------------------------------------
      fontFamily: {
        sans: [typography.family, 'system-ui', 'sans-serif'],
      },

      // ---------------------------------------------------------------
      // Font size — fluid clamp() scaling between 375px and 1440px
      // No breakpoint overrides needed; sizes scale smoothly
      // ---------------------------------------------------------------
      fontSize: {
        'text-sm': [fluidSize(sizes.fontSize.mobile.textSmall, sizes.fontSize.desktop.textSmall), { lineHeight: typography.lineHeight.body }],
        'text-base': [fluidSize(sizes.fontSize.mobile.textMain, sizes.fontSize.desktop.textMain), { lineHeight: typography.lineHeight.body }],
        'text-lg': [fluidSize(sizes.fontSize.mobile.textLarge, sizes.fontSize.desktop.textLarge), { lineHeight: typography.lineHeight.body }],
        h6: [fluidSize(sizes.fontSize.mobile.h6, sizes.fontSize.desktop.h6), { lineHeight: typography.lineHeight.heading }],
        h5: [fluidSize(sizes.fontSize.mobile.h5, sizes.fontSize.desktop.h5), { lineHeight: typography.lineHeight.heading }],
        h4: [fluidSize(sizes.fontSize.mobile.h4, sizes.fontSize.desktop.h4), { lineHeight: typography.lineHeight.heading }],
        h3: [fluidSize(sizes.fontSize.mobile.h3, sizes.fontSize.desktop.h3), { lineHeight: typography.lineHeight.display }],
        h2: [fluidSize(sizes.fontSize.mobile.h2, sizes.fontSize.desktop.h2), { lineHeight: typography.lineHeight.hero }],
        h1: [fluidSize(sizes.fontSize.mobile.h1, sizes.fontSize.desktop.h1), { lineHeight: typography.lineHeight.hero }],
        display: [fluidSize(sizes.fontSize.mobile.display, sizes.fontSize.desktop.display), { lineHeight: typography.lineHeight.hero }],
      },

      // ---------------------------------------------------------------
      // Font weight — mapped from Figma Typography collection
      // ---------------------------------------------------------------
      fontWeight: {
        normal: typography.fontWeight.regular,
        medium: typography.fontWeight.medium,
        bold: typography.fontWeight.bold,
      },

      // ---------------------------------------------------------------
      // Max height — section height token
      // ---------------------------------------------------------------
      maxHeight: {
        section: px(sizes.sectionHeight.full),
      },

      // ---------------------------------------------------------------
      // Mobile spacing overrides (use with max-md: prefix)
      // ---------------------------------------------------------------
      // Example: class="p-space-5 max-md:p-space-5-mobile"
      // These are registered separately to avoid polluting the default scale
    },
  },
};

/**
 * Mobile spacing values — for use in responsive utility classes or
 * custom CSS where Tailwind responsive prefixes aren't sufficient.
 *
 * Example: In a component, import and use directly:
 *   import { mobileSpacing } from '@/tokens/tailwind-preset';
 *   style={{ padding: mobileSpacing['space-5'] }}
 */
export const mobileSpacing = {
  'space-0': px(sizes.space.mobile[0]),
  'space-1': px(sizes.space.mobile[1]),
  'space-2': px(sizes.space.mobile[2]),
  'space-3': px(sizes.space.mobile[3]),
  'space-4': px(sizes.space.mobile[4]),
  'space-5': px(sizes.space.mobile[5]),
  'space-6': px(sizes.space.mobile[6]),
  'space-7': px(sizes.space.mobile[7]),
  'space-8': px(sizes.space.mobile[8]),
  'site-margin': px(sizes.site.mobile.margin),
  'site-gutter': px(sizes.site.mobile.gutter),
  'section-sm': px(sizes.sectionSpace.mobile.small),
  'section-md': px(sizes.sectionSpace.mobile.main),
  'section-lg': px(sizes.sectionSpace.mobile.large),
  'section-top': px(sizes.sectionSpace.mobile.pageTop),
} as const;
