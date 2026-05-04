'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export const CROP_FRAME = 188;

export function PhotoCropModal({
  file,
  onConfirm,
  onCancel,
}: {
  file: File;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const objectUrl  = useRef(URL.createObjectURL(file)).current;
  const imgRef     = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded]           = useState(false);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [scale, setScale]             = useState(1);
  const [offset, setOffset]           = useState({ x: 0, y: 0 });

  useEffect(() => () => URL.revokeObjectURL(objectUrl), [objectUrl]);

  const { rw, rh } = useMemo(() => {
    const { w, h } = naturalSize;
    if (!w || !h) return { rw: CROP_FRAME, rh: CROP_FRAME };
    return w / h > 1
      ? { rw: (CROP_FRAME * w) / h, rh: CROP_FRAME }
      : { rw: CROP_FRAME, rh: (CROP_FRAME * h) / w };
  }, [naturalSize]);

  const lastTouch = useRef<{ x: number; y: number } | null>(null);
  const lastPinch = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      lastPinch.current = null;
    } else if (e.touches.length === 2) {
      lastPinch.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      lastTouch.current = null;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && lastTouch.current) {
      const dx = e.touches[0].clientX - lastTouch.current.x;
      const dy = e.touches[0].clientY - lastTouch.current.y;
      setOffset(o => ({ x: o.x + dx, y: o.y + dy }));
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && lastPinch.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      setScale(s => Math.max(1, Math.min(6, s * (dist / lastPinch.current!))));
      lastPinch.current = dist;
    }
  };

  const onTouchEnd = () => { lastTouch.current = null; lastPinch.current = null; };

  const dragging  = useRef(false);
  const lastMouse = useRef<{ x: number; y: number } | null>(null);

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current || !lastMouse.current) return;
    setOffset(o => ({
      x: o.x + e.clientX - lastMouse.current!.x,
      y: o.y + e.clientY - lastMouse.current!.y,
    }));
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };
  const stopDrag = () => { dragging.current = false; lastMouse.current = null; };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale(s => Math.max(1, Math.min(6, s * (e.deltaY < 0 ? 1.1 : 0.9))));
  };

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img || !loaded) return;
    const { w: nw, h: nh } = naturalSize;
    const ox = offset.x, oy = offset.y, s = scale;

    const scaleX = nw / (rw * s);
    const scaleY = nh / (rh * s);
    const sourceX = (rw * s / 2 - CROP_FRAME / 2 - ox) * scaleX;
    const sourceY = (rh * s / 2 - CROP_FRAME / 2 - oy) * scaleY;
    const sourceW = CROP_FRAME * scaleX;
    const sourceH = CROP_FRAME * scaleY;

    const canvas = document.createElement('canvas');
    canvas.width = CROP_FRAME;
    canvas.height = CROP_FRAME;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, CROP_FRAME, CROP_FRAME);
    canvas.toBlob(blob => { if (blob) onConfirm(blob); }, 'image/jpeg', 0.92);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.92)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 22,
    }}>
      <p style={{
        fontFamily: 'var(--font-dm-sans), sans-serif',
        fontSize: 12, color: 'rgba(255,255,255,0.55)',
        letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>
        Drag · Pinch to zoom
      </p>

      <div
        style={{
          width: CROP_FRAME, height: CROP_FRAME, borderRadius: '50%',
          overflow: 'hidden', position: 'relative',
          border: '2px solid #C4A35A',
          cursor: dragging.current ? 'grabbing' : 'grab',
          touchAction: 'none', userSelect: 'none',
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onWheel={onWheel}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={objectUrl}
          alt=""
          onLoad={e => {
            const img = e.currentTarget;
            setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
            setLoaded(true);
          }}
          style={{
            position: 'absolute',
            width: rw, height: rh,
            maxWidth: 'none',
            top: '50%', left: '50%',
            transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
            transformOrigin: 'center center',
            pointerEvents: 'none',
            display: loaded ? 'block' : 'none',
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: CROP_FRAME }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 20, fontWeight: 300, lineHeight: 1 }}>−</span>
        <input
          type="range" min="1" max="6" step="0.01"
          value={scale}
          onChange={e => setScale(Number(e.target.value))}
          style={{ flex: 1, accentColor: '#C4A35A' }}
        />
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 20, fontWeight: 300, lineHeight: 1 }}>+</span>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={onCancel}
          style={{
            height: 48, paddingLeft: 24, paddingRight: 24, borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.2)', background: 'transparent',
            color: '#FFFFFF', fontFamily: 'var(--font-dm-sans), sans-serif',
            fontSize: 13, cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={!loaded}
          style={{
            height: 48, paddingLeft: 28, paddingRight: 28, borderRadius: 999,
            border: 'none', background: '#C9848A',
            color: '#FFFFFF', fontFamily: 'var(--font-dm-sans), sans-serif',
            fontSize: 13, fontWeight: 500,
            cursor: loaded ? 'pointer' : 'not-allowed',
            opacity: loaded ? 1 : 0.6,
          }}
        >
          Use this photo
        </button>
      </div>
    </div>
  );
}
