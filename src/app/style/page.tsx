'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, X, Sliders, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { StyleItem } from '@/types';
import {
  UNIQUE_SOURCE_NAMES, defaultPrefs, SourcePrefs,
  CustomSource, CUSTOM_SOURCES_KEY,
} from '@/lib/styleSources';

const PREFS_KEY = 'polly_style_sources';

// ── Shared styles ────────────────────────────────────────────────
const sheet: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 200,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'flex-end',
};
const sheetPanel: React.CSSProperties = {
  background: '#FFFFFF', borderRadius: '24px 24px 0 0',
  width: '100%', maxHeight: '90dvh',
  display: 'flex', flexDirection: 'column',
};
const handle: React.CSSProperties = {
  width: 36, height: 4, borderRadius: 999, background: '#EDD9DB',
};

// ── Toggle ───────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      role="switch" aria-checked={on}
      onClick={() => onChange(!on)}
      style={{
        width: 44, height: 26, borderRadius: 13,
        background: on ? '#C9848A' : '#EDD9DB',
        position: 'relative', cursor: 'pointer', flexShrink: 0,
        transition: 'background 0.2s',
      }}
    >
      <div style={{
        position: 'absolute', top: 3,
        left: on ? 21 : 3,
        width: 20, height: 20, borderRadius: '50%',
        background: '#FFFFFF',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left 0.2s',
      }} />
    </div>
  );
}

