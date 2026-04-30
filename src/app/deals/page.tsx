'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Loader2, UtensilsCrossed } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Deal } from '@/types';

type Category = 'All' | 'Dining';
const CATEGORIES: Category[] = ['All', 'Dining'];

function categoryIcon(_category: string) {
  return <UtensilsCrossed size={22} color="#C9848A" />;
}

function isEndingSoon(expiry: string): boolean {
  const d = new Date(expiry);
  if (isNaN(d.getTime())) return false;
  return d.getTime() - Date.now() < 48 * 60 * 60 * 1000 && d.getTime() > Date.now();
}

// ── Skeleton card ────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      display: 'flex', background: '#FFFFFF', borderRadius: 16,
      border: '1px solid #EDD9DB', overflow: 'hidden', minHeight: 100,
      boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    }}>
      <div className="skeleton-pulse" style={{ width: 56, flexShrink: 0, background: '#F2D4D7', borderRadius: '16px 0 0 16px' }} />
      <div style={{ flex: 1, padding: '14px 14px 14px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div className="skeleton-pulse" style={{ height: 11, borderRadius: 4, background: '#F2D4D7', width: '40%' }} />
        <div className="skeleton-pulse" style={{ height: 14, borderRadius: 4, background: '#F2D4D7', width: '85%' }} />
        <div className="skeleton-pulse" style={{ height: 12, borderRadius: 4, background: '#EDD9DB', width: '70%' }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
          <div className="skeleton-pulse" style={{ height: 22, width: 70, borderRadius: 20, background: '#EDD9DB' }} />
          <div className="skeleton-pulse" style={{ height: 22, width: 60, borderRadius: 20, background: '#EDD9DB', marginLeft: 'auto' }} />
        </div>
      </div>
    </div>
  );
}

// ── Deal card ────────────────────────────────────────────────────
function DealCard({ deal, index }: { deal: Deal; index: number }) {
  const endingSoon = isEndingSoon(deal.expiry_date);

  return (
    <motion.div
      className="press-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: 'easeOut' }}
      style={{
        display: 'flex', background: '#FFFFFF', borderRadius: 16,
        border: '1px solid #EDD9DB', overflow: 'hidden', minHeight: 100,
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      }}
    >
      {/* Left icon block */}
      <div style={{
        width: 56, flexShrink: 0, background: '#FAF7F4',
        borderRadius: '16px 0 0 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {categoryIcon(deal.category)}
      </div>

      {/* Right content */}
      <div style={{ flex: 1, padding: '14px 14px 14px 12px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 10,
          fontWeight: 500, color: '#7A7170',
        }}>
          {deal.source_name}
        </span>

        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 14,
          fontWeight: 600, color: '#2A2A2A', lineHeight: 1.35,
          marginTop: 2, marginBottom: 0,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {deal.title}
        </p>

        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 12,
          color: '#7A7170', lineHeight: 1.5, marginTop: 4,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {deal.description}
        </p>

        {/* Bottom row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          <span style={{
            background: '#FAF7F4', border: '1px solid #C4A35A',
            color: '#C4A35A', fontFamily: "'DM Sans', sans-serif",
            fontSize: 11, fontWeight: 600, borderRadius: 20,
            padding: '3px 10px', flexShrink: 0,
          }}>
            {deal.saving}
          </span>

          {endingSoon && (
            <span style={{
              background: '#FFF0F0', border: '1px solid #E88080',
              color: '#E88080', fontFamily: "'DM Sans', sans-serif",
              fontSize: 11, borderRadius: 20, padding: '3px 10px', flexShrink: 0,
            }}>
              Ends soon
            </span>
          )}

          <button
            onClick={() => window.open(deal.booking_url, '_blank')}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              fontFamily: "'DM Sans', sans-serif", fontSize: 12,
              color: '#C9848A', cursor: 'pointer', padding: '4px 0',
              minHeight: 44, display: 'flex', alignItems: 'center',
            }}
          >
            View deal →
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Add source section ────────────────────────────────────────────
function AddSourceSection({ onDealsAdded }: { onDealsAdded: () => void }) {
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<'Dining' | 'Flights' | 'Entertainment'>('Dining');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const raw = url.trim();
    if (!raw) return;
    let parsed: string;
    try { parsed = new URL(raw.startsWith('http') ? raw : `https://${raw}`).href; }
    catch { setError('Please enter a valid URL'); return; }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/deals/refresh-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: parsed, category }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? 'Failed to fetch deals');
      setUrl('');
      onDealsAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const catBtn = (cat: typeof category) => ({
    height: 36, paddingLeft: 16, paddingRight: 16, borderRadius: 999,
    border: 'none', cursor: 'pointer', flexShrink: 0,
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
    background: category === cat ? '#C9848A' : '#F2D4D7',
    color: category === cat ? '#FFFFFF' : '#C9848A',
    transition: 'background 0.15s, color 0.15s',
  } as React.CSSProperties);

  return (
    <div style={{
      border: '1px dashed #EDD9DB', borderRadius: 16, padding: 16, marginTop: 4,
    }}>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: '#7A7170', marginBottom: 12 }}>
        Got a deal site?
      </p>

      <input
        type="url"
        value={url}
        onChange={e => { setUrl(e.target.value); setError(null); }}
        onKeyDown={e => e.key === 'Enter' && !loading && handleSubmit()}
        placeholder="Paste a URL here..."
        style={{
          width: '100%', border: '1px solid #EDD9DB', borderRadius: 12,
          padding: '12px 14px', fontFamily: "'DM Sans', sans-serif",
          fontSize: 16, background: '#FFFFFF', color: '#2A2A2A',
          outline: 'none', boxSizing: 'border-box',
        }}
      />

      {error && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#E88080', marginTop: 6, paddingLeft: 2 }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        {(['Dining'] as const).map(cat => (
          <button key={cat} onClick={() => setCategory(cat)} style={catBtn(cat)}>
            {cat}
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !url.trim()}
        style={{
          width: '100%', height: 52, marginTop: 12, borderRadius: 12,
          background: '#C9848A', color: '#FFFFFF', border: 'none',
          fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
          cursor: loading || !url.trim() ? 'not-allowed' : 'pointer',
          opacity: loading || !url.trim() ? 0.6 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'opacity 0.2s',
        }}
      >
        {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
        {loading ? 'Finding deals…' : 'Find deals'}
      </button>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export default function DealsPage() {
  const [deals, setDeals]             = useState<Deal[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>('All');

  const fetchDeals = useCallback(async () => {
    const { data } = await supabase
      .from('deals').select('*')
      .order('created_at', { ascending: false });
    setDeals(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDeals();
    setRefreshing(false);
  };

  const filtered = activeCategory === 'All'
    ? deals
    : deals.filter(d => d.category === activeCategory);

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .filter-scroll::-webkit-scrollbar { display: none; }
        .filter-scroll { scrollbar-width: none; }
      `}</style>

      <div style={{ background: '#FAF7F4', minHeight: '100dvh', overflowX: 'hidden' }}>
        {/* Header */}
        <div style={{
          padding: '28px 20px 14px',
          borderBottom: '1px solid #EDD9DB',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          background: '#FAF7F4', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 400, color: '#2A2A2A', lineHeight: 1, marginBottom: 4 }}>
              Deals
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontStyle: 'italic', fontSize: 13, color: '#7A7170' }}>
              Hong Kong&apos;s best offers today
            </p>
          </div>

          <button
            onClick={handleRefresh} disabled={refreshing}
            style={{
              height: 36, paddingLeft: 14, paddingRight: 14,
              borderRadius: 999, border: '1px solid #C9848A',
              background: 'transparent', color: '#C9848A',
              fontFamily: "'DM Sans', sans-serif", fontSize: 13,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: refreshing ? 0.6 : 1, transition: 'opacity 0.2s',
            }}
          >
            {refreshing && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* Category filter tabs */}
        <div
          className="filter-scroll"
          style={{
            display: 'flex', gap: 8, overflowX: 'auto',
            padding: '12px 16px',
            borderBottom: '1px solid #EDD9DB',
            background: '#FAF7F4',
          }}
        >
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                height: 44, paddingLeft: 18, paddingRight: 18,
                borderRadius: 999, border: 'none', flexShrink: 0,
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
                background: activeCategory === cat ? '#C9848A' : '#F2D4D7',
                color: activeCategory === cat ? '#FFFFFF' : '#C9848A',
                cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Deals list */}
        <div style={{ padding: '12px 16px 80px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 14 }}>
              <Tag size={32} color="#C9848A" strokeWidth={1.5} />
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontStyle: 'italic', fontSize: 14, color: '#7A7170', textAlign: 'center' }}>
                {deals.length > 0 ? 'No deals in this category yet' : "Tap Refresh to load today's deals"}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filtered.map((deal, i) => (
                <DealCard key={deal.id} deal={deal} index={i} />
              ))}
            </AnimatePresence>
          )}

          {/* Add source */}
          {!loading && (
            <AddSourceSection onDealsAdded={fetchDeals} />
          )}
        </div>
      </div>
    </>
  );
}
