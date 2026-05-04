'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OnboardingCheck() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.replace('/sign-in'); return; }
    if (user.publicMetadata?.onboarding_complete) {
      router.replace('/');
    } else {
      router.replace('/onboarding');
    }
  }, [isLoaded, user, router]);

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#FAF7F4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 28,
          fontWeight: 300,
          letterSpacing: '0.2em',
          color: '#C9848A',
        }}
      >
        P·C
      </div>
    </div>
  );
}
