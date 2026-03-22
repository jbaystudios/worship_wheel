/**
 * WGS Design Tokens — extracted from Figma Brand Guide
 *
 * Source: Figma file "WGS Brand Guide" (JzQBHkEnkrtm0XRL3bM7z2)
 * Extracted: 2026-03-06
 *
 * To re-sync with Figma: run the figma_execute extraction script
 * and regenerate this file from the output.
 *
 * Collections:
 *   - Color Primitives (73 vars, 1 mode)
 *   - Theme (21 vars, 3 modes: Light / Dark / Brand)
 *   - Sizes (31 vars, 2 modes: Desktop / Mobile)
 *   - Typography (4 vars, 1 mode)
 */

// ---------------------------------------------------------------------------
// Color Primitives — mode-independent base palette
// ---------------------------------------------------------------------------

export const colorPrimitives = {
  accent: {
    50: '#f8f7f6',
    100: '#efeeea',
    200: '#e2ded4',
    300: '#cfc7b3',
    400: '#beb08c',
    500: '#b19b64',
    600: '#978049',
    700: '#7b693b',
    800: '#5e512f',
    900: '#423923',
    950: '#262216',
  },
  neutral: {
    0: '#ffffff',
    50: '#faf9f9',
    100: '#f5f4f4',
    200: '#e8e8e7',
    300: '#d5d4d1',
    400: '#a5a4a0',
    500: '#787671',
    600: '#615f5b',
    700: '#464542',
    800: '#2f2e2c',
    900: '#1d1c1a',
    950: '#100f0e',
    1000: '#000000',
  },
  success: {
    50: '#f5f8f6',
    100: '#e8f2eb',
    200: '#cde9d7',
    300: '#a3e0b9',
    400: '#70db97',
    500: '#22c55e',
    600: '#1dc35a',
    700: '#179f49',
    800: '#15793a',
    900: '#12532a',
    950: '#0d2f1a',
  },
  warning: {
    50: '#f9f7f5',
    100: '#f3eee6',
    200: '#eddfc9',
    300: '#e9cb9a',
    400: '#ebb75f',
    500: '#f59e0b',
    600: '#dc8c03',
    700: '#b47202',
    800: '#895805',
    900: '#5d3d08',
    950: '#352408',
  },
  error: {
    50: '#f9f5f5',
    100: '#f3e7e7',
    200: '#ebcaca',
    300: '#e59d9d',
    400: '#e56565',
    500: '#ef4444',
    600: '#d30c0c',
    700: '#ac0a0a',
    800: '#830b0b',
    900: '#590c0c',
    950: '#330909',
  },
  info: {
    50: '#f5f6f9',
    100: '#e6ebf3',
    200: '#c9d6ed',
    300: '#9ab8e8',
    400: '#6095ea',
    500: '#3b82f6',
    600: '#0456db',
    700: '#0346b3',
    800: '#063788',
    900: '#09285c',
    950: '#081934',
  },
  transparent: '#ffffff00',
  neutralOverlay: {
    light20: '#ffffff33', // neutral/0 at 20% opacity
    dark20: '#100f0e33',  // neutral/950 at 20% opacity
  },
  brandText: '#100f0e',
  brandTextOverlay: '#100f0e33', // brand-text at 20% opacity
} as const;

// ---------------------------------------------------------------------------
// Theme — semantic tokens with Light / Dark / Brand modes
// All aliases fully resolved to hex values
// ---------------------------------------------------------------------------

