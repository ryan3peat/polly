import type { Metadata, Viewport } from 'next';
import './globals.css';
import NavShell from '@/components/nav/NavShell';

export const metadata: Metadata = {
  title: "Polly's App",
  description: 'Your daily world, curated.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavShell>{children}</NavShell>
      </body>
    </html>
  );
}
