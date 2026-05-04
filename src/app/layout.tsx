import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import './globals.css';
import NavShell from '@/components/nav/NavShell';
import { ClerkProvider } from '@clerk/nextjs';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Polly's App",
  description: 'Your daily world, curated.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: "Polly's App",
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#C9848A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
        <body>
          <NavShell>{children}</NavShell>
        </body>
      </html>
    </ClerkProvider>
  );
}