export const theme = {
  light: {
    background: '#ffffff',
    background2: '#e8e8e7',
    text: '#100f0e',
    textMuted: '#2f2e2c',
    border: '#e8e8e7',
    button: {
      primary: {
        background: '#b19b64',
        border: '#b19b64',
        text: '#100f0e',
        backgroundHover: '#100f0e',
        borderHover: '#100f0e',
        textHover: '#ffffff',
      },
      secondary: {
        background: '#ffffff00',
        border: '#e8e8e7',
        text: '#100f0e',
        backgroundHover: '#100f0e',
        borderHover: '#100f0e',
        textHover: '#ffffff',
      },
    },
    textLink: {
      text: '#100f0e',
      border: '#e8e8e7',
      textHover: '#100f0e',
      borderHover: '#100f0e',
    },
  },
  dark: {
    background: '#100f0e',
    background2: '#2f2e2c',
    text: '#ffffff',
    textMuted: '#f5f4f4',
    border: '#2f2e2c',
    button: {
      primary: {
        background: '#b19b64',
        border: '#b19b64',
        text: '#100f0e',
        backgroundHover: '#ffffff',
        borderHover: '#ffffff',
        textHover: '#100f0e',
      },
      secondary: {
        background: '#ffffff00',
        border: '#2f2e2c',
        text: '#ffffff',
        backgroundHover: '#ffffff',
        borderHover: '#ffffff',
        textHover: '#100f0e',
      },
    },
    textLink: {
      text: '#ffffff',
      border: '#2f2e2c',
      textHover: '#ffffff',
      borderHover: '#b19b64',
    },
  },
  brand: {
    background: '#b19b64',
    background2: '#978049',
    text: '#100f0e',
    textMuted: '#2f2e2c',
    border: '#2f2e2c',
    button: {
      primary: {
        background: '#100f0e',
        border: '#100f0e',
        text: '#b19b64',
        backgroundHover: '#2f2e2c',
        borderHover: '#2f2e2c',
        textHover: '#b19b64',
      },
      secondary: {
        background: '#ffffff00',
        border: '#2f2e2c',
        text: '#100f0e',
        backgroundHover: '#100f0e',
        borderHover: '#100f0e',
        textHover: '#b19b64',
      },
    },
    textLink: {
      text: '#100f0e',
      border: '#2f2e2c',
      textHover: '#100f0e',
      borderHover: '#100f0e',
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Sizes — responsive spacing, radii, borders, font sizes (Desktop / Mobile)
// ---------------------------------------------------------------------------

export const sizes = {
  space: {
    desktop: { 0: 0, 1: 8, 2: 12, 3: 16, 4: 24, 5: 32, 6: 40, 7: 48, 8: 64 },
    mobile: { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 28, 7: 36, 8: 40 },
  },
  site: {
    desktop: { margin: 48, gutter: 32 },
    mobile: { margin: 16, gutter: 16 },
  },
  sectionSpace: {
    desktop: { none: 0, small: 80, main: 112, large: 160, pageTop: 224 },
    mobile: { none: 0, small: 48, main: 64, large: 88, pageTop: 112 },
  },
  sectionHeight: {
    full: 900, // same on both breakpoints
  },
  borderWidth: {
    main: 1.5, // same on both breakpoints
  },
  radius: {
    small: 8,   // same on both breakpoints
    main: 16,   // same on both breakpoints
    round: 99999, // pill shape
  },
  fontSize: {
    desktop: {
      textSmall: 16,
      textMain: 18,
      textLarge: 20,
      h6: 18,
      h5: 24,
      h4: 32,
      h3: 48,
      h2: 64,
      h1: 80,
      display: 112,
    },
    mobile: {
      textSmall: 14,
      textMain: 16,
      textLarge: 18,
      h6: 16,
      h5: 22,
      h4: 28,
      h3: 36,
      h2: 40,
      h1: 48,
      display: 64,
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Typography — font family and weights
// ---------------------------------------------------------------------------

export const typography = {
  family: 'Montserrat',
  weights: {
    regular: 'Regular',
    medium: 'Medium',
    bold: 'Bold',
  },
  /** Tailwind-compatible numeric weight mapping */
  fontWeight: {
    regular: '400',
    medium: '500',
    bold: '700',
  },
  /** Text style line heights (from Figma text styles) */
  lineHeight: {
    body: '150%',   // Text Small, Text Main, Text Large
    heading: '130%', // H6, H5, H4
    display: '110%', // H3
    hero: '100%',    // H2, H1, Display
  },
} as const;

// ---------------------------------------------------------------------------
// Convenience: the Worship Wheel app uses dark theme by default
// ---------------------------------------------------------------------------

export const appTheme = theme.dark;
