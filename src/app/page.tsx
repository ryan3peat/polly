'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SplashScreen from '@/components/splash/SplashScreen';

const PHOTOS = [
  '/photos/p0.jpg', '/photos/p1.jpg', '/photos/p2.jpg',
  '/photos/p3.jpg', '/photos/p4.jpg', '/photos/p5.jpg',
  '/photos/p6.jpg', '/photos/p7.jpg', '/photos/p8.jpg',
];

const ORDINALS = [
  '', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh',
  'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth',
  'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth', 'twentieth',
  'twenty-first', 'twenty-second', 'twenty-third', 'twenty-fourth', 'twenty-fifth',
  'twenty-sixth', 'twenty-seventh', 'twenty-eighth', 'twenty-ninth', 'thirtieth', 'thirty-first',
];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function formatLongDate(d: Date) {
  return `${DAYS[d.getDay()]}, the ${ORDINALS[d.getDate()]} of ${MONTHS[d.getMonth()]}`;
}

function getIssueNumber() {
  return Math.max(1, Math.floor((Date.now() - new Date('2026-01-01').getTime()) / 86400000) + 1);
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

function getCookie(name: string) {
  return document.cookie.split('; ').find(r => r.startsWith(name + '='))?.split('=')[1];
}

// ── Landing page ─────────────────────────────────────────────
function LandingPage() {
  const router = useRouter();
  const today = new Date();
  const dateStr = formatLongDate(today);
  const issueNum = getIssueNumber();

  const iconStyle: React.CSSProperties = {
    width: 22, height: 22, stroke: '#C9848A', fill: 'none', strokeWidth: 1.2,
  };

  return (
    <div style={{
      background: 'linear-gradient(180deg, #FAF7F4 0%, #FFFFFF 60%, #FAF7F4 100%)',
      minHeight: '100dvh', overflowX: 'hidden',
      fontFamily: 'var(--font-dm-sans), sans-serif',
    }}>

      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 26px 0' }}>
        <div style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontStyle: 'italic', fontSize: 15, color: '#2A2A2A', letterSpacing: '0.02em',
        }}>
          P<span style={{ color: '#C4A35A' }}>·</span>A
        </div>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '1px solid #EDD9DB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#5A5A5A',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="4" y1="7" x2="20" y2="7"/>
            <line x1="4" y1="12" x2="20" y2="12"/>
            <line x1="4" y1="17" x2="20" y2="17"/>
          </svg>
        </div>
      </div>

      {/* Edition strip */}
      <div style={{ textAlign: 'center', marginTop: 28, padding: '0 26px' }}>
        <div style={{
          fontSize: 9.5, letterSpacing: '0.32em', textTransform: 'uppercase',
          color: '#C4A35A', fontWeight: 500,
        }}>
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
        <div style={{
          width: 188, height: 188, borderRadius: '50%',
          margin: '0 auto', position: 'relative',
          overflow: 'hidden', background: '#F4ECE6',
          boxShadow: '0 18px 40px -20px rgba(201,132,138,0.35)',
          border: '1px solid #C4A35A',
        }}>
          <div style={{
            position: 'absolute', inset: 7, borderRadius: '50%',
            border: '1px solid rgba(196,163,90,0.25)', pointerEvents: 'none', zIndex: 1,
          }} />
          <img
            src="/photos/p0.jpg"
            alt="Polly"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
          />
        </div>

        <h1 style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontWeight: 500, fontSize: 54, lineHeight: 1,
          letterSpacing: '-0.015em', marginTop: 28, color: '#2A2A2A',
        }}>
          Polly&apos;s <em style={{ fontStyle: 'italic', fontWeight: 400, color: '#C9848A' }}>App</em>
        </h1>

        {/* Gold rule */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 }}>
          <div style={{ height: 1, width: 32, background: '#C4A35A' }} />
          <div style={{ width: 5, height: 5, background: '#C4A35A', transform: 'rotate(45deg)' }} />
          <div style={{ height: 1, width: 32, background: '#C4A35A' }} />
        </div>

        <p style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontStyle: 'italic', fontWeight: 400, fontSize: 18,
          color: '#5A5A5A', marginTop: 14, letterSpacing: '0.005em',
        }}>
          Your daily world, curated.
        </p>
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '28px 28px 0' }}>
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
        <p style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontStyle: 'italic', fontSize: 13, color: '#5A5A5A',
        }}>
          <b style={{ fontStyle: 'normal', fontWeight: 500, color: '#C4A35A' }}>Issue N°{issueNum}</b> · ready for you
        </p>
      </div>

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

      {/* Feature cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '24px 20px 0' }}>
        {[
          {
            num: 'N° I', title: 'Style',
            desc: 'Pieces tailored to your taste, your closet, your week.',
            href: '/style',
            icon: (
              <svg viewBox="0 0 24 24" style={iconStyle}>
                <path d="M12 8a2.2 2.2 0 1 1 2.2-2.2"/>
                <path d="M12 8v2.5"/>
                <path d="M3 18l9-7 9 7"/>
                <path d="M3 18h18"/>
              </svg>
            ),
          },
          {
            num: 'N° II', title: 'Deals',
            desc: 'Quiet alerts when the labels you love go on sale.',
            href: '/deals',
            icon: (
              <svg viewBox="0 0 24 24" style={iconStyle}>
                <path d="M3 12V4h8l10 10-8 8L3 12z"/>
                <circle cx="8" cy="8" r="1.4" fill="#C9848A" stroke="none"/>
              </svg>
            ),
          },
          {
            num: 'N° III', title: 'Family',
            desc: 'Soft notes from home — moments, milestones, mornings.',
            href: '/family',
            icon: (
              <svg viewBox="0 0 24 24" style={iconStyle}>
                <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>
              </svg>
            ),
          },
        ].map(card => (
          <button
            key={card.title}
            onClick={() => router.push(card.href)}
            style={{
              background: '#FFFFFF', border: '1px solid #EDD9DB',
              borderRadius: 16, padding: '18px 10px',
              textAlign: 'center', cursor: 'pointer',
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

      {/* Pull quote */}
      <div style={{
        margin: '46px 28px 0',
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
          The world, gently filtered<br />through what you love.
        </p>
        <div style={{
          marginTop: 14, fontSize: 9.5, letterSpacing: '0.3em',
          textTransform: 'uppercase', color: '#5A5A5A',
        }}>
          — a daily ritual
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '36px 28px 80px' }}>
        <div style={{
          width: 54, height: 54, borderRadius: '50%',
          border: '1px solid #C4A35A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px',
          fontFamily: 'var(--font-cormorant), serif',
          fontStyle: 'italic', fontSize: 18, color: '#C4A35A',
        }}>
          P
        </div>
        <p style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontStyle: 'italic', fontSize: 15, color: '#2A2A2A', lineHeight: 1.4,
        }}>
          Made by hand, <b style={{ color: '#C9848A', fontWeight: 400 }}>for Polly</b>,<br />
          with all my love.
        </p>
        <div style={{
          marginTop: 10, fontSize: 9.5, letterSpacing: '0.3em',
          textTransform: 'uppercase', color: '#5A5A5A',
        }}>
          Est. MMXXVI · One of one
        </div>
      </div>

    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────
export default function Home() {
  const [splashComplete, setSplashComplete] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Check cookie (most reliable on mobile Safari) + localStorage fallback
    const seen = getCookie('polly_splash') || localStorage.getItem('polly_splash_seen');
    if (seen) setSplashComplete(true);
    setReady(true);
  }, []);

  const handleSplashComplete = () => {
    setCookie('polly_splash', '1', 365);
    try { localStorage.setItem('polly_splash_seen', '1'); } catch { /* private mode */ }
    setSplashComplete(true);
  };

  if (!ready) return null;

  if (!splashComplete) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#FAF7F4' }}>
        <SplashScreen onComplete={handleSplashComplete} photos={PHOTOS} />
      </div>
    );
  }

  return <LandingPage />;
}
