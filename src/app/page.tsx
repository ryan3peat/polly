'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import SplashScreen from '@/components/splash/SplashScreen';
import { PhotoCropModal } from '@/components/ui/PhotoCropModal';
import { supabase } from '@/lib/supabase';

const PHOTOS = [
  '/photos/p0.jpg', '/photos/p1.jpg', '/photos/p2.jpg',
  '/photos/p3.jpg', '/photos/p4.jpg', '/photos/p5.jpg',
  '/photos/p6.jpg', '/photos/p7.jpg', '/photos/p8.jpg',
];

const QUOTES = [
  { text: 'The world is full of magic things, patiently waiting for our senses to grow sharper.', by: 'W.B. Yeats' },
  { text: 'She is clothed in strength and dignity, and she laughs without fear of the future.', by: 'Proverbs 31:25' },
  { text: 'In the middle of difficulty lies opportunity.', by: 'Albert Einstein' },
  { text: 'You are enough. You have enough. You do enough.', by: 'Anonymous' },
  { text: 'The most wasted of days is one without laughter.', by: 'E.E. Cummings' },
  { text: 'Elegance is not about being noticed, it is about being remembered.', by: 'Giorgio Armani' },
  { text: 'Life is not measured by the number of breaths we take, but by the moments that take our breath away.', by: 'Maya Angelou' },
  { text: 'To live a creative life we must lose our fear of being wrong.', by: 'Joseph Chilton Pearce' },
  { text: 'Beauty is not in the face; beauty is a light in the heart.', by: 'Kahlil Gibran' },
  { text: 'The secret of getting ahead is getting started.', by: 'Mark Twain' },
  { text: 'She believed she could, so she did.', by: 'R.S. Grey' },
  { text: 'Simplicity is the ultimate sophistication.', by: 'Leonardo da Vinci' },
  { text: 'A woman who wears perfume has a future.', by: 'Coco Chanel' },
  { text: 'Fashion is the armour to survive everyday life.', by: 'Bill Cunningham' },
];

const ORDINALS = [
  '', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh',
  'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth',
  'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth', 'twentieth',
  'twenty-first', 'twenty-second', 'twenty-third', 'twenty-fourth', 'twenty-fifth',
  'twenty-sixth', 'twenty-seventh', 'twenty-eighth', 'twenty-ninth', 'thirtieth', 'thirty-first',
];
const DAYS   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function formatLongDate(d: Date) {
  return `${DAYS[d.getDay()]}, the ${ORDINALS[d.getDate()]} of ${MONTHS[d.getMonth()]}`;
}

function getDailyQuote() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.now() - start.getTime()) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
}

// Weather condition → simple label
function weatherIcon(desc: string): string {
  const d = desc.toLowerCase();
  if (d.includes('sunny') || d.includes('clear'))              return '☀';
  if (d.includes('partly') || d.includes('cloud'))             return '⛅';
  if (d.includes('overcast'))                                   return '☁';
  if (d.includes('rain') || d.includes('drizzle'))             return '🌧';
  if (d.includes('thunder') || d.includes('storm'))            return '⛈';
  if (d.includes('fog') || d.includes('mist') || d.includes('haz')) return '🌫';
  return '🌡';
}

interface DailyBrief {
  weather: { tempC: number; feelsC: number; desc: string; humidity: number };
  outfits: string[];
  weatherTip: string;
  areaName?: string;
}

const PROFILE_PHOTO_KEY = 'polly_profile_photo';

