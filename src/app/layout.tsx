import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';

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
    process.env.NEXT_PUBLIC_BASE_URL || 'https://worshipwheel.worshipguitarskills.com'
  ),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
