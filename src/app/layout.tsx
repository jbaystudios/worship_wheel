import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import { GoogleAnalytics } from '@next/third-parties/google';
import { PromoCapture } from '@/components/PromoCapture';
import { UtmCapture } from '@/components/UtmCapture';
import './globals.css';

// GA4 measurement ID (G-XXXXXXX). When unset (local/preview), GA4 is not loaded.
// NOTE (v1): no consent gating yet — deliberate scope decision. Add Google
// Consent Mode v2 + Cookiebot before broad public traffic (POPIA/GDPR).
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Worship Wheel | Worship Guitar Skills',
  description:
    'Discover your worship guitar strengths and weaknesses in 5 minutes. Take the free Worship Wheel assessment.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || 'https://worshipwheel.com'
  ),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body className="font-sans">
        <PromoCapture />
        <UtmCapture />
        {children}
      </body>
      {GA_MEASUREMENT_ID && <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />}
    </html>
  );
}
