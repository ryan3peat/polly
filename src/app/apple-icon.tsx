import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  const disc = 180 * 0.62; // 62% of icon = gold seal disc diameter

  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: '#C9848A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Gold wax-seal disc */}
        <div
          style={{
            width: disc,
            height: disc,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 32% 28%, #E1C485 0%, #C4A35A 55%, #9C7E3A 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.22), inset 0 -3px 8px rgba(0,0,0,0.18)',
            position: 'relative',
          }}
        >
          {/* Dashed inner ring */}
          <div
            style={{
              position: 'absolute',
              inset: '6%',
              borderRadius: '50%',
              border: '1.5px dashed rgba(255,255,255,0.35)',
            }}
          />
          <span
            style={{
              fontFamily: 'serif',
              fontStyle: 'italic',
              fontWeight: 700,
              fontSize: 100,
              color: '#FAF7F4',
              lineHeight: 1,
              marginTop: 8,
            }}
          >
            P
          </span>
        </div>
      </div>
    ),
    size,
  );
}
