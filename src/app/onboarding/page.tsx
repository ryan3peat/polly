'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { PhotoCropModal } from '@/components/ui/PhotoCropModal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type Step = 'birthday' | 'photo' | 'style';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('birthday');
  const [birthday, setBirthday] = useState('');
  const [stylePref, setStylePref] = useState('');
  const [birthdayError, setBirthdayError] = useState('');
  const [saving, setSaving] = useState(false);

  // Photo state
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

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
    if (v.length === 2 && birthday.length === 1) v = v + '/';
    if (v.length === 5 && birthday.length === 4) v = v + '/';
    setBirthday(v);
    setBirthdayError('');
  }

  function handleBirthdayContinue() {
    if (!birthday.trim()) { setStep('photo'); return; }
    if (!validateBirthday(birthday)) {
      setBirthdayError('Please use DD/MM/YY format');
      return;
    }
    setStep('photo');
  }

  async function handleCropConfirm(blob: Blob) {
    setCropFile(null);
    setPhotoUploading(true);
    try {
      const path = `profile/profile-${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('wardrobe-photos')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('wardrobe-photos').getPublicUrl(data.path);
      setPhotoUrl(urlData.publicUrl);
    } catch { /* silently fail */ }
    finally { setPhotoUploading(false); }
  }

  async function handleFinish() {
    setSaving(true);
    await fetch('/api/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        birthday: birthday.trim() || null,
        style_pref: stylePref.trim() || null,
        photo_url: photoUrl || null,
      }),
    });
    router.replace('/');
  }

  const goldDivider = <div style={{ width: 40, height: 1, background: '#C4A35A', marginBottom: 8 }} />;

  const stepDots = (
    <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
      {(['birthday', 'photo', 'style'] as Step[]).map(s => (
        <div
          key={s}
          style={{
            width: step === s ? 18 : 6,
            height: 6,
            borderRadius: 999,
            background: step === s ? '#C9848A' : '#EDD9DB',
            transition: 'width 0.2s, background 0.2s',
          }}
        />
      ))}
    </div>
  );

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
      {cropFile && (
        <PhotoCropModal
          file={cropFile}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropFile(null)}
        />
      )}

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

      {/* ── Step 1: Birthday ── */}
      {step === 'birthday' && (
        <>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 26, fontWeight: 400, fontStyle: 'italic',
              color: '#2A2A2A', margin: '0 0 4px', textAlign: 'center',
            }}
          >
            When&apos;s your birthday?
          </h1>
          {goldDivider}
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#7A7170', textAlign: 'center', marginBottom: 28 }}>
            We&apos;ll send you exclusive birthday deals
          </p>
          {stepDots}

          <input
            type="text"
            placeholder="DD / MM / YY"
            value={birthday}
            onChange={handleBirthdayInput}
            maxLength={8}
            inputMode="numeric"
            style={{
              width: '100%', maxWidth: 280,
              padding: '14px 20px', borderRadius: 999,
              border: `1px solid ${birthdayError ? '#E88080' : '#EDD9DB'}`,
              background: '#FFFFFF',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 16, color: '#2A2A2A',
              textAlign: 'center', outline: 'none',
              letterSpacing: '0.1em', marginBottom: 8,
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
              marginTop: 16, padding: '14px 40px', borderRadius: 999,
              background: '#2A2A2A', color: '#FAF7F4',
              fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
              border: 'none', cursor: 'pointer', letterSpacing: '0.05em',
            }}
          >
            Continue →
          </button>

          <button
            onClick={() => setStep('photo')}
            style={{
              marginTop: 16, background: 'none', border: 'none',
              fontFamily: "'DM Sans', sans-serif", fontSize: 13,
              color: '#7A7170', cursor: 'pointer', textDecoration: 'underline',
            }}
          >
            Skip for now
          </button>
        </>
      )}

      {/* ── Step 2: Profile Photo ── */}
      {step === 'photo' && (
        <>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 26, fontWeight: 400, fontStyle: 'italic',
              color: '#2A2A2A', margin: '0 0 4px', textAlign: 'center',
            }}
          >
            Add a profile photo
          </h1>
          {goldDivider}
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#7A7170', textAlign: 'center', marginBottom: 28 }}>
            Put a face to your style
          </p>
          {stepDots}

          {/* Photo circle */}
          <div
            onClick={() => !photoUploading && photoInputRef.current?.click()}
            style={{
              width: 120, height: 120, borderRadius: '50%',
              border: '2px dashed #EDD9DB',
              background: photoUrl ? 'transparent' : '#FDF0F1',
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: photoUploading ? 'default' : 'pointer',
              marginBottom: 16,
              position: 'relative',
              flexShrink: 0,
            }}
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <svg viewBox="0 0 24 24" style={{ width: 36, height: 36, stroke: '#C9848A', fill: 'none', strokeWidth: 1.2 }}>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            )}
            {photoUploading && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(250,247,244,0.75)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 20, height: 20, border: '2px solid #EDD9DB', borderTopColor: '#C9848A', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              </div>
            )}
          </div>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) { setCropFile(file); if (photoInputRef.current) photoInputRef.current.value = ''; }
            }}
          />

          {photoUrl ? (
            <button
              onClick={() => photoInputRef.current?.click()}
              style={{
                marginBottom: 24, background: 'none', border: 'none',
                fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                color: '#C9848A', cursor: 'pointer', textDecoration: 'underline',
              }}
            >
              Change photo
            </button>
          ) : (
            <button
              onClick={() => photoInputRef.current?.click()}
              style={{
                marginBottom: 24, padding: '12px 32px', borderRadius: 999,
                background: 'transparent', border: '1px solid #EDD9DB',
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#2A2A2A',
                cursor: 'pointer',
              }}
            >
              Choose photo
            </button>
          )}

          <button
            onClick={() => setStep('style')}
            disabled={photoUploading}
            style={{
              padding: '14px 40px', borderRadius: 999,
              background: '#2A2A2A', color: '#FAF7F4',
              fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
              border: 'none', cursor: photoUploading ? 'default' : 'pointer',
              letterSpacing: '0.05em', opacity: photoUploading ? 0.6 : 1,
            }}
          >
            Continue →
          </button>

          <button
            onClick={() => setStep('style')}
            disabled={photoUploading}
            style={{
              marginTop: 16, background: 'none', border: 'none',
              fontFamily: "'DM Sans', sans-serif", fontSize: 13,
              color: '#7A7170', cursor: 'pointer', textDecoration: 'underline',
            }}
          >
            Skip for now
          </button>
        </>
      )}

      {/* ── Step 3: My Style ── */}
      {step === 'style' && (
        <>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 26, fontWeight: 400, fontStyle: 'italic',
              color: '#2A2A2A', margin: '0 0 4px', textAlign: 'center',
            }}
          >
            Tell us about your style
          </h1>
          {goldDivider}
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#7A7170',
              textAlign: 'center', marginBottom: 28, lineHeight: 1.5, maxWidth: 300,
            }}
          >
            We&apos;ll personalise your outfit suggestions based on this
          </p>
          {stepDots}

          <textarea
            placeholder="e.g. Polished professional who pairs bold jewel tones with clean neutrals. Court-ready but never boring."
            value={stylePref}
            onChange={e => setStylePref(e.target.value.slice(0, 280))}
            rows={5}
            style={{
              width: '100%', maxWidth: 340,
              padding: '14px 18px', borderRadius: 16,
              border: '1px solid #EDD9DB', background: '#FFFFFF',
              fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#2A2A2A',
              outline: 'none', resize: 'none', lineHeight: 1.6, marginBottom: 4,
            }}
          />
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#7A7170',
              alignSelf: 'flex-end', maxWidth: 340, width: '100%',
              textAlign: 'right', marginBottom: 16,
            }}
          >
            {stylePref.length} / 280
          </p>

          <button
            onClick={handleFinish}
            disabled={saving}
            style={{
              padding: '14px 40px', borderRadius: 999,
              background: '#C9848A', color: '#FFFFFF',
              fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
              border: 'none', cursor: saving ? 'default' : 'pointer',
              letterSpacing: '0.05em', opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Get started →'}
          </button>

          <button
            onClick={handleFinish}
            disabled={saving}
            style={{
              marginTop: 16, background: 'none', border: 'none',
              fontFamily: "'DM Sans', sans-serif", fontSize: 13,
              color: '#7A7170', cursor: 'pointer', textDecoration: 'underline',
            }}
          >
            Skip for now
          </button>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
