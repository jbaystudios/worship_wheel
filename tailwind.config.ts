import type { Config } from 'tailwindcss';
import { wgsPreset } from './src/tokens/tailwind-preset';

const config: Config = {
  presets: [wgsPreset as Config],
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
