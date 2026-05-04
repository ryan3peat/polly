'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'birthday' | 'style';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('birthday');
  const [birthday, setBirthday] = useState('');
  const [stylePref, setStylePref] = useState('');
  const [birthdayError, setBirthdayError] = useState('');
  const [saving, setSaving] = useState(false);

  function validateBirthday(val: string): boolean {
    const parts = val.split('/');
    if (parts.length !== 3) return false;
    const [d, m, y] = parts.map(p => parseInt(p.trim(), 10));
    if (isNaN(d) || isNaN(m) || isNaN(y)) return false;
    if (d < 1 || d > 31 || m < 1 || m > 12) return false;
    return true;
  }

  function handleBirthdayInput(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/[^\d/]/g, '');
    // Auto-insert slashes
    if (v.length === 2 && birthday.length === 1) v = v + '/';
    if (v.length === 5 && birthday.length === 4) v = v + '/';
    setBirthday(v);
    setBirthdayError('');
  }

  function handleBirthdayContinue() {
    if (!birthday.trim()) { setStep('style'); return; } // allow skip
    if (!validateBirthday(birthday)) {
      setBirthdayError('Please use DD/MM/YY format');
      return;
    }
    setStep('style');
  }

  async function handleFinish() {
    setSaving(true);
    await fetch('/api/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ birthday: birthday.trim() || null, style_pref: stylePref.trim() || null }),
    });
    router.replace('/');
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#FAF7F4',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        maxWidth: 430,
        margin: '0 auto',
      }}
    >
      {/* Monogram */}
      <div
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 28,
          fontWeight: 300,
          letterSpacing: '0.2em',
          color: '#2A2A2A',
          marginBottom: 6,
        }}
      >
        P·C
      </div>

      {step === 'birthday' && (
        <>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 26,
              fontWeight: 400,
              fontStyle: 'italic',
              color: '#2A2A2A',
              margin: '0 0 4px',
              textAlign: 'center',
            }}
          >
            When&apos;s your birthday?
          </h1>
          <div style={{ width: 40, height: 1, background: '#C4A35A', marginBottom: 8 }} />
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: '#7A7170',
              textAlign: 'center',
              marginBottom: 32,
            }}
          >
            We&apos;ll send you exclusive birthday deals
          </p>

          <input
            type="text"
            placeholder="DD / MM / YY"
            value={birthday}
            onChange={handleBirthdayInput}
            maxLength={8}
            inputMode="numeric"
            style={{
              width: '100%',
              maxWidth: 280,
              padding: '14px 20px',
              borderRadius: 999,
              border: `1px solid ${birthdayError ? '#E88080' : '#EDD9DB'}`,
              background: '#FFFFFF',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 16,
              color: '#2A2A2A',
              textAlign: 'center',
              outline: 'none',
              letterSpacing: '0.1em',
              marginBottom: 8,
            }}
          />
          {birthdayError && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#E88080', marginBottom: 8 }}>
              {birthdayError}
            </p>
          )}

          <button
            onClick={handleBirthdayContinue}
            style={{
              marginTop: 16,
              padding: '14px 40px',
              borderRadius: 999,
              background: '#2A2A2A',
              color: '#FAF7F4',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
          >
            Continue →
          </button>

          <button
            onClick={() => setStep('style')}
            style={{
              marginTop: 16,
              background: 'none',
              border: 'none',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: '#7A7170',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Skip for now
          </button>
        </>
      )}

      {step === 'style' && (
        <>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 26,
              fontWeight: 400,
              fontStyle: 'italic',
              color: '#2A2A2A',
              margin: '0 0 4px',
              textAlign: 'center',
            }}
          >
            Tell us about your style
          </h1>
          <div style={{ width: 40, height: 1, background: '#C4A35A', marginBottom: 8 }} />
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: '#7A7170',
              textAlign: 'center',
              marginBottom: 24,
              lineHeight: 1.5,
              maxWidth: 300,
            }}
          >
            We&apos;ll personalise your outfit suggestions based on this
          </p>

          <textarea
            placeholder="e.g. Polished professional who pairs bold jewel tones with clean neutrals. Court-ready but never boring."
            value={stylePref}
            onChange={e => setStylePref(e.target.value.slice(0, 280))}
            rows={5}
            style={{
              width: '100%',
              maxWidth: 340,
              padding: '14px 18px',
              borderRadius: 16,
              border: '1px solid #EDD9DB',
              background: '#FFFFFF',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: '#2A2A2A',
              outline: 'none',
              resize: 'none',
              lineHeight: 1.6,
              marginBottom: 4,
            }}
          />
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              color: '#7A7170',
              alignSelf: 'flex-end',
              maxWidth: 340,
              width: '100%',
              textAlign: 'right',
              marginBottom: 16,
            }}
          >
            {stylePref.length} / 280
          </p>

          <button
            onClick={handleFinish}
            disabled={saving}
            style={{
              padding: '14px 40px',
              borderRadius: 999,
              background: '#C9848A',
              color: '#FFFFFF',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              border: 'none',
              cursor: saving ? 'default' : 'pointer',
              letterSpacing: '0.05em',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Get started →'}
          </button>

          <button
            onClick={handleFinish}
            disabled={saving}
            style={{
              marginTop: 16,
              background: 'none',
              border: 'none',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: '#7A7170',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Skip for now
          </button>
        </>
      )}
    </div>
  );
}
