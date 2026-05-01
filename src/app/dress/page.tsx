'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ImageIcon, Loader2, Shirt, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ── Types ────────────────────────────────────────────────────────
type Tab = 'log' | 'wardrobe' | 'suggestions';

interface WardrobeItem {
  id: string;
  category: string;
  subcategory: string;
  description: string;
  colours: string[];
  wear_count: number;
  last_worn_at: string | null;
  created_at: string;
  image_url?: string | null;
}

interface Suggestion {
  outfit_name: string;
  items: WardrobeItem[];
  reasoning: string;
  weather_note: string | null;
}

interface Weather {
  tempC: number;
  feelsC: number;
  desc: string;
  humidity: number;
}

// ── Constants ────────────────────────────────────────────────────
const CATEGORY_EMOJI: Record<string, string> = {
  Top: '👕', Dress: '👗', Bottom: '👖', Outerwear: '🧥',
  Shoes: '👠', Bag: '👜', Jewellery: '💍', Other: '🏷️',
};

const TABS: { key: Tab; label: string }[] = [
  { key: 'log',         label: 'Log Outfit'  },
  { key: 'wardrobe',    label: 'My Wardrobe' },
  { key: 'suggestions', label: 'Suggestions' },
];

// ── Shared label style ───────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 11, letterSpacing: '0.18em',
  textTransform: 'uppercase', color: '#C4A35A',
  fontWeight: 500, marginBottom: 10,
};

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
          <div className="skeleton-pulse" style={{ height: 22, width: 80, borderRadius: 20, background: '#EDD9DB' }} />
        </div>
      </div>
    </div>
  );
}

// ── Lightbox ─────────────────────────────────────────────────────
function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Outfit"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '96vw', maxHeight: '90dvh',
          objectFit: 'contain', borderRadius: 12,
        }}
      />
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          position: 'absolute', top: 20, right: 20,
          background: 'rgba(255,255,255,0.15)', border: 'none',
          borderRadius: '50%', width: 40, height: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#FFFFFF',
        }}
      >
        ✕
      </button>
    </div>
  );
}

