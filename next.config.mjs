/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'worshipguitarskills.com',
      },
    ],
  },
  experimental: {
    // The PDF route registers Montserrat fonts via a runtime path.join into
    // node_modules (src/components/results/pdf/styles.ts). @vercel/nft can't
    // statically trace those string paths, so the .woff files were omitted
    // from the deployed function — Font.register then hit ENOENT and the
    // route 500'd in production (works locally only because node_modules is
    // present). Force-include the three weights for this route's bundle.
    outputFileTracingIncludes: {
      '/api/results/[resultId]/pdf': [
        './node_modules/@fontsource/montserrat/files/montserrat-latin-400-normal.woff',
        './node_modules/@fontsource/montserrat/files/montserrat-latin-500-normal.woff',
        './node_modules/@fontsource/montserrat/files/montserrat-latin-700-normal.woff',
      ],
    },
  },
};

export default nextConfig;