// ── Landing page ─────────────────────────────────────────────
function LandingPage() {
  const router = useRouter();
  const today  = new Date();
  const dateStr = formatLongDate(today);
  const quote   = getDailyQuote();

  const photoInputRef = useRef<HTMLInputElement>(null);
  const [profilePhoto, setProfilePhoto]   = useState('/photos/p0.jpg');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [cropFile, setCropFile]           = useState<File | null>(null);

  const [todayBrief, setTodayBrief]       = useState<DailyBrief | null>(null);
  const [tomorrowBrief, setTomorrowBrief] = useState<DailyBrief | null>(null);
  const [viewDay, setViewDay]             = useState<'today' | 'tomorrow'>('today');
  const [tomorrowLoading, setTomorrowLoading] = useState(false);
  const [briefError, setBriefError]       = useState(false);
  const coords = useRef<{ lat: number; lon: number } | null>(null);

  const brief = viewDay === 'today' ? todayBrief : tomorrowBrief;

  useEffect(() => {
    // Show cached profile photo instantly, then sync from Supabase
    const cached = localStorage.getItem(PROFILE_PHOTO_KEY);
    if (cached) setProfilePhoto(cached);

    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.url) {
          setProfilePhoto(data.url);
          localStorage.setItem(PROFILE_PHOTO_KEY, data.url);
        }
      })
      .catch(() => { /* keep cached/default */ });
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

      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl }),
      });
    } catch { /* silently fail */ }
    finally { setPhotoUploading(false); }
  };

  async function fetchBrief(day: 0 | 1): Promise<DailyBrief | null> {
    const dateStr = today.toDateString();
    const cacheKey = `polly_brief_${day === 0 ? 'today' : 'tomorrow'}_${dateStr}`;
    try {
      const hit = localStorage.getItem(cacheKey);
      if (hit) return JSON.parse(hit) as DailyBrief;
    } catch { /* ignore */ }

    const params = new URLSearchParams({ day: String(day) });
    if (coords.current) {
      params.set('lat', String(coords.current.lat));
      params.set('lon', String(coords.current.lon));
    }

    const data = await fetch(`/api/daily-brief?${params}`).then(r => r.json());
    if (data.weather) {
      try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch { /* ignore */ }
      return data as DailyBrief;
    }
    return null;
  }

  useEffect(() => {
    // Try to get the user's location, then fetch today's brief
    function loadToday() {
      fetchBrief(0)
        .then(data => { if (data) setTodayBrief(data); else setBriefError(true); })
        .catch(() => setBriefError(true));
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          coords.current = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          loadToday();
        },
        () => loadToday(), // permission denied — fetch without coords (wttr.in uses IP)
        { timeout: 5000 },
      );
    } else {
      loadToday();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleViewTomorrow() {
    setViewDay('tomorrow');
    if (tomorrowBrief) return;
    setTomorrowLoading(true);
    try {
      const data = await fetchBrief(1);
      if (data) setTomorrowBrief(data);
    } catch { /* ignore */ }
    finally { setTomorrowLoading(false); }
  }

  const iconStroke: React.CSSProperties = {
    width: 22, height: 22, stroke: '#C9848A', fill: 'none', strokeWidth: 1.2,
  };

  return (
    <>
    {cropFile && (
      <PhotoCropModal
        file={cropFile}
        onConfirm={handleCropConfirm}
        onCancel={() => setCropFile(null)}
      />
    )}
    <div style={{
      background: 'linear-gradient(180deg, #FAF7F4 0%, #FFFFFF 60%, #FAF7F4 100%)',
      minHeight: '100dvh', overflowX: 'hidden',
      fontFamily: 'var(--font-dm-sans), sans-serif',
    }}>

      {/* Edition strip */}
      <div style={{ textAlign: 'center', marginTop: 28, padding: '0 26px' }}>
        <div style={{ fontSize: 9.5, letterSpacing: '0.32em', textTransform: 'uppercase', color: '#C4A35A', fontWeight: 500 }}>
          The Daily Edition
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8 }}>
          <span style={{ height: 1, width: 18, background: '#EDD9DB', display: 'block' }} />
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#C4A35A', display: 'block' }} />
          <span style={{ height: 1, width: 18, background: '#EDD9DB', display: 'block' }} />
        </div>
        <div style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontStyle: 'italic', fontSize: 13, color: '#5A5A5A', marginTop: 6,
        }}>
          {dateStr}
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '30px 28px 0' }}>
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
            width: 188, height: 188, borderRadius: '50%',
            margin: '0 auto', position: 'relative',
            overflow: 'hidden', background: '#F4ECE6',
            boxShadow: '0 18px 40px -20px rgba(201,132,138,0.35)',
            border: '1px solid #C4A35A', cursor: 'pointer',
          }}
        >
          <div style={{
            position: 'absolute', inset: 7, borderRadius: '50%',
            border: '1px solid rgba(196,163,90,0.25)', pointerEvents: 'none', zIndex: 1,
          }} />
          <img
            src={profilePhoto}
            alt="Polly"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
          />
          {/* Edit overlay */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: photoUploading ? 'rgba(42,42,42,0.45)' : 'rgba(42,42,42,0)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            paddingBottom: 14, zIndex: 2,
            transition: 'background 0.2s',
          }}>
            <span style={{
              fontSize: 10, fontFamily: 'var(--font-dm-sans), sans-serif',
              color: '#FFFFFF', letterSpacing: '0.12em', textTransform: 'uppercase',
              background: 'rgba(42,42,42,0.55)', borderRadius: 20,
              padding: '3px 10px', opacity: photoUploading ? 1 : 0,
              transition: 'opacity 0.2s',
            }}>
              {photoUploading ? 'Uploading…' : 'Change'}
            </span>
          </div>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontWeight: 500, fontSize: 54, lineHeight: 1,
          letterSpacing: '-0.015em', marginTop: 28, color: '#2A2A2A',
        }}>
          Polly&apos;s <em style={{ fontStyle: 'italic', fontWeight: 400, color: '#C9848A' }}>App</em>
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 }}>
          <div style={{ height: 1, width: 32, background: '#C4A35A' }} />
          <div style={{ width: 5, height: 5, background: '#C4A35A', transform: 'rotate(45deg)' }} />
          <div style={{ height: 1, width: 32, background: '#C4A35A' }} />
        </div>

        <p style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontStyle: 'italic', fontWeight: 400, fontSize: 22,
          color: '#5A5A5A', marginTop: 14, letterSpacing: '0.005em',
        }}>
          Your daily world, curated.
        </p>
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 28px 0' }}>
        <button
          onClick={() => router.push('/style')}
          style={{
            width: '100%', height: 50, borderRadius: 999,
            background: '#2A2A2A', color: '#FAF7F4',
            fontFamily: 'var(--font-dm-sans), sans-serif',
            fontSize: 13, fontWeight: 500,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}
        >
          Open today&apos;s edition
          <span style={{ fontSize: 14 }}>→</span>
        </button>
      </div>

      {/* Weather & outfit brief */}
      {!briefError && (
        <div style={{ margin: '36px 28px 0', borderRadius: 20, border: '1px solid #EDD9DB', background: '#FFFFFF', overflow: 'hidden' }}>
          {/* Weather bar */}
          <div style={{
            background: 'linear-gradient(135deg, #FAF7F4 0%, #FDF0F1 100%)',
            padding: '18px 20px 16px',
            borderBottom: '1px solid #EDD9DB',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 9.5, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#C4A35A', fontWeight: 500 }}>
                  {brief?.areaName || 'Your Location'} · {viewDay === 'today' ? 'Today' : 'Tomorrow'}
                </div>
                {/* Today / Tomorrow toggle */}
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['today', 'tomorrow'] as const).map((day) => (
                    <button
                      key={day}
                      onClick={() => {
                        if (day === 'tomorrow') handleViewTomorrow();
                        else setViewDay('today');
                      }}
                      style={{
                        fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
                        fontFamily: 'var(--font-dm-sans), sans-serif',
                        padding: '3px 9px', borderRadius: 999, border: 'none',
                        cursor: 'pointer',
                        background: viewDay === day ? '#C9848A' : 'transparent',
                        color: viewDay === day ? '#FFFFFF' : '#7A7170',
                        fontWeight: viewDay === day ? 500 : 400,
                        transition: 'background 0.15s, color 0.15s',
                      }}
                    >
                      {day === 'today' ? 'Today' : 'Tomorrow'}
                    </button>
                  ))}
                </div>
              </div>
              {(brief && !(viewDay === 'tomorrow' && tomorrowLoading)) ? (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 44, fontWeight: 400, lineHeight: 1, color: '#2A2A2A' }}>
                    {brief.weather.tempC}°
                  </span>
                  <span style={{ fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 13, color: '#5A5A5A' }}>
                    {brief.weather.desc}
                  </span>
                </div>
              ) : (
                <div style={{ height: 44, display: 'flex', alignItems: 'center' }}>
                  <div className="skeleton-pulse" style={{ width: 80, height: 36, borderRadius: 8, background: '#F2D4D7' }} />
                </div>
              )}
              {(brief && !(viewDay === 'tomorrow' && tomorrowLoading)) && (
                <div style={{ fontSize: 11, color: '#7A7170', marginTop: 4 }}>
                  Feels like {brief.weather.feelsC}° · {brief.weather.humidity}% humidity
                </div>
              )}
            </div>
            <div style={{ fontSize: 46, lineHeight: 1, opacity: (brief && !(viewDay === 'tomorrow' && tomorrowLoading)) ? 1 : 0.3, marginLeft: 12 }}>
              {(brief && !(viewDay === 'tomorrow' && tomorrowLoading)) ? weatherIcon(brief.weather.desc) : '🌡'}
            </div>
          </div>

          {/* Outfit suggestions */}
          <div style={{ padding: '16px 20px 20px' }}>
            <div style={{ fontSize: 9.5, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#C4A35A', fontWeight: 500, marginBottom: 14 }}>
              {viewDay === 'today' ? 'What to wear today' : 'What to wear tomorrow'}
            </div>
            {(brief && !(viewDay === 'tomorrow' && tomorrowLoading)) ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {brief.outfits.map((outfit, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{
                        fontFamily: 'var(--font-cormorant), serif',
                        fontStyle: 'italic', fontSize: 13, color: '#C4A35A',
                        lineHeight: 1.5, flexShrink: 0,
                      }}>
                        {['I', 'II', 'III'][i]}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-cormorant), serif',
                        fontStyle: 'italic', fontSize: 16, color: '#2A2A2A', lineHeight: 1.45,
                      }}>
                        {outfit}
                      </span>
                    </div>
                  ))}
                </div>
                {brief.weatherTip && (
                  <p style={{
                    marginTop: 14, fontSize: 11.5, color: '#7A7170',
                    fontStyle: 'italic', lineHeight: 1.5,
                    paddingTop: 12, borderTop: '1px solid #EDD9DB',
                  }}>
                    {brief.weatherTip}
                  </p>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[80, 95, 70].map((w, i) => (
                  <div key={i} className="skeleton-pulse" style={{ height: 18, borderRadius: 6, background: '#F2D4D7', width: `${w}%` }} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section header */}
      <div style={{ textAlign: 'center', marginTop: 44, padding: '0 28px' }}>
        <div style={{ fontSize: 9.5, letterSpacing: '0.32em', textTransform: 'uppercase', color: '#C4A35A', fontWeight: 500 }}>
          Inside this morning
        </div>
        <h2 style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontWeight: 400, fontSize: 30, lineHeight: 1.1, marginTop: 10, color: '#2A2A2A',
        }}>
          Three small <em style={{ fontStyle: 'italic', color: '#C9848A' }}>indulgences,</em><br />chosen for you.
        </h2>
      </div>

      {/* Feature cards — Style, Deals, Wardrobe */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '24px 20px 0' }}>
        {[
          {
            num: 'N° I', title: 'Style', href: '/style',
            desc: 'Fashion finds curated for your taste.',
            icon: (
              <svg viewBox="0 0 24 24" style={iconStroke}>
                <path d="M8 2l-4 5h3.5v13h9V7H20L16 2" />
                <path d="M8 2c0 2.5 2 4 4 4s4-1.5 4-4" />
              </svg>
            ),
          },
          {
            num: 'N° II', title: 'Deals', href: '/deals',
            desc: 'The best offers in Hong Kong today.',
            icon: (
              <svg viewBox="0 0 24 24" style={iconStroke}>
                <path d="M3 12V4h8l10 10-8 8L3 12z"/>
                <circle cx="8" cy="8" r="1.4" fill="#C9848A" stroke="none"/>
              </svg>
            ),
          },
          {
            num: 'N° III', title: 'Wardrobe', href: '/dress',
            desc: 'Log outfits, build your wardrobe, get dressed.',
            icon: (
              <svg viewBox="0 0 24 24" style={iconStroke}>
                <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round"/>
                <rect x="7" y="2" width="10" height="4" rx="1"/>
              </svg>
            ),
          },
        ].map(card => (
          <button
            key={card.title}
            onClick={() => router.push(card.href)}
            style={{
              background: '#FFFFFF', border: '1px solid #EDD9DB',
              borderRadius: 16, padding: '18px 10px', textAlign: 'center',
              cursor: 'pointer',
              boxShadow: '0 1px 0 rgba(237,217,219,0.4), 0 8px 22px -16px rgba(201,132,138,0.18)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              minHeight: 170,
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: '1px solid #EDD9DB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#FDFAF8',
            }}>
              {card.icon}
            </div>
            <div style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontStyle: 'italic', fontSize: 11, color: '#C4A35A', letterSpacing: '0.05em',
            }}>
              {card.num}
            </div>
            <h3 style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontWeight: 500, fontSize: 20, lineHeight: 1, color: '#2A2A2A',
            }}>
              {card.title}
            </h3>
            <p style={{ fontSize: 10.5, lineHeight: 1.45, color: '#5A5A5A', padding: '0 2px' }}>
              {card.desc}
            </p>
          </button>
        ))}
      </div>

      {/* Daily quote */}
      <div style={{
        margin: '46px 28px 60px',
        padding: '30px 22px 28px',
        borderTop: '1px solid #EDD9DB',
        borderBottom: '1px solid #EDD9DB',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontStyle: 'italic', fontSize: 42, lineHeight: 1, color: '#C4A35A', marginBottom: 6,
        }}>
          "
        </div>
        <p style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontStyle: 'italic', fontWeight: 400, fontSize: 19,
          lineHeight: 1.35, color: '#2A2A2A',
        }}>
          {quote.text}
        </p>
        <div style={{
          marginTop: 14, fontSize: 9.5, letterSpacing: '0.3em',
          textTransform: 'uppercase', color: '#5A5A5A',
        }}>
          — {quote.by}
        </div>
      </div>

    </div>
    </>
  );
}

