'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
  photos?: string[];
}

const FRAME_SIZE = 56;
const NUM_FRAMES = 8;
const CONTENT_OFFSET = -46;

export default function SplashScreen({ onComplete, photos }: SplashScreenProps) {
  const [showRing, setShowRing]       = useState(true);
  const [showPortrait, setShowPortrait] = useState(false);
  const [showTitle, setShowTitle]     = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [fadeOut, setFadeOut]         = useState(false);

  // Computed at mount so we have access to window
  const [ringRadius, setRingRadius]   = useState(120);
  const [portraitSize, setPortraitSize] = useState(120);

  useEffect(() => {
    const w = window.innerWidth;
    setRingRadius(Math.min(Math.round(w * 0.35), 140));
    setPortraitSize(w < 360 ? 100 : 120);
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => { setShowRing(false); setShowPortrait(true); }, 2500);
    const t2 = setTimeout(() => setShowTitle(true), 3200);
    const t3 = setTimeout(() => setShowSubtitle(true), 3600);
    const t4 = setTimeout(() => setFadeOut(true), 4500);
    const t5 = setTimeout(onComplete, 5100);
    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, [onComplete]);

  const ringFrames = Array.from({ length: NUM_FRAMES }, (_, i) => {
    const angleDeg = (i * 360) / NUM_FRAMES - 90;
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
      x: ringRadius * Math.cos(angleRad),
      y: ringRadius * Math.sin(angleRad),
    };
  });

  return (
    <motion.div
      animate={{ opacity: fadeOut ? 0 : 1 }}
      transition={{ duration: 0.6 }}
      style={{ position: 'fixed', inset: 0, background: '#FAF7F4', overflow: 'hidden' }}
    >
      {/* Skip — min 44×44px touch target */}
      <button
        onClick={onComplete}
        style={{
          position: 'absolute',
          top: 44,
          right: 12,
          background: 'none',
          border: 'none',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          color: '#7A7170',
          cursor: 'pointer',
          minWidth: 44,
          minHeight: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        skip
      </button>

      {/* Ring anchor */}
      <div
        style={{
          position: 'absolute',
          top: `calc(50% + ${CONTENT_OFFSET}px)`,
          left: '50%',
          width: 0,
          height: 0,
        }}
      >
        <AnimatePresence>
          {showRing && (
            <motion.div
              key="ring"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, rotate: 360 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                opacity: { duration: 0.4 },
                rotate: { duration: 4, ease: 'linear', repeat: Infinity },
                scale: { duration: 0.6 },
              }}
              style={{ position: 'absolute', width: 0, height: 0 }}
            >
              {ringFrames.map(({ x, y }, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    width: FRAME_SIZE,
                    height: FRAME_SIZE,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: '#F2D4D7',
                    transform: `translate(calc(${x}px - 50%), calc(${y}px - 50%))`,
                  }}
                >
                  {photos && photos[i % photos.length] && (
                    <img
                      src={photos[i % photos.length]}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Portrait + text anchor */}
      <div
        style={{
          position: 'absolute',
          top: `calc(50% + ${CONTENT_OFFSET}px)`,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <motion.div
          animate={{ opacity: showPortrait ? 1 : 0, scale: showPortrait ? 1 : 0.8 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            width: portraitSize,
            height: portraitSize,
            borderRadius: '50%',
            border: '2px solid #C4A35A',
            overflow: 'hidden',
            background: '#C9848A',
            flexShrink: 0,
            transform: 'translateY(-50%)',
          }}
        >
          {photos && photos[0] && (
            <img
              src={photos[0]}
              alt="Polly"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </motion.div>

        <motion.h1
          animate={{ opacity: showTitle ? 1 : 0, y: showTitle ? 0 : 16 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 34,
            fontWeight: 400,
            color: '#2A2A2A',
            letterSpacing: '0.05em',
            marginTop: 16,
            marginBottom: 0,
            whiteSpace: 'nowrap',
          }}
        >
          Polly&apos;s App
        </motion.h1>

        <motion.p
          animate={{ opacity: showSubtitle ? 1 : 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontStyle: 'italic',
            fontSize: 13,
            color: '#7A7170',
            marginTop: 8,
            whiteSpace: 'nowrap',
          }}
        >
          Your daily world, curated.
        </motion.p>
      </div>
    </motion.div>
  );
}
