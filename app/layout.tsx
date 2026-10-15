import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Geist_Mono } from 'next/font/google';
import Providers from '@/components/Providers';
import 'lenis/dist/lenis.css';
import './globals.css';

const sans = localFont({
  src: [
    { path: './fonts/GeneralSans-400.woff2', weight: '400' },
    { path: './fonts/GeneralSans-500.woff2', weight: '500' },
    { path: './fonts/GeneralSans-600.woff2', weight: '600' },
  ],
  variable: '--font-sans',
  display: 'swap',
});
const mono = Geist_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Krishna Singh — Editor, Photographer & Developer',
  description: 'Video editor, photographer and full-stack developer based in Surat, India. Websites, WebGL, photography and motion.',
  openGraph: {
    title: 'Krishna Singh',
    description: 'Video editor, photographer and full-stack developer based in Surat, India.',
    type: 'website',
  },
};

export const viewport: Viewport = { themeColor: '#ffffff', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