// ── Wardrobe item card ───────────────────────────────────────────
function WardrobeCard({ item, index, onDelete }: { item: WardrobeItem; index: number; onDelete: (id: string) => void }) {
  const [deleting, setDeleting]     = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const lastWorn = item.last_worn_at
    ? new Date(item.last_worn_at).toLocaleDateString('en-HK', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch('/api/wardrobe/items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id }),
      });
      onDelete(item.id);
    } catch { setDeleting(false); }
  };

  return (
    <>
      {lightboxOpen && item.image_url && (
        <Lightbox url={item.image_url} onClose={() => setLightboxOpen(false)} />
      )}
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
        {/* Left: thumbnail or emoji */}
        {item.image_url ? (
          <button
            onClick={() => setLightboxOpen(true)}
            aria-label="View outfit photo"
            style={{
              width: 72, flexShrink: 0, padding: 0, border: 'none',
              cursor: 'pointer', overflow: 'hidden',
              borderRadius: '16px 0 0 16px', background: '#FAF7F4',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image_url}
              alt="Outfit"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </button>
        ) : (
          <div style={{
            width: 56, flexShrink: 0, background: '#FAF7F4',
            borderRadius: '16px 0 0 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
          }}>
            {CATEGORY_EMOJI[item.category] ?? '🏷️'}
          </div>
        )}

        {/* Right content */}
        <div style={{ flex: 1, padding: '12px 14px 12px 12px', display: 'flex', flexDirection: 'column', minWidth: 0, gap: 4 }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500, color: '#7A7170' }}>
            {item.subcategory}
          </span>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
            color: '#2A2A2A', lineHeight: 1.35, margin: 0,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {item.description}
          </p>

          {/* Colour pills */}
          {item.colours?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
              {item.colours.slice(0, 4).map((colour, i) => (
                <span key={i} style={{
                  background: '#FAF7F4', border: '1px solid #EDD9DB',
                  color: '#7A7170', fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11, borderRadius: 20, padding: '2px 8px',
                }}>
                  {colour}
                </span>
              ))}
            </div>
          )}

          {/* Bottom row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{
              background: '#FAF7F4', border: '1px solid #C4A35A',
              color: '#C4A35A', fontFamily: "'DM Sans', sans-serif",
              fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '3px 10px', flexShrink: 0,
            }}>
              Worn {item.wear_count}×
            </span>
            <span style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 11,
              color: lastWorn ? '#7A7170' : '#E88080',
            }}>
              {lastWorn ? `Last worn ${lastWorn}` : 'Never worn'}
            </span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Remove item"
              style={{
                marginLeft: 'auto', background: 'none', border: 'none',
                cursor: deleting ? 'not-allowed' : 'pointer',
                color: '#C9C0BE', opacity: deleting ? 0.4 : 1,
                minWidth: 36, minHeight: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'color 0.15s',
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ── LOG TAB ──────────────────────────────────────────────────────
function LogTab() {
  const cameraRef  = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl]   = useState<string | null>(null);
  const [file, setFile]               = useState<File | null>(null);
  const [uploading, setUploading]     = useState(false);
  const [success, setSuccess]         = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setSuccess(null);
    setError(null);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleLog = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // Upload to Supabase storage
      const path = `${Date.now()}-${file.name.replace(/\s/g, '-')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('wardrobe-photos')
        .upload(path, file, { contentType: file.type, upsert: true });

      if (uploadError) throw new Error(uploadError.message);

      const { data: urlData } = supabase.storage
        .from('wardrobe-photos')
        .getPublicUrl(uploadData.path);

      const photo_url = urlData.publicUrl;
      const worn_at = new Date().toISOString().split('T')[0];

      const res = await fetch('/api/wardrobe/log-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url, worn_at }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? 'Failed to log outfit');

      const total = data.inserted + data.matched;
      setSuccess(`Found ${total} item${total !== 1 ? 's' : ''} in your wardrobe`);

      setTimeout(() => {
        setPreviewUrl(null);
        setFile(null);
        setSuccess(null);
        if (cameraRef.current)  cameraRef.current.value  = '';
        if (libraryRef.current) libraryRef.current.value = '';
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Hidden inputs — camera and library */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Upload area */}
      {!previewUrl ? (
        <div style={{
          border: '1.5px dashed #EDD9DB', borderRadius: 16,
          padding: '24px 20px', background: '#FFFFFF',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        }}>
          <span style={{
            fontFamily: "'DM Sans', sans-serif", fontStyle: 'italic',
            fontSize: 13, color: '#7A7170',
          }}>
            Add today&apos;s outfit
          </span>
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <button
              onClick={() => cameraRef.current?.click()}
              style={{
                flex: 1, height: 52, borderRadius: 12, border: '1px solid #EDD9DB',
                background: '#FAF7F4', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Camera size={20} color="#C9848A" strokeWidth={1.5} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#7A7170' }}>
                Take photo
              </span>
            </button>
            <button
              onClick={() => libraryRef.current?.click()}
              style={{
                flex: 1, height: 52, borderRadius: 12, border: '1px solid #EDD9DB',
                background: '#FAF7F4', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <ImageIcon size={20} color="#C9848A" strokeWidth={1.5} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#7A7170' }}>
                Choose photo
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            onClick={() => libraryRef.current?.click()}
            style={{ cursor: 'pointer', borderRadius: 12, overflow: 'hidden', maxHeight: 300 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Outfit preview"
              style={{ width: '100%', maxHeight: 300, objectFit: 'cover', display: 'block' }}
            />
          </div>

          <button
            onClick={handleLog}
            disabled={uploading}
            style={{
              width: '100%', height: 52, borderRadius: 12,
              background: '#C9848A', color: '#FFFFFF', border: 'none',
              fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'opacity 0.2s',
            }}
          >
            {uploading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {uploading ? 'Analysing outfit…' : 'Log this outfit'}
          </button>
        </div>
      )}

      {success && (
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontStyle: 'italic',
          fontSize: 13, color: '#7A7170', textAlign: 'center',
        }}>
          {success}
        </p>
      )}
      {error && (
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13, color: '#E88080', textAlign: 'center',
        }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ── WARDROBE TAB ─────────────────────────────────────────────────
function WardrobeTab({ active }: { active: boolean }) {
  const [items, setItems]     = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wardrobe/items');
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active) fetchItems();
  }, [active, fetchItems]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '40vh', gap: 14,
      }}>
        <Shirt size={32} color="#C9848A" strokeWidth={1.5} />
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontStyle: 'italic',
          fontSize: 14, color: '#7A7170', textAlign: 'center',
        }}>
          Log your first outfit to build your wardrobe.
        </p>
      </div>
    );
  }

  // Group by category (preserving API sort order within each group)
  const groups = items.reduce<Record<string, WardrobeItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  let cardIndex = 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <AnimatePresence>
        {Object.entries(groups).map(([category, categoryItems]) => (
          <div key={category}>
            <p style={labelStyle}>{CATEGORY_EMOJI[category]} {category}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {categoryItems.map(item => (
                <WardrobeCard key={item.id} item={item} index={cardIndex++} onDelete={removeItem} />
              ))}
            </div>
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── SUGGESTIONS TAB ──────────────────────────────────────────────
function SuggestionsTab({ active, onSwitchToLog }: { active: boolean; onSwitchToLog: () => void }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading]         = useState(false);
  const [notEnough, setNotEnough]     = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    setNotEnough(false);
    setError(null);
    try {
      // Fetch weather
      const weatherRes = await fetch('/api/daily-brief');
      const weatherData = await weatherRes.json();
      if (!weatherData.weather) throw new Error('Could not fetch weather');

      const weather: Weather = weatherData.weather;

      // Fetch suggestions
      const res = await fetch('/api/wardrobe/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weather }),
      });
      const data = await res.json();

      if (!data.success) {
        if (data.error === 'not_enough_items') { setNotEnough(true); return; }
        throw new Error(data.error ?? 'Failed to fetch suggestions');
      }

      setSuggestions(data.suggestions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active && suggestions.length === 0 && !loading) fetchSuggestions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '40vh', gap: 12,
      }}>
        <Loader2 size={24} color="#C9848A" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontStyle: 'italic',
          fontSize: 14, color: '#7A7170',
        }}>
          Finding outfits for today&apos;s weather…
        </p>
      </div>
    );
  }

  if (notEnough) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '40vh', gap: 14, textAlign: 'center',
      }}>
        <Shirt size={32} color="#C9848A" strokeWidth={1.5} />
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 14,
          color: '#7A7170', lineHeight: 1.5,
        }}>
          Log at least 6 outfit items to unlock suggestions.
        </p>
        <button
          onClick={onSwitchToLog}
          style={{
            height: 44, paddingLeft: 20, paddingRight: 20, borderRadius: 999,
            border: 'none', background: '#C9848A', color: '#FFFFFF',
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Start logging →
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#E88080' }}>
          {error}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <AnimatePresence>
        {suggestions.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06, ease: 'easeOut' }}
            style={{
              background: '#FFFFFF', borderRadius: 16,
              border: '1px solid #EDD9DB', padding: '16px 16px 14px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            }}
          >
            <h3 style={{
              fontFamily: "'Cormorant Garamond', serif", fontSize: 18,
              fontWeight: 400, color: '#2A2A2A', margin: 0, lineHeight: 1.2,
            }}>
              {s.outfit_name}
            </h3>

            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontStyle: 'italic',
              fontSize: 13, color: '#7A7170', lineHeight: 1.5, marginTop: 4,
            }}>
              {s.reasoning}
            </p>

            {s.weather_note && (
              <span style={{
                display: 'inline-block', marginTop: 8,
                background: '#FFF7ED', border: '1px solid #C4A35A',
                color: '#C4A35A', fontFamily: "'DM Sans', sans-serif",
                fontSize: 11, borderRadius: 20, padding: '3px 10px',
              }}>
                {s.weather_note}
              </span>
            )}

            {/* Item mini-cards scroll row */}
            <div style={{
              display: 'flex', gap: 8, marginTop: 12,
              overflowX: 'auto', paddingBottom: 4,
            }}>
              {s.items.map(item => {
                const primaryColour = item.colours?.[0] ?? '#C9848A';
                return (
                  <div
                    key={item.id}
                    style={{
                      flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                      background: '#FAF7F4', border: '1px solid #EDD9DB',
                      borderRadius: 20, padding: '5px 10px',
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{CATEGORY_EMOJI[item.category] ?? '🏷️'}</span>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#2A2A2A',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.subcategory}
                    </span>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                      background: primaryColour,
                      border: '1px solid rgba(0,0,0,0.08)',
                    }} />
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {suggestions.length > 0 && (
        <button
          onClick={fetchSuggestions}
          style={{
            height: 36, paddingLeft: 14, paddingRight: 14,
            borderRadius: 999, border: '1px solid #C9848A',
            background: 'transparent', color: '#C9848A',
            fontFamily: "'DM Sans', sans-serif", fontSize: 13,
            cursor: 'pointer', alignSelf: 'center',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'opacity 0.2s',
          }}
        >
          Refresh suggestions
        </button>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export default function DressDailyPage() {
  const [tab, setTab] = useState<Tab>('log');

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .tab-scroll::-webkit-scrollbar { display: none; }
        .tab-scroll { scrollbar-width: none; }
      `}</style>

      <div style={{ background: '#FAF7F4', minHeight: '100dvh', overflowX: 'hidden' }}>
        {/* Header */}
        <div style={{
          padding: '28px 20px 14px',
          borderBottom: '1px solid #EDD9DB',
          background: '#FAF7F4',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: 26,
            fontWeight: 400, color: '#2A2A2A', lineHeight: 1, marginBottom: 4,
          }}>
            Daily Dress
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontStyle: 'italic',
            fontSize: 13, color: '#7A7170',
          }}>
            Your wardrobe, remembered.
          </p>

          {/* Tab bar */}
          <div
            className="tab-scroll"
            style={{
              display: 'flex', gap: 8, marginTop: 14,
              overflowX: 'auto',
            }}
          >
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  height: 36, paddingLeft: 16, paddingRight: 16,
                  borderRadius: 999, border: 'none', flexShrink: 0,
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
                  background: tab === key ? '#C9848A' : '#F2D4D7',
                  color: tab === key ? '#FFFFFF' : '#C9848A',
                  cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div style={{ padding: '16px 16px 80px' }}>
          {tab === 'log'         && <LogTab />}
          {tab === 'wardrobe'    && <WardrobeTab active={tab === 'wardrobe'} />}
          {tab === 'suggestions' && (
            <SuggestionsTab
              active={tab === 'suggestions'}
              onSwitchToLog={() => setTab('log')}
            />
          )}
        </div>
      </div>
    </>
  );
}
