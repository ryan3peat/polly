'use client';

import { useEffect, useState } from 'react';
import SplashScreen from '@/components/splash/SplashScreen';

export default function Home() {
  const [splashComplete, setSplashComplete] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('polly_splash_seen');
    if (seen) {
      setSplashComplete(true);
    }
    setReady(true);
  }, []);

  const handleSplashComplete = () => {
    localStorage.setItem('polly_splash_seen', '1');
    setSplashComplete(true);
  };

  // Avoid flash before localStorage check resolves
  if (!ready) return null;

  if (!splashComplete) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#FAF7F4' }}>
        <SplashScreen
          onComplete={handleSplashComplete}
          photos={[
            '/photos/p0.jpg',
            '/photos/p1.jpg',
            '/photos/p2.jpg',
            '/photos/p3.jpg',
            '/photos/p4.jpg',
            '/photos/p5.jpg',
            '/photos/p6.jpg',
            '/photos/p7.jpg',
            '/photos/p8.jpg',
          ]}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        background: '#FAF7F4',
      }}
    >
      <p
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 24,
          fontWeight: 400,
          color: '#2A2A2A',
          letterSpacing: '0.02em',
        }}
      >
        Main app coming soon
      </p>
    </div>
  );
}
