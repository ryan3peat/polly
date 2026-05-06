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

interface WtwItem {
  name: string;
  taste: string;
  lastWorn: string;
}

const PROFILE_PHOTO_KEY = 'polly_profile_photo';

// ── Animated What to Wear section ────────────────────────────
function WhatToWearSection({
  brief,
  tomorrowBrief,
  viewDay,
  tomorrowLoading,
  handleViewTomorrow,
  setViewDay,
  wtwItem,
}: {
  brief: DailyBrief | null;
  tomorrowBrief: DailyBrief | null;
  viewDay: 'today' | 'tomorrow';
  tomorrowLoading: boolean;
  handleViewTomorrow: () => void;
  setViewDay: (d: 'today' | 'tomorrow') => void;
  wtwItem: WtwItem | null;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const timersRef  = useRef<ReturnType<typeof setTimeout>[]>([]);
  const startedRef = useRef(false);
  const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // animation state
  const [cardA, setCardA] = useState<'hidden' | 'show' | 'active'>('hidden');
  const [cardB, setCardB] = useState<'hidden' | 'show' | 'active'>('hidden');
  const [cardC, setCardC] = useState<'hidden' | 'show' | 'active'>('hidden');
  const [threadsGo, setThreadsGo]   = useState(false);
  const [outputShow, setOutputShow] = useState(false);
  const [outfitShow, setOutfitShow] = useState([false, false, false]);
  const [tipShow, setTipShow]       = useState(false);

  function clearAll() {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
    if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
    setCardA('hidden'); setCardB('hidden'); setCardC('hidden');
    setThreadsGo(false); setOutputShow(false);
    setOutfitShow([false, false, false]); setTipShow(false);
  }

  function play() {
    clearAll();
    const t = (ms: number, fn: () => void) => {
      const id = setTimeout(fn, ms);
      timersRef.current.push(id);
    };

    t(200,  () => setCardA('show'));
    t(350,  () => setCardA('active'));
    t(550,  () => setCardB('show'));
    t(700,  () => setCardB('active'));
    t(900,  () => setCardC('show'));
    t(1050, () => setCardC('active'));
    t(1500, () => setThreadsGo(true));
    t(2100, () => setOutputShow(true));
    t(2400, () => setOutfitShow([true, false, false]));
    t(2580, () => setOutfitShow([true, true, false]));
    t(2760, () => setOutfitShow([true, true, true]));
    t(3300, () => setTipShow(true));

    loopTimerRef.current = setTimeout(play, 7800);
  }

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          setTimeout(play, 200);
        }
      });
    }, { threshold: 0.3 });
    io.observe(el);
    return () => { io.disconnect(); clearAll(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeBriefLoading = viewDay === 'tomorrow' && tomorrowLoading;
  const activeBrief = viewDay === 'today' ? brief : tomorrowBrief;

  // Card state helpers
  function cardStyle(state: 'hidden' | 'show' | 'active'): React.CSSProperties {
    return {
      background: '#FFFFFF',
      border: state === 'active' ? '1px solid #C9848A' : '1px solid #EDD9DB',
      borderRadius: 11,
      padding: '9px 8px 10px',
      textAlign: 'center' as const,
      position: 'relative' as const,
      opacity: state === 'hidden' ? 0 : 1,
      transform: state === 'hidden' ? 'translateY(8px)' : 'translateY(0)',
      transition: 'opacity 0.5s ease, transform 0.5s ease, border-color 0.4s ease, box-shadow 0.4s ease',
      boxShadow: state === 'active'
        ? '0 0 0 3px rgba(201,132,138,0.12), 0 6px 14px -6px rgba(201,132,138,0.3)'
        : 'none',
    };
  }

  const skeletonLoading = !brief && !activeBriefLoading;

  return (
    <>
      <style>{`
        @keyframes wtw-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(201,132,138,0.5); }
          100% { box-shadow: 0 0 0 12px rgba(201,132,138,0); }
        }
        @keyframes wtw-slide {
          0%   { opacity: 0; transform: translateY(0); }
          20%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(28px); }
        }
        @keyframes wtw-spring {
          0%   { opacity: 0; transform: scale(0.7); }
          60%  { transform: scale(1.06); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div ref={sectionRef} style={{ margin: '36px 28px 0' }}>
        {/* Section header + toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 9.5, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#C4A35A', fontWeight: 500 }}>
            {viewDay === 'today' ? 'What to wear today' : 'What to wear tomorrow'}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['today', 'tomorrow'] as const).map(day => (
              <button
                key={day}
                onClick={() => { if (day === 'tomorrow') handleViewTomorrow(); else setViewDay('today'); }}
                style={{
                  fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  padding: '3px 9px', borderRadius: 999, border: 'none', cursor: 'pointer',
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

        {/* Location + weather meta */}
        {activeBrief && !activeBriefLoading && (
          <div style={{ fontSize: 9.5, color: '#7A7170', marginBottom: 12, letterSpacing: '0.04em' }}>
            {activeBrief.areaName || 'Your Location'} · {activeBrief.weather.tempC}° {activeBrief.weather.desc}
          </div>
        )}

        {/* 3 Input Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7, position: 'relative', zIndex: 2 }}>
          {/* Card A — Weather */}
          <div style={cardStyle(cardA)}>
            <div style={{ fontSize: 7, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#C4A35A', fontWeight: 600, marginBottom: 5 }}>
              Weather
            </div>
            {skeletonLoading ? (
              <div className="skeleton-pulse" style={{ height: 13, borderRadius: 4, background: '#F2D4D7', width: '80%', margin: '0 auto' }} />
            ) : activeBrief && !activeBriefLoading ? (
              <>
                <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 13, fontWeight: 500, color: '#2A2A2A', lineHeight: 1.1 }}>
                  {activeBrief.weather.tempC}°
                </div>
                <div style={{ fontSize: 8.5, color: '#7A7170', marginTop: 3, lineHeight: 1.3, fontStyle: 'italic', fontFamily: 'var(--font-cormorant), serif' }}>
                  {activeBrief.weather.desc}
                </div>
              </>
            ) : (
              <div className="skeleton-pulse" style={{ height: 13, borderRadius: 4, background: '#F2D4D7', width: '80%', margin: '0 auto' }} />
            )}
            {cardA === 'active' && (
              <div style={{
                position: 'absolute', left: '50%', bottom: -3,
                transform: 'translate(-50%, 50%)',
                width: 6, height: 6, borderRadius: '50%',
                background: '#C9848A',
                animation: 'wtw-pulse 1.4s ease-out infinite',
              }} />
            )}
          </div>

          {/* Card B — Style */}
          <div style={cardStyle(cardB)}>
            <div style={{ fontSize: 7, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#C4A35A', fontWeight: 600, marginBottom: 5 }}>
              Your Style
            </div>
            {wtwItem ? (
              <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 12, fontWeight: 500, color: '#2A2A2A', lineHeight: 1.2 }}>
                {wtwItem.taste}
              </div>
            ) : (
              <div className="skeleton-pulse" style={{ height: 13, borderRadius: 4, background: '#F2D4D7', width: '75%', margin: '0 auto' }} />
            )}
            {cardB === 'active' && (
              <div style={{
                position: 'absolute', left: '50%', bottom: -3,
                transform: 'translate(-50%, 50%)',
                width: 6, height: 6, borderRadius: '50%',
                background: '#C9848A',
                animation: 'wtw-pulse 1.4s ease-out infinite',
              }} />
            )}
          </div>

          {/* Card C — Wardrobe / Frequency */}
          <div style={cardStyle(cardC)}>
            <div style={{ fontSize: 7, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#C4A35A', fontWeight: 600, marginBottom: 5 }}>
              Worn last
            </div>
            {wtwItem ? (
              <>
                <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 12, fontWeight: 500, color: '#2A2A2A', lineHeight: 1.1 }}>
                  {wtwItem.name}
                </div>
                <div style={{ fontSize: 8.5, color: '#7A7170', marginTop: 3, lineHeight: 1.3, fontStyle: 'italic', fontFamily: 'var(--font-cormorant), serif' }}>
                  {wtwItem.lastWorn}
                </div>
              </>
            ) : (
              <div className="skeleton-pulse" style={{ height: 13, borderRadius: 4, background: '#F2D4D7', width: '75%', margin: '0 auto' }} />
            )}
            {cardC === 'active' && (
              <div style={{
                position: 'absolute', left: '50%', bottom: -3,
                transform: 'translate(-50%, 50%)',
                width: 6, height: 6, borderRadius: '50%',
                background: '#C9848A',
                animation: 'wtw-pulse 1.4s ease-out infinite',
              }} />
            )}
          </div>
        </div>

        {/* SVG connector threads */}
        <div style={{ position: 'relative', height: 32, margin: '0 0', pointerEvents: 'none', zIndex: 1 }}>
          <svg viewBox="0 0 382 32" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            <path
              d="M 63 0 C 63 16, 191 16, 191 32"
              fill="none" stroke="#C4A35A" strokeWidth="1" strokeLinecap="round" opacity="0.65"
              style={{
                strokeDasharray: 200,
                strokeDashoffset: threadsGo ? 0 : 200,
                transition: 'stroke-dashoffset 0.9s ease',
              }}
            />
            <path
              d="M 191 0 C 191 16, 191 16, 191 32"
              fill="none" stroke="#C4A35A" strokeWidth="1" strokeLinecap="round" opacity="0.65"
              style={{
                strokeDasharray: 200,
                strokeDashoffset: threadsGo ? 0 : 200,
                transition: 'stroke-dashoffset 0.9s ease 0.1s',
              }}
            />
            <path
              d="M 319 0 C 319 16, 191 16, 191 32"
              fill="none" stroke="#C4A35A" strokeWidth="1" strokeLinecap="round" opacity="0.65"
              style={{
                strokeDasharray: 200,
                strokeDashoffset: threadsGo ? 0 : 200,
                transition: 'stroke-dashoffset 0.9s ease 0.2s',
              }}
            />
            {threadsGo && (
              <>
                <circle cx="63" cy="0" r="1.6" fill="#C4A35A" style={{ animation: 'wtw-slide 1.3s ease-in-out infinite' }} />
                <circle cx="191" cy="0" r="1.6" fill="#C4A35A" style={{ animation: 'wtw-slide 1.3s ease-in-out infinite', animationDelay: '0.2s' }} />
                <circle cx="319" cy="0" r="1.6" fill="#C4A35A" style={{ animation: 'wtw-slide 1.3s ease-in-out infinite', animationDelay: '0.4s' }} />
              </>
            )}
          </svg>
        </div>

        {/* Output outfit card */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #EDD9DB',
          borderRadius: 16,
          padding: '14px 16px 16px',
          boxShadow: '0 14px 30px -18px rgba(201,132,138,0.3)',
          position: 'relative',
          opacity: outputShow ? 1 : 0,
          transform: outputShow ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s',
        }}>
          {/* Gold top accent line */}
          <div style={{
            position: 'absolute', top: -1, left: 18, right: 18, height: 1,
            background: 'linear-gradient(90deg, transparent, #C4A35A, transparent)',
          }} />

          <div style={{ fontSize: 8, letterSpacing: '0.32em', textTransform: 'uppercase', color: '#C4A35A', fontWeight: 600, marginBottom: 12 }}>
            Today&apos;s outfits
          </div>

          {/* Outfit suggestions */}
          {(activeBrief && !activeBriefLoading) ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeBrief.outfits.map((outfit, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    opacity: outfitShow[i] ? 1 : 0,
                    transform: outfitShow[i] ? 'scale(1)' : 'scale(0.85)',
                    transition: outfitShow[i]
                      ? 'opacity 0.4s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                      : 'none',
                  }}
                >
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
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[80, 95, 70].map((w, i) => (
                <div key={i} className="skeleton-pulse" style={{ height: 18, borderRadius: 6, background: '#F2D4D7', width: `${w}%` }} />
              ))}
            </div>
          )}

          {/* Weather tip */}
          {activeBrief && activeBrief.weatherTip && (
            <p style={{
              marginTop: 14, fontSize: 11.5, color: '#7A7170',
              fontStyle: 'italic', lineHeight: 1.5,
              paddingTop: 12, borderTop: '1px solid #EDD9DB',
              opacity: tipShow ? 1 : 0,
              transition: 'opacity 0.6s ease 0.6s',
            }}>
              {activeBrief.weatherTip}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

// ── Landing page ─────────────────────────────────────────────
function LandingPage() {
  const router = useRouter();
  const { userId } = useAuth();
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
  const [wtwItem, setWtwItem]             = useState<WtwItem | null>(null);
  const coords = useRef<{ lat: number; lon: number } | null>(null);

  const brief = viewDay === 'today' ? todayBrief : tomorrowBrief;

  useEffect(() => {
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

  // Fetch WTW wardrobe item
  useEffect(() => {
    fetch('/api/wardrobe/wtw-item')
      .then(r => r.json())
      .then(data => { if (data.success && data.item) setWtwItem(data.item); })
      .catch(() => { /* silently fail */ });
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
    const userKey = userId ?? 'anon';
    const cacheKey = `polly_brief_${userKey}_${day === 0 ? 'today' : 'tomorrow'}_${dateStr}`;
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
    const dateStr = today.toDateString();
    const userKey = userId ?? 'anon';
    try {
      const ct = localStorage.getItem(`polly_brief_${userKey}_today_${dateStr}`);
      if (ct) setTodayBrief(JSON.parse(ct));
      const cm = localStorage.getItem(`polly_brief_${userKey}_tomorrow_${dateStr}`);
      if (cm) setTomorrowBrief(JSON.parse(cm));
    } catch { /* ignore */ }

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
        () => loadToday(),
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

      {/* Animated What to Wear section */}
      {!briefError && (
        <WhatToWearSection
          brief={todayBrief}
          tomorrowBrief={tomorrowBrief}
          viewDay={viewDay}
          tomorrowLoading={tomorrowLoading}
          handleViewTomorrow={handleViewTomorrow}
          setViewDay={setViewDay}
          wtwItem={wtwItem}
        />
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
          &ldquo;
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
  const { isLoaded, isSignedIn, userId }   = useAuth();
  const router                             = useRouter();

  useEffect(() => {
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
