'use client';

import { useEffect, useRef, useState } from 'react';
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
    fontFamily: "'DM Sans', sans-serif",
  },
  elements: {
    card: { boxShadow: 'none', background: 'transparent', border: 'none', borderRadius: '0' },
    headerTitle: { display: 'none' },
    headerSubtitle: { display: 'none' },
    socialButtonsBlockButton: {
      border: '1px solid #EDD9DB',
      background: '#FFFFFF',
      color: '#2A2A2A',
      borderRadius: '999px',
    },
    formButtonPrimary: {
      background: '#C9848A',
      fontSize: '14px',
      fontWeight: 500,
      borderRadius: '999px',
    },
    footerActionLink: { color: '#C4A35A' },
    dividerLine: { background: '#EDD9DB' },
    formFieldInput: { border: '1px solid #EDD9DB', borderRadius: '999px' },
    footer: { display: 'none' },
  },
};

// ── Animated WTW demo for the marketing page ─────────────────
function MarketingWtwDemo() {
  const stageRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const startedRef = useRef(false);
  const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [cardA, setCardA] = useState<'hidden' | 'show' | 'active'>('hidden');
  const [cardB, setCardB] = useState<'hidden' | 'show' | 'active'>('hidden');
  const [cardC, setCardC] = useState<'hidden' | 'show' | 'active'>('hidden');
  const [threadsGo, setThreadsGo] = useState(false);
  const [outputShow, setOutputShow] = useState(false);
  const [piecesShow, setPiecesShow] = useState([false, false, false, false]);
  const [rationaleShow, setRationaleShow] = useState(false);

  function clearAll() {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
    if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
    setCardA('hidden'); setCardB('hidden'); setCardC('hidden');
    setThreadsGo(false); setOutputShow(false);
    setPiecesShow([false, false, false, false]); setRationaleShow(false);
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
    t(2400, () => setPiecesShow([true, false, false, false]));
    t(2580, () => setPiecesShow([true, true, false, false]));
    t(2760, () => setPiecesShow([true, true, true, false]));
    t(2940, () => setPiecesShow([true, true, true, true]));
    t(3300, () => setRationaleShow(true));
    loopTimerRef.current = setTimeout(play, 7800);
  }

  useEffect(() => {
    const el = stageRef.current;
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

  const cardStyle = (state: 'hidden' | 'show' | 'active'): React.CSSProperties => ({
    background: '#FFFFFF',
    border: state === 'active' ? '1px solid #C9848A' : '1px solid #EDD9DB',
    borderRadius: 11,
    padding: '9px 8px 10px',
    textAlign: 'center',
    position: 'relative',
    opacity: state === 'hidden' ? 0 : 1,
    transform: state === 'hidden' ? 'translateY(8px)' : 'translateY(0)',
    transition: 'opacity 0.5s ease, transform 0.5s ease, border-color 0.4s ease, box-shadow 0.4s ease',
    boxShadow: state === 'active' ? '0 0 0 3px rgba(201,132,138,0.12), 0 6px 14px -6px rgba(201,132,138,0.3)' : 'none',
  });

  const icLbl: React.CSSProperties = { fontSize: 7, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#C4A35A', fontWeight: 600, marginBottom: 5 };
  const icName: React.CSSProperties = { fontFamily: "'Cormorant Garamond', serif", fontSize: 13, fontWeight: 500, color: '#2A2A2A', lineHeight: 1.1 };
  const icDetail: React.CSSProperties = { fontSize: 8.5, color: '#7A7170', marginTop: 3, lineHeight: 1.3, fontStyle: 'italic', fontFamily: "'Cormorant Garamond', serif" };

  return (
    <div ref={stageRef} style={{
      margin: '28px auto 0',
      width: 300,
      borderRadius: 42,
      background: '#1f1d1c',
      padding: 10,
      boxShadow: '0 40px 90px -32px rgba(184,110,117,0.55), 0 16px 36px -18px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)',
      position: 'relative',
    }}>
      {/* Dynamic island */}
      <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', width: 84, height: 24, borderRadius: 14, background: '#000', zIndex: 50 }} />

      <div style={{
        borderRadius: 32, overflow: 'hidden',
        background: 'linear-gradient(180deg, #FAF7F4 0%, #FFFFFF 50%, #FBF1ED 100%)',
        height: 640, position: 'relative', fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* Screen top */}
        <div style={{ padding: '50px 18px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 8.5, letterSpacing: '0.32em', textTransform: 'uppercase', color: '#C4A35A', fontWeight: 500 }}>
            What to wear today
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontSize: 26, lineHeight: 1.05, marginTop: 8, color: '#2A2A2A' }}>
            Wednesday, <em style={{ fontStyle: 'italic', color: '#C9848A', fontWeight: 400 }}>warm and soft</em>
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 11, color: '#7A7170', marginTop: 5 }}>
            Hong Kong · 24°, partly cloudy
          </div>
        </div>

        {/* Input cards */}
        <div style={{ margin: '14px 14px 0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7, position: 'relative', zIndex: 2 }}>
          <div style={cardStyle(cardA)}>
            <div style={icLbl}>Wardrobe</div>
            <div style={icName}>Linen blazer</div>
            <div style={icDetail}>Cream, breathable</div>
            {cardA === 'active' && <div style={{ position: 'absolute', left: '50%', bottom: -3, transform: 'translate(-50%, 50%)', width: 6, height: 6, borderRadius: '50%', background: '#C9848A', animation: 'mktg-pulse 1.4s ease-out infinite' }} />}
          </div>
          <div style={cardStyle(cardB)}>
            <div style={icLbl}>Taste</div>
            <div style={icName}>Quiet luxury</div>
            <div style={icDetail}>soft, tonal</div>
            {cardB === 'active' && <div style={{ position: 'absolute', left: '50%', bottom: -3, transform: 'translate(-50%, 50%)', width: 6, height: 6, borderRadius: '50%', background: '#C9848A', animation: 'mktg-pulse 1.4s ease-out infinite' }} />}
          </div>
          <div style={cardStyle(cardC)}>
            <div style={icLbl}>Frequency</div>
            <div style={icName}>Worn 2x</div>
            <div style={icDetail}>last in April</div>
            {cardC === 'active' && <div style={{ position: 'absolute', left: '50%', bottom: -3, transform: 'translate(-50%, 50%)', width: 6, height: 6, borderRadius: '50%', background: '#C9848A', animation: 'mktg-pulse 1.4s ease-out infinite' }} />}
          </div>
        </div>

        {/* SVG threads */}
        <div style={{ position: 'relative', height: 36, margin: '0 14px', pointerEvents: 'none', zIndex: 1 }}>
          <svg viewBox="0 0 280 36" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            <path d="M 46 0 C 46 18, 140 18, 140 36" fill="none" stroke="#C4A35A" strokeWidth="1" strokeLinecap="round" opacity="0.65"
              style={{ strokeDasharray: 200, strokeDashoffset: threadsGo ? 0 : 200, transition: 'stroke-dashoffset 0.9s ease' }} />
            <path d="M 140 0 C 140 18, 140 18, 140 36" fill="none" stroke="#C4A35A" strokeWidth="1" strokeLinecap="round" opacity="0.65"
              style={{ strokeDasharray: 200, strokeDashoffset: threadsGo ? 0 : 200, transition: 'stroke-dashoffset 0.9s ease 0.1s' }} />
            <path d="M 234 0 C 234 18, 140 18, 140 36" fill="none" stroke="#C4A35A" strokeWidth="1" strokeLinecap="round" opacity="0.65"
              style={{ strokeDasharray: 200, strokeDashoffset: threadsGo ? 0 : 200, transition: 'stroke-dashoffset 0.9s ease 0.2s' }} />
            {threadsGo && (<>
              <circle cx="46" cy="0" r="1.6" fill="#C4A35A" style={{ animation: 'mktg-slide 1.3s ease-in-out infinite' }} />
              <circle cx="140" cy="0" r="1.6" fill="#C4A35A" style={{ animation: 'mktg-slide 1.3s ease-in-out infinite', animationDelay: '0.2s' }} />
              <circle cx="234" cy="0" r="1.6" fill="#C4A35A" style={{ animation: 'mktg-slide 1.3s ease-in-out infinite', animationDelay: '0.4s' }} />
            </>)}
          </svg>
        </div>

        {/* Output card */}
        <div style={{
          margin: '0 14px',
          background: '#FFFFFF', border: '1px solid #EDD9DB', borderRadius: 16,
          padding: '14px 14px', boxShadow: '0 14px 30px -18px rgba(201,132,138,0.3)',
          position: 'relative',
          opacity: outputShow ? 1 : 0,
          transform: outputShow ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s',
        }}>
          <div style={{ position: 'absolute', top: -1, left: 18, right: 18, height: 1, background: 'linear-gradient(90deg, transparent, #C4A35A, transparent)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 8, letterSpacing: '0.32em', textTransform: 'uppercase', color: '#C4A35A', fontWeight: 600 }}>Today&apos;s outfit</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 10, color: '#7A7170' }}>
              <b style={{ color: '#C9848A', fontWeight: 500 }}>96%</b> match for you
            </div>
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 500, lineHeight: 1.15, color: '#2A2A2A' }}>
            The cream linen blazer, <em style={{ fontStyle: 'italic', color: '#C9848A' }}>three ways yours.</em>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginTop: 11 }}>
            {[['🧥', true], ['👗', false], ['👠', false], ['👜', false]].map(([emoji, star], i) => (
              <div key={i} style={{
                aspectRatio: '1', borderRadius: 9,
                background: 'linear-gradient(160deg,#FDF0F1 0%, #F2D4D7 100%)',
                border: '1px solid #EDD9DB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, position: 'relative',
                opacity: piecesShow[i] ? 1 : 0,
                transform: piecesShow[i] ? 'scale(1)' : 'scale(0.7)',
                transition: piecesShow[i] ? 'opacity 0.4s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
              }}>
                {emoji as string}
                {star && (
                  <div style={{ position: 'absolute', top: -5, right: -5, width: 14, height: 14, borderRadius: '50%', background: '#C4A35A', color: '#fff', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fff' }}>★</div>
                )}
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 11, paddingTop: 10, borderTop: '1px solid #EDD9DB',
            fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
            fontSize: 11.5, lineHeight: 1.45, color: '#5A5A5A',
            opacity: rationaleShow ? 1 : 0, transition: 'opacity 0.6s ease 0.6s',
          }}>
            The blazer hasn&apos;t been out in three weeks - <b style={{ color: '#C9848A', fontStyle: 'normal', fontWeight: 500 }}>time it saw the light.</b>
          </div>
        </div>

        {/* Replay button */}
        <div style={{ textAlign: 'center', paddingTop: 14 }}>
          <button
            onClick={play}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
              fontSize: 12, color: '#C9848A',
              border: '1px solid #C9848A', borderRadius: 999,
              padding: '5px 14px', background: 'transparent', cursor: 'pointer',
            }}
          >
            Replay <span style={{ fontSize: 11 }}>↻</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Phone shell wrapper ───────────────────────────────────────
function PhoneShell({ children, tall }: { children: React.ReactNode; tall?: boolean }) {
  return (
    <div style={{
      width: 280, margin: '0 auto',
      borderRadius: 38,
      background: '#1f1d1c',
      padding: 9,
      boxShadow: '0 30px 70px -30px rgba(184,110,117,0.4), 0 12px 28px -16px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)',
      position: 'relative',
    }}>
      <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', width: 78, height: 22, borderRadius: 14, background: '#000', zIndex: 5 }} />
      <div style={{
        borderRadius: 30, overflow: 'hidden', background: '#FAF7F4',
        height: tall ? 600 : 580, position: 'relative',
        fontFamily: "'DM Sans', sans-serif", color: '#2A2A2A',
      }}>
        <div style={{ paddingTop: 56 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Section / layout helpers ─────────────────────────────────
const S = {
  rose: '#C9848A',
  gold: '#C4A35A',
  ivory: '#FAF7F4',
  charcoal: '#2A2A2A',
  charcoalSoft: '#5A5A5A',
  charcoalMute: '#7A7170',
  hairline: '#EDD9DB',
  rosePale: '#F2D4D7',
};

function SectionHead({ kicker, headline, sub }: { kicker: string; headline: React.ReactNode; sub?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '0 24px' }}>
      <div style={{ fontSize: 9.5, letterSpacing: '0.32em', textTransform: 'uppercase', color: S.gold, fontWeight: 500, marginBottom: 14 }}>
        {kicker}
      </div>
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: 36, lineHeight: 1.1, color: S.charcoal }}>
        {headline}
      </h2>
      {sub && (
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 17, lineHeight: 1.4, color: S.charcoalSoft, marginTop: 14, maxWidth: 340, marginLeft: 'auto', marginRight: 'auto' }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function SectionRule() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '20px auto 28px' }}>
      <div style={{ height: 1, width: 24, background: S.gold }} />
      <div style={{ width: 4, height: 4, background: S.gold, borderRadius: '50%' }} />
      <div style={{ height: 1, width: 24, background: S.gold }} />
    </div>
  );
}

// ── Sign-in page ─────────────────────────────────────────────
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
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, letterSpacing: '0.2em', color: '#2A2A2A', marginBottom: 8 }}>
          P·A
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 400, fontStyle: 'italic', color: '#2A2A2A', marginBottom: 4, textAlign: 'center' }}>
          Welcome back
        </h1>
        <div style={{ width: 40, height: 1, background: '#C4A35A', marginBottom: 32 }} />
        <SignIn appearance={clerkAppearance} />
        <button
          onClick={() => setShowForm(false)}
          style={{ marginTop: 20, background: 'none', border: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#7A7170', cursor: 'pointer', textDecoration: 'underline' }}
        >
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(180deg, #FAF7F4 0%, #FFFFFF 40%, #FAF7F4 100%)',
      fontFamily: "'DM Sans', sans-serif",
      color: S.charcoal,
      overflowX: 'hidden',
      WebkitFontSmoothing: 'antialiased',
    }}>
      <style>{`
        @keyframes mktg-bob { 0%,100%{transform:translateY(0);opacity:0.6;} 50%{transform:translateY(6px);opacity:1;} }
        @keyframes mktg-pulse { 0%{box-shadow:0 0 0 0 rgba(201,132,138,0.5);} 100%{box-shadow:0 0 0 12px rgba(201,132,138,0);} }
        @keyframes mktg-slide { 0%{opacity:0;transform:translateY(0);} 20%{opacity:1;} 100%{opacity:0;transform:translateY(28px);} }
      `}</style>

      {/* ── Auth fold ─────────────────────────────────────── */}
      <div style={{ padding: '56px 24px 0', textAlign: 'center', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 500, fontSize: 18, letterSpacing: '0.04em', color: S.charcoal, marginBottom: 24 }}>
          P<span style={{ color: S.gold, margin: '0 4px' }}>·</span>A
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontSize: 46, lineHeight: 1.02, letterSpacing: '-0.015em', color: S.charcoal, margin: 0 }}>
          Polly&apos;s <em style={{ fontStyle: 'italic', fontWeight: 400, color: S.rose }}>App</em>
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '18px auto 0' }}>
          <div style={{ height: 1, width: 32, background: S.gold }} />
          <div style={{ width: 5, height: 5, background: S.gold, transform: 'rotate(45deg)' }} />
          <div style={{ height: 1, width: 32, background: S.gold }} />
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 18, color: S.charcoalSoft, marginTop: 10 }}>
          Your daily world, curated.
        </div>
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
          <button
            onClick={() => router.push('/sign-up')}
            style={{ width: '100%', height: 52, borderRadius: 999, background: S.charcoal, color: S.ivory, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
          >
            Create account <span style={{ fontSize: 14 }}>→</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            style={{ width: '100%', height: 52, borderRadius: 999, background: 'transparent', color: S.charcoal, border: `1px solid ${S.hairline}`, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
          >
            Sign in
          </button>
        </div>
        {/* Scroll cue */}
        <div style={{ marginTop: 48, textAlign: 'center', paddingBottom: 24 }}>
          <div style={{ fontSize: 9.5, letterSpacing: '0.32em', textTransform: 'uppercase', color: S.charcoalMute, fontWeight: 500 }}>
            Scroll to discover
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: S.gold, fontSize: 18, marginTop: 8, animation: 'mktg-bob 2.4s ease-in-out infinite' }}>
            ↓
          </div>
        </div>
      </div>

      {/* ── Manifesto ─────────────────────────────────────── */}
      <div style={{ marginTop: 80, padding: '0 24px' }}>
        <SectionHead kicker="A note before you begin" headline={<>Built for <em style={{ fontStyle: 'italic', color: S.rose }}>one,</em><br />not for everyone.</>} />
        <SectionRule />
        <div style={{
          background: '#FFFFFF', border: `1px solid ${S.hairline}`, borderRadius: 24,
          padding: '36px 26px 30px',
          boxShadow: '0 1px 0 rgba(237,217,219,0.4), 0 18px 40px -28px rgba(201,132,138,0.25)',
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', top: 14, left: 14, right: 14, bottom: 14, border: '1px solid rgba(196,163,90,0.18)', borderRadius: 18, pointerEvents: 'none' }} />
          <div style={{ width: 54, height: 54, borderRadius: '50%', border: `1px solid ${S.gold}`, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 22, fontWeight: 500, color: S.gold }}>
            P
          </div>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: 26, lineHeight: 1.2, textAlign: 'center', color: S.charcoal }}>
            Most apps are built for millions. <em style={{ fontStyle: 'italic', color: S.rose }}>This one is yours.</em>
          </h3>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 16, lineHeight: 1.55, color: S.charcoalSoft, textAlign: 'center', marginTop: 14 }}>
            No feeds engineered for scroll-time. No advertisers shaping what you see. Just one calm, editorial morning ritual - shaped precisely around your life, your wardrobe, your weather, your taste.
          </p>
          <div style={{ marginTop: 22, textAlign: 'center', fontSize: 9.5, letterSpacing: '0.3em', textTransform: 'uppercase', color: S.charcoalMute }}>
            Made by hand <span style={{ color: S.gold, margin: '0 6px' }}>·</span> for you alone <span style={{ color: S.gold, margin: '0 6px' }}>·</span> with love
          </div>
        </div>
      </div>

      {/* ── Three pillars ─────────────────────────────────── */}
      <div style={{ marginTop: 80, padding: '0 24px' }}>
        <SectionHead kicker="Why this is different" headline={<>Three quiet <em style={{ fontStyle: 'italic', color: S.rose }}>convictions.</em></>} />
        <SectionRule />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
          {[
            { num: 'I', h: <>Curation, <em style={{ fontStyle: 'italic', color: S.rose }}>not feeds.</em></>, p: 'AI reads Vogue, Harper\'s Bazaar and the rest before you do - and gives you only what\'s worth your attention. Summaries, not scrolls.' },
            { num: 'II', h: <>Hong Kong, <em style={{ fontStyle: 'italic', color: S.rose }}>known by heart.</em></>, p: 'Dining offers, bank programmes, members\' deals - gathered from the corners of the city you\'d never have time to check yourself.' },
            { num: 'III', h: <>Your wardrobe, <em style={{ fontStyle: 'italic', color: S.rose }}>understood.</em></>, p: 'It knows what\'s hanging in your closet and what the weather will do. Three outfit suggestions arrive each morning, considered.' },
          ].map(({ num, h, p }) => (
            <div key={num} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '20px 18px', background: '#FFFFFF', border: `1px solid ${S.hairline}`, borderRadius: 18 }}>
              <div style={{ flexShrink: 0, width: 42, textAlign: 'center', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 24, color: S.gold, lineHeight: 1, paddingTop: 2, borderRight: `1px solid ${S.hairline}`, marginRight: 6, paddingRight: 14 }}>
                {num}
              </div>
              <div>
                <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontSize: 20, color: S.charcoal, marginBottom: 5, lineHeight: 1.2 }}>{h}</h4>
                <p style={{ fontSize: 13, lineHeight: 1.55, color: S.charcoalSoft }}>{p}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Feature I: Daily Edition ──────────────────────── */}
      <div style={{ marginTop: 80, padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14, color: S.gold, letterSpacing: '0.1em', marginBottom: 6 }}>
            I - The Daily Edition
          </div>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: 34, lineHeight: 1.05, color: S.charcoal }}>
            A morning brief, <em style={{ fontStyle: 'italic', color: S.rose }}>just for you.</em>
          </h3>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 16, lineHeight: 1.45, color: S.charcoalSoft, marginTop: 10, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
            Today&apos;s date, your weather, three outfits chosen from your wardrobe, and a thought to carry with you.
          </div>
        </div>
        <PhoneShell>
          {/* Ed strip */}
          <div style={{ textAlign: 'center', padding: '0 22px' }}>
            <div style={{ fontSize: 8, letterSpacing: '0.32em', textTransform: 'uppercase', color: S.gold, fontWeight: 500 }}>The Daily Edition</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6 }}>
              <span style={{ height: 1, width: 14, background: S.hairline, display: 'block' }} />
              <span style={{ width: 2.5, height: 2.5, borderRadius: '50%', background: S.gold, display: 'block' }} />
              <span style={{ height: 1, width: 14, background: S.hairline, display: 'block' }} />
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 11, color: S.charcoalSoft, marginTop: 4 }}>
              Wednesday, the sixth of May
            </div>
          </div>
          {/* Portrait */}
          <div style={{ width: 104, height: 104, borderRadius: '50%', margin: '18px auto 0', border: `1px solid ${S.gold}`, overflow: 'hidden', background: '#F4ECE6', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 4, borderRadius: '50%', border: '1px solid rgba(196,163,90,0.25)' }} />
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(160deg, #F2D4D7 0%, #C9848A 100%)' }} />
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontSize: 34, lineHeight: 1, textAlign: 'center', marginTop: 18, letterSpacing: '-0.015em', color: S.charcoal }}>
            Polly&apos;s <em style={{ fontStyle: 'italic', fontWeight: 400, color: S.rose }}>App</em>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, margin: '10px auto 0' }}>
            <div style={{ height: 1, width: 18, background: S.gold }} />
            <div style={{ width: 3.5, height: 3.5, background: S.gold, transform: 'rotate(45deg)' }} />
            <div style={{ height: 1, width: 18, background: S.gold }} />
          </div>
          <div style={{ textAlign: 'center', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, color: S.charcoalSoft, marginTop: 9 }}>
            Your daily world, curated.
          </div>
          {/* Weather card mock */}
          <div style={{ margin: '18px 18px 0', border: `1px solid ${S.hairline}`, borderRadius: 14, background: '#fff', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg, #FAF7F4 0%, #FDF0F1 100%)', padding: '11px 12px 10px', borderBottom: `1px solid ${S.hairline}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 7.5, letterSpacing: '0.24em', textTransform: 'uppercase', color: S.gold, fontWeight: 500, marginBottom: 4 }}>Hong Kong · Today</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 400, lineHeight: 1, color: S.charcoal, display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  24° <small style={{ fontFamily: "'DM Sans', sans-serif", fontStyle: 'normal', fontSize: 9, color: S.charcoalSoft }}>partly cloudy</small>
                </div>
                <div style={{ fontSize: 8.5, color: S.charcoalMute, marginTop: 3 }}>Feels like 26° · 78% humidity</div>
              </div>
              <div style={{ fontSize: 30 }}>⛅</div>
            </div>
            <div style={{ padding: '11px 12px 12px' }}>
              <div style={{ fontSize: 7.5, letterSpacing: '0.24em', textTransform: 'uppercase', color: S.gold, fontWeight: 500, marginBottom: 8 }}>What to wear today</div>
              {[['I', 'The cream linen blazer over a slip dress, with sandals.'], ['II', 'High-waist trousers, a silk camisole, gold hoops.'], ['III', 'A breezy midi with the cognac mules - easy elegance.']].map(([roman, text]) => (
                <div key={roman} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 9, color: S.gold, flexShrink: 0, width: 14 }}>{roman}</span>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 11, lineHeight: 1.35, color: S.charcoal }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </PhoneShell>
      </div>

      {/* ── What to Wear hero ─────────────────────────────── */}
      <div style={{ marginTop: 88, padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14, color: S.gold, letterSpacing: '0.1em', marginBottom: 8 }}>
            The headline feature
          </div>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: 38, lineHeight: 1.05, color: S.charcoal }}>
            What to wear, <em style={{ fontStyle: 'italic', color: S.rose }}>chosen for today.</em>
          </h3>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 17, lineHeight: 1.45, color: S.charcoalSoft, marginTop: 14, maxWidth: 340, marginLeft: 'auto', marginRight: 'auto' }}>
            Three sources, one quiet decision. Polly&apos;s App reads your wardrobe, your taste, and how often you&apos;ve reached for each piece - and arrives at one outfit, considered.
          </div>
        </div>
        <MarketingWtwDemo />
        {/* Formula */}
        <div style={{ marginTop: 24, textAlign: 'center', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 15, color: S.charcoalSoft, lineHeight: 1.5 }}>
          <b style={{ color: S.charcoal, fontStyle: 'normal', fontWeight: 500 }}>Your wardrobe</b>
          <span style={{ color: S.gold, margin: '0 6px' }}>+</span>
          <b style={{ color: S.charcoal, fontStyle: 'normal', fontWeight: 500 }}>Your taste</b>
          <span style={{ color: S.gold, margin: '0 6px' }}>+</span>
          <b style={{ color: S.charcoal, fontStyle: 'normal', fontWeight: 500 }}>Your habits</b>
          <span style={{ display: 'block', marginTop: 6, fontSize: 18, color: S.rose }}>= one outfit, considered</span>
        </div>
        {/* Explainer cards */}
        <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { num: 'I', h: <>Your <em style={{ fontStyle: 'italic', color: S.rose }}>actual wardrobe.</em></>, p: 'The app draws only from pieces you own - photographed, tagged, and quietly understood. Nothing it suggests will be a fantasy.', stat: '28 pieces · always on hand' },
            { num: 'II', h: <>Your <em style={{ fontStyle: 'italic', color: S.rose }}>style preferences.</em></>, p: 'Quiet luxury, soft tones, tailored shoulders. It learns the silhouettes you reach for and the labels you trust, refining its eye every week.', stat: 'Trained on your taste' },
            { num: 'III', h: <>How often you&apos;ve <em style={{ fontStyle: 'italic', color: S.rose }}>worn it.</em></>, p: 'Pieces sitting unworn rise gently to the top. Recent favourites rest. The app keeps a quiet record so your closet works as widely as it should.', stat: 'Wear-frequency aware' },
          ].map(({ num, h, p, stat }) => (
            <div key={num} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 14px', background: '#FFFFFF', border: `1px solid ${S.hairline}`, borderRadius: 14 }}>
              <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', border: `1px solid ${S.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: S.gold, fontSize: 14, fontWeight: 500, background: '#FCFAF8' }}>
                {num}
              </div>
              <div>
                <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontSize: 17, color: S.charcoal, lineHeight: 1.15 }}>{h}</h4>
                <p style={{ fontSize: 12, lineHeight: 1.5, color: S.charcoalSoft, marginTop: 4 }}>{p}</p>
                <div style={{ marginTop: 6, fontSize: 9.5, letterSpacing: '0.24em', textTransform: 'uppercase', color: S.gold, fontWeight: 500 }}>{stat}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Feature II: Style ─────────────────────────────── */}
      <div style={{ marginTop: 80, padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14, color: S.gold, letterSpacing: '0.1em', marginBottom: 6 }}>II - Style</div>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: 34, lineHeight: 1.05, color: S.charcoal }}>
            The fashion press, <em style={{ fontStyle: 'italic', color: S.rose }}>distilled.</em>
          </h3>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 16, lineHeight: 1.45, color: S.charcoalSoft, marginTop: 10, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
            Your trusted publications, read by AI, summarised into a calm editorial digest.
          </div>
        </div>
        <PhoneShell tall>
          <div style={{ padding: '0 12px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 4px 6px' }}>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: S.charcoal, lineHeight: 1 }}>Style</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 10, color: S.charcoalMute, marginTop: 3 }}>Your fashion world today</div>
              </div>
              <div style={{ fontSize: 8, color: S.rose, border: `1px solid ${S.rose}`, borderRadius: 999, padding: '3px 8px', letterSpacing: '0.05em' }}>Refresh</div>
            </div>
            {[
              { bg: 'linear-gradient(160deg,#F2D4D7 0%, #E8B5BC 100%)', source: 'Vogue', pill: 'Trends', h: 'The slip dress is back, and quieter than ever', p: 'How the season\'s softest silhouettes are reshaping the way we get dressed.' },
              { bg: 'linear-gradient(160deg,#E8DDD3 0%, #C9B8A6 100%)', source: 'Bazaar', pill: 'Beauty', h: 'A new kind of glow, learned from Tokyo', p: 'The minimalist routines quietly redefining radiance.' },
              { bg: 'linear-gradient(160deg,#D8C4C8 0%, #B89399 100%)', source: 'Vogue', pill: 'Culture', h: 'The return of the long, considered shoulder', p: 'Tailoring that takes its time - and rewards yours.' },
              { bg: 'linear-gradient(160deg,#EFDFD8 0%, #D4B6A8 100%)', source: 'Bazaar', pill: 'Trends', h: 'Why everyone you trust is wearing chocolate', p: 'The colour quietly displacing black this season.' },
            ].map((card, i) => (
              <div key={i} style={{ background: '#fff', border: `1px solid ${S.hairline}`, borderRadius: 11, overflow: 'hidden', boxShadow: '0 2px 10px -5px rgba(201,132,138,0.12)' }}>
                <div style={{ aspectRatio: '3/4', background: card.bg, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 5, left: 5, background: S.rosePale, color: S.rose, fontSize: 7, letterSpacing: '0.04em', padding: '2px 5px', borderRadius: 999, fontWeight: 500 }}>{card.source}</div>
                  <div style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(42,42,42,0.8)', color: '#fff', fontSize: 7, padding: '2px 5px', borderRadius: 999 }}>{card.pill}</div>
                </div>
                <div style={{ padding: '7px 8px 9px' }}>
                  <div style={{ fontSize: 9.5, fontWeight: 600, color: S.charcoal, lineHeight: 1.3, marginBottom: 3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{card.h}</div>
                  <div style={{ fontSize: 8.5, lineHeight: 1.45, color: S.charcoalMute, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{card.p}</div>
                </div>
              </div>
            ))}
          </div>
        </PhoneShell>
      </div>

      {/* ── Feature III: Deals ────────────────────────────── */}
      <div style={{ marginTop: 80, padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14, color: S.gold, letterSpacing: '0.1em', marginBottom: 6 }}>III - Deals</div>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: 34, lineHeight: 1.05, color: S.charcoal }}>
            Hong Kong&apos;s best, <em style={{ fontStyle: 'italic', color: S.rose }}>without the hunt.</em>
          </h3>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 16, lineHeight: 1.45, color: S.charcoalSoft, marginTop: 10, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
            Bank programmes, dining clubs, restaurant offers - gathered, sorted, and ready when you are.
          </div>
        </div>
        <PhoneShell tall>
          <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 9 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 2 }}>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, lineHeight: 1, color: S.charcoal }}>Deals</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 10, color: S.charcoalMute, marginTop: 3 }}>Hong Kong&apos;s best offers today</div>
              </div>
            </div>
            {[
              { src: 'HSBC RED HOT', ttl: '25% off at Mott 32, Central', desc: 'Cantonese fine dining · weekday lunch', save: '25% off', end: true },
              { src: 'CATHAY DINING', ttl: 'Two-for-one tasting at Estro', desc: 'Italian fine dining · Wan Chai', save: '2 for 1', end: false },
              { src: 'DININGCITY', ttl: 'Restaurant Week · 3-course at Belon', desc: 'French bistro · Soho', save: 'HK$ 388', end: false },
              { src: 'AMEX OFFERS', ttl: 'HK$ 200 back at The Aubrey', desc: 'Japanese izakaya · Mandarin Oriental', save: 'HK$ 200', end: false },
            ].map((deal, i) => (
              <div key={i} style={{ display: 'flex', background: '#fff', border: `1px solid ${S.hairline}`, borderRadius: 12, overflow: 'hidden', minHeight: 78, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                <div style={{ width: 40, flexShrink: 0, background: S.ivory, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: `1px solid ${S.hairline}`, color: S.rose }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 18, height: 18 }}>
                    <path d="M3 11l9-9 9 9-9 9z"/>
                    <circle cx="8" cy="8" r="1.4" fill="currentColor"/>
                  </svg>
                </div>
                <div style={{ padding: '8px 10px 9px', flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 7.5, color: S.charcoalMute, fontWeight: 500 }}>{deal.src}</div>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: S.charcoal, lineHeight: 1.3, marginTop: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{deal.ttl}</div>
                  <div style={{ fontSize: 9, lineHeight: 1.4, color: S.charcoalMute, marginTop: 3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{deal.desc}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                    <span style={{ border: `1px solid ${S.gold}`, color: S.gold, fontSize: 8, fontWeight: 600, borderRadius: 999, padding: '1.5px 7px' }}>{deal.save}</span>
                    {deal.end && <span style={{ background: '#FFF0F0', border: '1px solid #E88080', color: '#E88080', fontSize: 7.5, borderRadius: 999, padding: '1.5px 6px' }}>Ends soon</span>}
                    <span style={{ marginLeft: 'auto', color: S.rose, fontSize: 8.5 }}>View →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PhoneShell>
      </div>

      {/* ── Feature IV: Wardrobe ──────────────────────────── */}
      <div style={{ marginTop: 80, padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14, color: S.gold, letterSpacing: '0.1em', marginBottom: 6 }}>IV - Wardrobe</div>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: 34, lineHeight: 1.05, color: S.charcoal }}>
            Your closet, <em style={{ fontStyle: 'italic', color: S.rose }}>catalogued.</em>
          </h3>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 16, lineHeight: 1.45, color: S.charcoalSoft, marginTop: 10, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
            Photograph what you wear, build a quiet library of pieces, and let the morning brief draw from it.
          </div>
        </div>
        <PhoneShell tall>
          <div style={{ padding: '0 14px 12px' }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: S.charcoal, lineHeight: 1 }}>Wardrobe</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 10, color: S.charcoalMute, marginTop: 3 }}>Twenty-eight pieces, considered</div>
            <div style={{ display: 'flex', gap: 4, background: S.rosePale, padding: 3, borderRadius: 999, marginTop: 14 }}>
              {['Log', 'My wardrobe', 'Suggest'].map((t, i) => (
                <div key={t} style={{ flex: 1, textAlign: 'center', fontSize: 9, padding: 6, borderRadius: 999, background: i === 1 ? S.rose : 'transparent', color: i === 1 ? '#fff' : S.rose }}>
                  {t}
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7, marginTop: 12 }}>
              {[['👗', 'Slip dress'], ['🧥', 'Linen blazer'], ['👖', 'Wide trousers'], ['👠', 'Cognac mules'], ['👜', 'Straw tote'], ['👕', 'Silk cami'], ['💍', 'Gold hoops'], ['👗', 'Midi dress'], ['👔', 'Trench']].map(([emoji, label], i) => (
                <div key={i} style={{ aspectRatio: '1', background: '#fff', border: `1px solid ${S.hairline}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, position: 'relative', overflow: 'hidden' }}>
                  {emoji}
                  <div style={{ position: 'absolute', bottom: 3, left: 3, right: 3, fontSize: 7, color: S.charcoalMute, textAlign: 'center', background: 'rgba(255,255,255,0.85)', borderRadius: 5, padding: '1px 0' }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, background: '#fff', border: `1px solid ${S.hairline}`, borderRadius: 12, padding: 12 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: S.charcoal, lineHeight: 1.2 }}>
                <em style={{ fontStyle: 'italic', color: S.rose }}>Suggested</em> - for today&apos;s weather
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 9 }}>
                {['👗', '🧥', '👠', '👜'].map((e, i) => (
                  <div key={i} style={{ flex: 1, aspectRatio: '1', background: S.ivory, border: `1px solid ${S.hairline}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{e}</div>
                ))}
              </div>
              <div style={{ marginTop: 9, paddingTop: 8, borderTop: `1px solid ${S.hairline}`, fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 10.5, lineHeight: 1.4, color: S.charcoalSoft }}>
                The linen blazer keeps this elegant for the cooler morning, with the mules tying the warmth back through.
              </div>
            </div>
          </div>
        </PhoneShell>
      </div>

      {/* ── Footer ────────────────────────────────────────── */}
      <div style={{ marginTop: 64, padding: '36px 24px 80px', textAlign: 'center', borderTop: `1px solid ${S.hairline}` }}>
        <div style={{ width: 46, height: 46, borderRadius: '50%', border: `1px solid ${S.gold}`, margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 18, color: S.gold }}>
          P
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 16, color: S.charcoal }}>
          Polly<span style={{ color: S.gold, margin: '0 4px' }}>·</span>App
        </div>
        <div style={{ marginTop: 8, fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: S.charcoalMute }}>
          Est. MMXXVI · One of one
        </div>
        <div style={{ marginTop: 14, fontSize: 11, color: S.charcoalMute, letterSpacing: '0.02em' }}>
          pollysapp.com
        </div>
      </div>
    </div>
  );
}
