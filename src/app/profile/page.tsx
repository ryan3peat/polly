'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { PhotoCropModal } from '@/components/ui/PhotoCropModal';
import { supabase } from '@/lib/supabase';

const PROFILE_PHOTO_KEY = 'polly_profile_photo';

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 24px' }}>
      <div style={{ flex: 1, height: 1, background: '#EDD9DB' }} />
      <div style={{ width: 4, height: 4, background: '#C4A35A', transform: 'rotate(45deg)' }} />
      <div style={{ flex: 1, height: 1, background: '#EDD9DB' }} />
    </div>
  );
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const router = useRouter();

  const photoInputRef = useRef<HTMLInputElement>(null);
  const [cropFile, setCropFile]         = useState<File | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  const [stylePref, setStylePref]       = useState('');
  const [styleSaving, setStyleSaving]   = useState(false);
  const [styleSaved, setStyleSaved]     = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting]         = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem(PROFILE_PHOTO_KEY);
    if (cached) setProfilePhoto(cached);

    fetch('/api/user/profile')
      .then(r => r.json())
      .then(data => {
        if (data.profile?.photo_url) {
          setProfilePhoto(data.profile.photo_url);
        }
        if (data.profile?.style_pref) {
          setStylePref(data.profile.style_pref);
        }
      })
      .catch(() => { /* keep cached */ });
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleCropConfirm = async (blob: Blob) => {
    setCropFile(null);
    setPhotoUploading(true);
    try {
      const path = `profile/profile-${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('wardrobe-photos')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('wardrobe-photos').getPublicUrl(data.path);
      const newUrl = urlData.publicUrl;

      setProfilePhoto(newUrl);
      localStorage.setItem(PROFILE_PHOTO_KEY, newUrl);

      await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: newUrl }),
      });
    } catch { /* silently fail */ }
    finally { setPhotoUploading(false); }
  };

  const handleSaveStyle = async () => {
    setStyleSaving(true);
    await fetch('/api/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ style_pref: stylePref }),
    });
    setStyleSaving(false);
    setStyleSaved(true);
    setTimeout(() => setStyleSaved(false), 2500);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    await fetch('/api/user/delete', { method: 'DELETE' });
    await signOut();
    router.replace('/sign-in');
  };

  if (!isLoaded) return null;

  const name  = user?.fullName ?? user?.firstName ?? 'User';
  const email = user?.primaryEmailAddress?.emailAddress ?? '';

  return (
    <div style={{
      background: '#FAF7F4',
      minHeight: '100dvh',
      fontFamily: 'var(--font-dm-sans), sans-serif',
    }}>
      {cropFile && (
        <PhotoCropModal
          file={cropFile}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropFile(null)}
        />
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '40px 24px 28px' }}>
        <div style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase',
          color: '#C4A35A', fontWeight: 500, marginBottom: 12,
        }}>
          My Profile
        </div>

        {/* Profile photo */}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handlePhotoChange}
        />
        <div
          onClick={() => photoInputRef.current?.click()}
          style={{
            width: 100, height: 100, borderRadius: '50%',
            margin: '0 auto 16px', position: 'relative',
            overflow: 'hidden', background: '#F4ECE6',
            border: '1px solid #C4A35A', cursor: 'pointer',
            boxShadow: '0 8px 24px -8px rgba(201,132,138,0.35)',
          }}
        >
          {profilePhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profilePhoto}
              alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-cormorant), serif', fontSize: 28, color: '#C9848A',
            }}>
              {name[0]?.toUpperCase()}
            </div>
          )}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: photoUploading ? 'rgba(42,42,42,0.45)' : 'rgba(42,42,42,0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s',
          }}>
            {photoUploading && (
              <span style={{ fontSize: 9, color: '#FFFFFF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Uploading…
              </span>
            )}
          </div>
        </div>

        <p style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontSize: 22, fontWeight: 500, color: '#2A2A2A', margin: '0 0 4px',
        }}>
          {name}
        </p>
        <p style={{ fontSize: 13, color: '#7A7170', margin: 0 }}>{email}</p>
        <p style={{ fontSize: 11, color: '#C4A35A', marginTop: 8, letterSpacing: '0.06em' }}>
          Tap photo to change
        </p>
      </div>

      <Divider />

      {/* My Style */}
      <div style={{ padding: '24px 24px' }}>
        <p style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontSize: 18, fontStyle: 'italic', fontWeight: 500,
          color: '#2A2A2A', margin: '0 0 6px',
        }}>
          My Style
        </p>
        <p style={{ fontSize: 12, color: '#7A7170', margin: '0 0 14px', lineHeight: 1.5 }}>
          Describe your personal style — this shapes your outfit suggestions
        </p>
        <textarea
          value={stylePref}
          onChange={e => setStylePref(e.target.value.slice(0, 280))}
          rows={5}
          placeholder="e.g. Polished professional who pairs bold jewel tones with clean neutrals. Court-ready but never boring."
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 12,
            border: '1px solid #EDD9DB',
            background: '#FFFFFF',
            fontFamily: 'var(--font-dm-sans), sans-serif',
            fontSize: 14,
            color: '#2A2A2A',
            outline: 'none',
            resize: 'none',
            lineHeight: 1.6,
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <span style={{ fontSize: 11, color: '#7A7170' }}>{stylePref.length} / 280</span>
          <button
            onClick={handleSaveStyle}
            disabled={styleSaving}
            style={{
              padding: '9px 22px',
              borderRadius: 999,
              background: styleSaved ? '#7A9E7E' : '#C9848A',
              color: '#FFFFFF',
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: 13,
              fontWeight: 500,
              border: 'none',
              cursor: styleSaving ? 'default' : 'pointer',
              transition: 'background 0.3s',
            }}
          >
            {styleSaved ? 'Saved ✓' : styleSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <Divider />

      {/* Account settings */}
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontSize: 18, fontStyle: 'italic', fontWeight: 500,
          color: '#2A2A2A', margin: '0 0 4px',
        }}>
          Account
        </p>

        <button
          onClick={() => openUserProfile()}
          style={accountBtnStyle}
        >
          Change password
        </button>

        <button
          onClick={() => signOut(() => router.replace('/sign-in'))}
          style={accountBtnStyle}
        >
          Sign out
        </button>
      </div>

      <Divider />

      {/* Danger zone */}
      <div style={{ padding: '20px 24px 40px' }}>
        <p style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontSize: 18, fontStyle: 'italic', fontWeight: 500,
          color: '#E88080', margin: '0 0 12px',
        }}>
          Danger zone
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              ...accountBtnStyle,
              color: '#E88080',
              border: '1px solid #F4BCBC',
            }}
          >
            Delete account
          </button>
        ) : (
          <div style={{
            background: '#FFF5F5',
            border: '1px solid #F4BCBC',
            borderRadius: 12,
            padding: '16px',
          }}>
            <p style={{ fontSize: 13, color: '#2A2A2A', margin: '0 0 16px', lineHeight: 1.5 }}>
              This will permanently delete your account and all wardrobe data. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 999,
                  border: '1px solid #EDD9DB', background: '#FFFFFF',
                  color: '#2A2A2A', fontSize: 13, cursor: 'pointer',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                style={{
                  flex: 1, padding: '10px', borderRadius: 999,
                  border: 'none', background: '#E88080',
                  color: '#FFFFFF', fontSize: 13, fontWeight: 500,
                  cursor: deleting ? 'default' : 'pointer',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const accountBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 16px',
  borderRadius: 10,
  border: '1px solid #EDD9DB',
  background: '#FFFFFF',
  color: '#2A2A2A',
  fontFamily: 'var(--font-dm-sans), sans-serif',
  fontSize: 14,
  textAlign: 'left' as const,
  cursor: 'pointer',
};
