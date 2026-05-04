'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import BottomNav from './BottomNav';

const AUTH_PAGES = ['/', '/sign-in', '/sign-up', '/onboarding', '/onboarding-check'];

function isAuthPage(pathname: string) {
  return AUTH_PAGES.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export default function NavShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  const showNav = !isAuthPage(pathname);

  useEffect(() => {
    if (!isLoaded) return;
    if (showNav && !isSignedIn) {
      router.replace('/sign-in');
    }
  }, [isLoaded, isSignedIn, showNav, router]);

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