// ── Sources sheet ────────────────────────────────────────────────
function SourcesSheet({
  prefs, onToggle, customSources,
  onAddCustom, onToggleCustom, onRemoveCustom,
  onClose, onItemsAdded,
}: {
  prefs: SourcePrefs;
  onToggle: (name: string, v: boolean) => void;
  customSources: CustomSource[];
  onAddCustom: (src: CustomSource) => void;
  onToggleCustom: (url: string, v: boolean) => void;
  onRemoveCustom: (url: string) => void;
  onClose: () => void;
  onItemsAdded: () => void;
}) {
  const [urlInput, setUrlInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [addStatus, setAddStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleAdd = async () => {
    const raw = urlInput.trim();
    if (!raw) return;
    let url: string;
    try { url = new URL(raw.startsWith('http') ? raw : `https://${raw}`).href; }
    catch { setAddStatus({ ok: false, msg: 'Please enter a valid URL' }); return; }
    if (customSources.some(s => s.url === url)) {
      setAddStatus({ ok: false, msg: 'Already in your list' }); return;
    }
    setAdding(true); setAddStatus(null);
    try {
      const res = await fetch('/api/style/refresh-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? 'Failed');
      const hostname = new URL(url).hostname.replace(/^www\./, '');
      const name = hostname.split('.')[0].replace(/^./, (c: string) => c.toUpperCase());
      onAddCustom({ url, name, enabled: true });
      setAddStatus({ ok: true, msg: `Added ${data.inserted} item${data.inserted !== 1 ? 's' : ''} from ${name}` });
      setUrlInput('');
      onItemsAdded();
    } catch (err) {
      setAddStatus({ ok: false, msg: err instanceof Error ? err.message : 'Something went wrong' });
    } finally { setAdding(false); }
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11, letterSpacing: '0.18em',
    textTransform: 'uppercase', color: '#C4A35A',
    fontWeight: 500, marginBottom: 2,
  };
  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '13px 0', borderBottom: '1px solid #EDD9DB',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={sheet} onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
        style={sheetPanel} onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0', flexShrink: 0 }}>
          <div style={handle} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 10px', flexShrink: 0 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 400, color: '#2A2A2A' }}>
            Your Sources
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A7170', padding: 8, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '0 20px' }}>
          <p style={labelStyle}>Default</p>
          {UNIQUE_SOURCE_NAMES.map(name => (
            <div key={name} style={rowStyle}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#2A2A2A' }}>{name}</span>
              <Toggle on={prefs[name] ?? true} onChange={v => onToggle(name, v)} />
            </div>
          ))}

          {customSources.length > 0 && (
            <>
              <p style={{ ...labelStyle, marginTop: 18 }}>Added</p>
              {customSources.map(src => (
                <div key={src.url} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 0', borderBottom: '1px solid #EDD9DB' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#2A2A2A', marginBottom: 1 }}>{src.name}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#7A7170', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{src.url}</p>
                  </div>
                  <Toggle on={src.enabled} onChange={v => onToggleCustom(src.url, v)} />
                  <button onClick={() => onRemoveCustom(src.url)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C9848A', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Remove source">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </>
          )}

          <div style={{ padding: '18px 0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="url" value={urlInput}
                onChange={e => { setUrlInput(e.target.value); setAddStatus(null); }}
                placeholder="Paste a URL to add..."
                onKeyDown={e => e.key === 'Enter' && !adding && handleAdd()}
                style={{ flex: 1, height: 44, borderRadius: 999, border: '1px solid #EDD9DB', padding: '0 14px', fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: '#2A2A2A', background: '#FAF7F4', outline: 'none' }}
              />
              <button
                onClick={handleAdd} disabled={adding || !urlInput.trim()}
                style={{ height: 44, paddingLeft: 18, paddingRight: 18, borderRadius: 999, background: '#C9848A', color: '#FFFFFF', border: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, cursor: adding || !urlInput.trim() ? 'not-allowed' : 'pointer', opacity: adding || !urlInput.trim() ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}
              >
                {adding ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                {adding ? 'Adding…' : 'Add'}
              </button>
            </div>
            {adding && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontStyle: 'italic', fontSize: 12, color: '#7A7170', paddingLeft: 4 }}>
                Fetching and analysing — this takes about 30 seconds...
              </p>
            )}
            {addStatus && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: addStatus.ok ? '#7A7170' : '#C9848A', paddingLeft: 4 }}>
                {addStatus.msg}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Skeleton card ────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ borderRadius: 16, background: '#FFFFFF', border: '1px solid #EDD9DB', overflow: 'hidden' }}>
      <div className="skeleton-pulse" style={{ aspectRatio: '3/4', background: '#F2D4D7' }} />
      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div className="skeleton-pulse" style={{ height: 13, borderRadius: 4, background: '#F2D4D7', width: '85%' }} />
        <div className="skeleton-pulse" style={{ height: 13, borderRadius: 4, background: '#F2D4D7', width: '65%' }} />
        <div className="skeleton-pulse" style={{ height: 12, borderRadius: 4, background: '#EDD9DB', width: '95%' }} />
        <div className="skeleton-pulse" style={{ height: 12, borderRadius: 4, background: '#EDD9DB', width: '75%' }} />
      </div>
    </div>
  );
}

// ── Feed card ────────────────────────────────────────────────────
function StyleCard({ item, index, onImageTap }: { item: StyleItem; index: number; onImageTap: (item: StyleItem) => void }) {
  return (
    <motion.div
      className="press-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: 'easeOut' }}
      style={{ borderRadius: 16, background: '#FFFFFF', border: '1px solid #EDD9DB', overflow: 'hidden', boxShadow: '0 2px 10px -5px rgba(201,132,138,0.12)', cursor: 'pointer' }}
    >
      {/* Portrait image — 3:4 ratio */}
      <div
        style={{ position: 'relative', aspectRatio: '3/4', background: '#F2D4D7' }}
        onClick={() => onImageTap(item)}
      >
        <img
          src={item.image_url} alt={item.headline}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '16px 16px 0 0' }}
          onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
        />
        {/* Source badge — top left, 6px from edges */}
        <div style={{
          position: 'absolute', top: 6, left: 6,
          background: '#F2D4D7', borderRadius: 999,
          padding: '3px 7px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 10, fontWeight: 500,
          color: '#C9848A', letterSpacing: '0.04em',
          maxWidth: '48%', overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.source_name}
        </div>
        {/* Category pill — top right, 6px from edges */}
        <div style={{
          position: 'absolute', top: 6, right: 6,
          background: 'rgba(42,42,42,0.8)', borderRadius: 999,
          padding: '3px 7px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 10, color: '#FFFFFF',
          letterSpacing: '0.04em',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          maxWidth: '48%', overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.category}
        </div>
      </div>

      <div style={{ padding: '10px 10px 12px' }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13, fontWeight: 600,
          color: '#2A2A2A', lineHeight: 1.4, marginBottom: 4,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {item.headline}
        </p>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12, color: '#7A7170', lineHeight: 1.6,
          display: '-webkit-box', WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {item.summary}
        </p>
      </div>
    </motion.div>
  );
}

// ── Analyse modal ────────────────────────────────────────────────
function AnalyseModal({ item, onClose }: { item: StyleItem; onClose: () => void }) {
  const [analysing, setAnalysing] = useState(false);
  const [shopItems, setShopItems] = useState<string[]>([]);

  const handleAnalyse = async () => {
    setAnalysing(true);
    try {
      const res = await fetch('/api/style/analyse-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: item.image_url }),
      });
      const data = await res.json();
      setShopItems(data.items ?? []);
    } catch { /* silently fail */ }
    finally { setAnalysing(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={sheet} onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
        style={{ ...sheetPanel, maxHeight: '90dvh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px', flexShrink: 0 }}>
          <div style={handle} />
        </div>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#7A7170', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={20} />
        </button>

        {/* Portrait image in modal too */}
        <div style={{ aspectRatio: '3/4', background: '#F2D4D7', overflow: 'hidden', flexShrink: 0, maxHeight: '45dvh' }}>
          <img src={item.image_url} alt={item.headline} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>

        <div style={{ padding: '20px 20px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: '#2A2A2A', lineHeight: 1.4, marginBottom: 8 }}>
              {item.headline}
            </p>
            {item.source_url && (
              <button
                onClick={() => window.open(item.source_url, '_blank')}
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                  color: '#C9848A', textDecoration: 'underline', textUnderlineOffset: 3,
                }}
              >
                Read article →
              </button>
            )}
          </div>

          {shopItems.length === 0 && !analysing && (
            <button
              onClick={handleAnalyse}
              style={{
                width: '100%', minHeight: 52, borderRadius: 999,
                background: '#B5737A', color: '#FFFFFF',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 16, fontWeight: 500,
                border: 'none', cursor: 'pointer',
                letterSpacing: '0.02em',
              }}
            >
              Find items to shop
            </button>
          )}

          {analysing && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 0' }}>
              <Loader2 size={16} color="#C9848A" style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontStyle: 'italic', fontSize: 14, color: '#7A7170' }}>
                Analysing outfit...
              </span>
            </div>
          )}

          {shopItems.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {shopItems.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => window.open(`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(chip)}`, '_blank')}
                  style={{
                    background: '#F2D4D7', color: '#2A2A2A',
                    border: 'none', borderRadius: 999,
                    padding: '0 16px', minHeight: 44,
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13, cursor: 'pointer', fontWeight: 500,
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export default function StylePage() {
  const [items, setItems]               = useState<StyleItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [selectedItem, setSelectedItem] = useState<StyleItem | null>(null);
  const [sourcesOpen, setSourcesOpen]   = useState(false);
  const [sourcePrefs, setSourcePrefs]   = useState<SourcePrefs>(defaultPrefs());
  const [customSources, setCustomSources] = useState<CustomSource[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PREFS_KEY);
      if (saved) setSourcePrefs({ ...defaultPrefs(), ...JSON.parse(saved) });
    } catch { /* ignore */ }
    try {
      const saved = localStorage.getItem(CUSTOM_SOURCES_KEY);
      if (saved) setCustomSources(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const savePrefs = (prefs: SourcePrefs) => {
    setSourcePrefs(prefs);
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  };
  const saveCustom = (sources: CustomSource[]) => {
    setCustomSources(sources);
    localStorage.setItem(CUSTOM_SOURCES_KEY, JSON.stringify(sources));
  };

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from('style_items').select('*')
      .order('created_at', { ascending: false }).limit(40);
    const rows = data ?? [];
    setItems(rows);
    setLoading(false);
    return rows.length;
  }, []);

  useEffect(() => {
    fetchItems().then(count => {
      if (count === 0) {
        setRefreshing(true);
        const enabledSources = Object.entries(defaultPrefs()).filter(([, on]) => on).map(([n]) => n);
        fetch('/api/style/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabledSources }),
        }).then(() => fetchItems()).finally(() => setRefreshing(false));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchItems]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const enabledSources = Object.entries(sourcePrefs).filter(([, on]) => on).map(([n]) => n);
    await fetch('/api/style/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabledSources }),
    });
    await fetchItems();
    setRefreshing(false);
  };

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

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
              Style
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontStyle: 'italic', fontSize: 13, color: '#7A7170' }}>
              Your fashion world today
            </p>
          </div>

          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button
              onClick={() => setSourcesOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A7170', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Manage sources"
            >
              <Sliders size={20} />
            </button>
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
              {refreshing ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Feed */}
        <div style={{ padding: '10px 10px 80px' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 14 }}>
              <Sparkles size={32} color="#C9848A" strokeWidth={1.5} />
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontStyle: 'italic', fontSize: 14, color: '#7A7170', textAlign: 'center' }}>
                Tap Refresh to load today&apos;s style feed
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {items.map((item, i) => (
                <StyleCard key={item.id} item={item} index={i} onImageTap={setSelectedItem} />
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedItem && <AnalyseModal key="analyse" item={selectedItem} onClose={() => setSelectedItem(null)} />}
        {sourcesOpen && (
          <SourcesSheet
            key="sources"
            prefs={sourcePrefs}
            onToggle={(n, v) => savePrefs({ ...sourcePrefs, [n]: v })}
            customSources={customSources}
            onAddCustom={src => saveCustom([...customSources, src])}
            onToggleCustom={(url, v) => saveCustom(customSources.map(s => s.url === url ? { ...s, enabled: v } : s))}
            onRemoveCustom={url => saveCustom(customSources.filter(s => s.url !== url))}
            onClose={() => setSourcesOpen(false)}
            onItemsAdded={fetchItems}
          />
        )}
      </AnimatePresence>
    </>
  );
}
