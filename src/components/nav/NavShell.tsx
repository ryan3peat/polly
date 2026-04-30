'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';
import PasswordScreen, { isAuthed, setAuthed } from '@/components/auth/PasswordScreen';

export default function NavShell({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const showNav   = pathname !== '/';
  const isInner   = pathname !== '/';

  const [authed, setAuthed_] = useState(true); // optimistic — avoids flash on nav
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setAuthed_(isAuthed());
    setChecked(true);
  }, [pathname]);

  // Don't gate the home page here — it handles its own auth after splash
  const needsGate = isInner && checked && !authed;

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
        {needsGate
          ? <PasswordScreen onSuccess={() => { setAuthed(); setAuthed_(true); }} />
          : children
        }
      </div>
      {showNav && <BottomNav />}
    </>
  );
}
