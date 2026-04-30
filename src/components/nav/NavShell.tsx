'use client';

import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';

export default function NavShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = pathname !== '/';

  return (
    <>
      <div
        style={{
          maxWidth: 430,
          width: '100%',
          margin: '0 auto',
          minHeight: '100dvh',
          background: '#FAF7F4',
          position: 'relative',
          boxShadow: '0 0 40px rgba(0,0,0,0.08)',
          paddingBottom: showNav
            ? 'calc(64px + env(safe-area-inset-bottom))'
            : 0,
        }}
      >
        {children}
      </div>
      {showNav && <BottomNav />}
    </>
  );
}
