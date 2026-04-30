'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SplashScreen from '@/components/splash/SplashScreen';

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
}

// ── Landing page ─────────────────────────────────────────────
function LandingPage() {
  const router = useRouter();
  const today  = new Date();
  const dateStr = formatLongDate(today);
  const quote   = getDailyQuote();

  const [brief, setBrief]       = useState<DailyBrief | null>(null);
  const [briefError, setBriefError] = useState(false);

  useEffect(() => {
    const cacheKey = `polly_brief_${today.toDateString()}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) { setBrief(JSON.parse(cached)); return; }
    } catch { /* ignore */ }

    fetch('/api/daily-brief')
      .then(r => r.json())
      .then(data => {
        if (data.weather) {
          setBrief(data);
          try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch { /* ignore */ }
        } else {
          setBriefError(true);
        }
      })
      .catch(() => setBriefError(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const iconStroke: React.CSSProperties = {
    width: 22, height: 22, stroke: '#C9848A', fill: 'none', strokeWidth: 1.2,
  };

  return (
    <div style={{
      background: 'linear-gradient(180deg, #FAF7F4 0%, #FFFFFF 60%, #FAF7F4 100%)',
      minHeight: '100dvh', overflowX: 'hidden',
      fontFamily: 'var(--font-dm-sans), sans-serif',
    }}>

      {/* Top row — monogram */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px 26px 0' }}>
        <div style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontStyle: 'italic', fontSize: 15, color: '#2A2A2A', letterSpacing: '0.02em',
        }}>
          P<span style={{ color: '#C4A35A' }}>·</span>A
        </div>
      </div>

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
            <div>
              <div style={{ fontSize: 9.5, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#C4A35A', fontWeight: 500, marginBottom: 6 }}>
                Hong Kong · Today
              </div>
              {brief ? (
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
              {brief && (
                <div style={{ fontSize: 11, color: '#7A7170', marginTop: 4 }}>
                  Feels like {brief.weather.feelsC}° · {brief.weather.humidity}% humidity
                </div>
              )}
            </div>
            <div style={{ fontSize: 46, lineHeight: 1, opacity: brief ? 1 : 0.3 }}>
              {brief ? weatherIcon(brief.weather.desc) : '🌡'}
            </div>
          </div>

          {/* Outfit suggestions */}
          <div style={{ padding: '16px 20px 20px' }}>
            <div style={{ fontSize: 9.5, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#C4A35A', fontWeight: 500, marginBottom: 14 }}>
              What to wear today
            </div>
            {brief ? (
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
          Two small <em style={{ fontStyle: 'italic', color: '#C9848A' }}>indulgences,</em><br />chosen for you.
        </h2>
      </div>

      {/* Feature cards — Style + Deals only */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, padding: '24px 20px 0' }}>
        {[
          {
            num: 'N° I', title: 'Style', href: '/style',
            desc: 'Pieces tailored to your taste, your closet, your week.',
            icon: (
              <svg viewBox="0 0 24 24" style={iconStroke}>
                <path d="M8 2l-4 5h3.5v13h9V7H20L16 2" />
                <path d="M8 2c0 2.5 2 4 4 4s4-1.5 4-4" />
              </svg>
            ),
          },
          {
            num: 'N° II', title: 'Deals', href: '/deals',
            desc: 'Quiet alerts when the labels you love go on sale.',
            icon: (
              <svg viewBox="0 0 24 24" style={iconStroke}>
                <path d="M3 12V4h8l10 10-8 8L3 12z"/>
                <circle cx="8" cy="8" r="1.4" fill="#C9848A" stroke="none"/>
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
  );
}

// ── Root ─────────────────────────────────────────────────────
export default function Home() {
  const [splashComplete, setSplashComplete] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!splashComplete) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#FAF7F4' }}>
        <SplashScreen onComplete={() => setSplashComplete(true)} photos={PHOTOS} />
      </div>
    );
  }

  return <LandingPage />;
}
