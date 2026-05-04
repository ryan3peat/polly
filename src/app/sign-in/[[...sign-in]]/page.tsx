'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignIn } from '@clerk/nextjs';

const clerkAppearance = {
  variables: {
    colorPrimary: '#C9848A',
    colorBackground: '#FAF7F4',
    colorInputBackground: '#FFFFFF',
    colorInputText: '#2A2A2A',
    colorText: '#2A2A2A',
    colorTextSecondary: '#7A7170',
    colorNeutral: '#2A2A2A',
    borderRadius: '999px',
    fontFamily: "'DM Sans', sans-serif",
  },
  elements: {
    card: { boxShadow: 'none', background: 'transparent', border: 'none' },
    headerTitle: { display: 'none' },
    headerSubtitle: { display: 'none' },
    socialButtonsBlockButton: {
      border: '1px solid #EDD9DB',
      background: '#FFFFFF',
      color: '#2A2A2A',
    },
    formButtonPrimary: {
      background: '#C9848A',
      fontSize: '14px',
      fontWeight: 500,
    },
    footerActionLink: { color: '#C4A35A' },
    dividerLine: { background: '#EDD9DB' },
    formFieldInput: { border: '1px solid #EDD9DB', borderRadius: '999px' },
    footer: { display: 'none' },
  },
};

export default function SignInPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  if (showForm) {
    return (
      <div style={{
        minHeight: '100dvh', background: '#FAF7F4',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 28, fontWeight: 300, letterSpacing: '0.2em',
          color: '#2A2A2A', marginBottom: 8,
        }}>
          P·C
        </div>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 22, fontWeight: 400, fontStyle: 'italic',
          color: '#2A2A2A', marginBottom: 4, textAlign: 'center',
        }}>
          Welcome back
        </h1>
        <div style={{ width: 40, height: 1, background: '#C4A35A', marginBottom: 32 }} />

        <SignIn appearance={clerkAppearance} />

        <button
          onClick={() => setShowForm(false)}
          style={{
            marginTop: 20, background: 'none', border: 'none',
            fontFamily: "'DM Sans', sans-serif", fontSize: 13,
            color: '#7A7170', cursor: 'pointer', textDecoration: 'underline',
          }}
        >
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100dvh', background: '#FAF7F4',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 28px',
    }}>
      {/* Monogram */}
      <div style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 36, fontWeight: 300, letterSpacing: '0.2em',
        color: '#2A2A2A', marginBottom: 10,
      }}>
        P·C
      </div>

      {/* Title */}
      <h1 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 38, fontWeight: 500, lineHeight: 1,
        letterSpacing: '-0.015em', color: '#2A2A2A',
        margin: '0 0 6px', textAlign: 'center',
      }}>
        Polly&apos;s <em style={{ fontStyle: 'italic', fontWeight: 400, color: '#C9848A' }}>App</em>
      </h1>

      {/* Gold ornament */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0' }}>
        <div style={{ height: 1, width: 28, background: '#C4A35A' }} />
        <div style={{ width: 4, height: 4, background: '#C4A35A', transform: 'rotate(45deg)' }} />
        <div style={{ height: 1, width: 28, background: '#C4A35A' }} />
      </div>

      <p style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontStyle: 'italic', fontSize: 18, color: '#7A7170',
        margin: '0 0 48px', textAlign: 'center',
      }}>
        Your daily world, curated.
      </p>

      {/* Register button */}
      <button
        onClick={() => router.push('/sign-up')}
        style={{
          width: '100%', maxWidth: 320, height: 52,
          borderRadius: 999, background: '#C9848A',
          color: '#FFFFFF', border: 'none',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15, fontWeight: 500,
          cursor: 'pointer', letterSpacing: '0.03em',
          marginBottom: 12,
        }}
      >
        Register as New User
      </button>

      {/* Sign in button */}
      <button
        onClick={() => setShowForm(true)}
        style={{
          width: '100%', maxWidth: 320, height: 52,
          borderRadius: 999, background: 'transparent',
          color: '#2A2A2A', border: '1px solid #EDD9DB',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15, fontWeight: 400,
          cursor: 'pointer', letterSpacing: '0.03em',
        }}
      >
        Sign In
      </button>
    </div>
  );
}