// ── Root ─────────────────────────────────────────────────────
export default function Home() {
  const alreadySeen = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('splash_seen') === '1';
  const [splashComplete, setSplashComplete] = useState(alreadySeen);
  const [ready, setReady]                  = useState(false);
  const [splashPhotos, setSplashPhotos]    = useState(PHOTOS);
  const { isLoaded, isSignedIn }           = useAuth();
  const router                             = useRouter();

  useEffect(() => {
    // Show cached splash photo instantly, then fetch latest from Supabase
    const cached = localStorage.getItem(PROFILE_PHOTO_KEY);
    if (cached) setSplashPhotos([cached, ...PHOTOS.slice(1)] as typeof PHOTOS);
    setReady(true);

    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.url) {
          localStorage.setItem(PROFILE_PHOTO_KEY, data.url);
          setSplashPhotos([data.url, ...PHOTOS.slice(1)] as typeof PHOTOS);
        }
      })
      .catch(() => { /* keep cached */ });
  }, []);

  // After splash, redirect to sign-in if not authenticated
  useEffect(() => {
    if (!splashComplete || !isLoaded) return;
    if (!isSignedIn) router.replace('/sign-in');
  }, [splashComplete, isLoaded, isSignedIn, router]);

  if (!ready) return null;

  if (!splashComplete) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#FAF7F4' }}>
        <SplashScreen onComplete={() => { sessionStorage.setItem('splash_seen', '1'); setSplashComplete(true); }} photos={splashPhotos} />
      </div>
    );
  }

  if (!isLoaded || !isSignedIn) return null;

  return <LandingPage />;
}
