'use client';

import { SignUp } from '@clerk/nextjs';

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
    card: {
      boxShadow: 'none',
      background: 'transparent',
      border: 'none',
    },
    headerTitle: {
      display: 'none',
    },
    headerSubtitle: {
      display: 'none',
    },
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
    footerActionLink: {
      color: '#C4A35A',
    },
    dividerLine: {
      background: '#EDD9DB',
    },
    formFieldInput: {
      border: '1px solid #EDD9DB',
      borderRadius: '999px',
    },
  },
};

export default function SignUpPage() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#FAF7F4',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      {/* Monogram */}
      <div
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 32,
          fontWeight: 300,
          letterSpacing: '0.2em',
          color: '#2A2A2A',
          marginBottom: 8,
        }}
      >
        P·C
      </div>

      {/* Heading */}
      <h1
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 22,
          fontWeight: 400,
          fontStyle: 'italic',
          color: '#2A2A2A',
          marginBottom: 4,
          textAlign: 'center',
        }}
      >
        Create your account
      </h1>

      {/* Gold divider */}
      <div
        style={{
          width: 40,
          height: 1,
          background: '#C4A35A',
          marginBottom: 32,
        }}
      />

      <SignUp appearance={clerkAppearance} />
    </div>
  );
}
