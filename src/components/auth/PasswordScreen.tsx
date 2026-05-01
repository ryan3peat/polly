'use client';

import { useState } from 'react';

const CORRECT = process.env.NEXT_PUBLIC_SITE_PASSWORD ?? '';

export function isAuthed(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem('polly_authed') === 'true';
}

export function setAuthed() {
  sessionStorage.setItem('polly_authed', 'true');
}

export default function PasswordScreen({ onSuccess }: { onSuccess: () => void }) {
  const [value, setValue]   = useState('');
  const [error, setError]   = useState(false);
  const [shaking, setShaking] = useState(false);

  const attempt = () => {
    if (value === CORRECT) {
      setAuthed();
      onSuccess();
    } else {
      setError(true);
      setShaking(true);
      setValue('');
      setTimeout(() => setShaking(false), 500);
    }
  };

  return (
    <>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
        .shake { animation: shake 0.45s ease; }
      `}</style>

      <div style={{
        position: 'fixed', inset: 0,
        background: 'linear-gradient(180deg, #FAF7F4 0%, #FFFFFF 60%, #FAF7F4 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 36px', zIndex: 300,
        fontFamily: 'var(--font-dm-sans), sans-serif',
      }}>
        {/* Monogram */}
        <div style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontStyle: 'italic', fontSize: 18, color: '#2A2A2A',
          letterSpacing: '0.04em', marginBottom: 32,
        }}>
          P<span style={{ color: '#C4A35A' }}>·</span>C
        </div>

        <h1 style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontSize: 32, fontWeight: 400, color: '#2A2A2A',
          textAlign: 'center', lineHeight: 1.2, marginBottom: 8,
        }}>
          Welcome back,<br />
          <em style={{ color: '#C9848A', fontStyle: 'italic' }}>Polly.</em>
        </h1>

        <p style={{
          fontSize: 13, color: '#7A7170', fontStyle: 'italic',
          marginBottom: 36, textAlign: 'center',
        }}>
          Your daily world is waiting.
        </p>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, width: '100%' }}>
          <div style={{ flex: 1, height: 1, background: '#EDD9DB' }} />
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#C4A35A' }} />
          <div style={{ flex: 1, height: 1, background: '#EDD9DB' }} />
        </div>

        <div className={shaking ? 'shake' : ''} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="password"
            value={value}
            onChange={e => { setValue(e.target.value); setError(false); }}
            onKeyDown={e => e.key === 'Enter' && value && attempt()}
            placeholder="Enter your password"
            autoFocus
            style={{
              width: '100%', height: 52, borderRadius: 999,
              border: `1px solid ${error ? '#E88080' : '#EDD9DB'}`,
              padding: '0 20px', fontSize: 16,
              fontFamily: 'var(--font-dm-sans), sans-serif',
              background: '#FFFFFF', color: '#2A2A2A',
              outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
          />

          {error && (
            <p style={{
              fontSize: 12, color: '#E88080',
              textAlign: 'center', margin: 0,
            }}>
              That&apos;s not quite right — try again.
            </p>
          )}

          <button
            onClick={attempt}
            disabled={!value}
            style={{
              width: '100%', height: 52, borderRadius: 999,
              background: value ? '#2A2A2A' : '#EDD9DB',
              color: value ? '#FAF7F4' : '#7A7170',
              fontSize: 13, fontWeight: 500,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              border: 'none', cursor: value ? 'pointer' : 'default',
              transition: 'background 0.2s, color 0.2s',
              fontFamily: 'var(--font-dm-sans), sans-serif',
            }}
          >
            Enter
          </button>
        </div>
      </div>
    </>
  );
}
