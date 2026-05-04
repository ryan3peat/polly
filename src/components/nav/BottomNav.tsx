'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tag, Home, Shirt, User } from 'lucide-react';

function DressIcon({ size, color, strokeWidth }: { size: number; color: string; strokeWidth: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2l-4 5h3.5v13h9V7H20L16 2" />
      <path d="M8 2c0 2.5 2 4 4 4s4-1.5 4-4" />
    </svg>
  );
}

const ACTIVE   = '#C9848A';
const INACTIVE = '#7A7170';
const GOLD     = '#C4A35A';

const tabs = [
  { href: '/',        label: 'Home',     type: 'home'    as const },
  { href: '/style',   label: 'Style',    type: 'dress'   as const },
  { href: '/deals',   label: 'Deals',    type: 'tag'     as const },
  { href: '/dress',   label: 'Wardrobe', type: 'shirt'   as const },
  { href: '/profile', label: 'Profile',  type: 'user'    as const },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        background: '#FFFFFF',
        borderTop: '1px solid #EDD9DB',
        display: 'flex',
        alignItems: 'stretch',
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {tabs.map(({ href, label, type }) => {
        const active = pathname === href;
        const colour = active ? ACTIVE : INACTIVE;
        const sw = active ? 2 : 1.5;

        return (
          <Link
            key={href}
            href={href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              textDecoration: 'none',
              position: 'relative',
              minHeight: 64,
              minWidth: 44,
              paddingTop: 10,
              paddingBottom: 10,
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 24,
                height: 2,
                borderRadius: 999,
                background: active ? GOLD : 'transparent',
                transition: 'background 0.2s',
              }}
            />

            {type === 'dress' && <DressIcon size={20} color={colour} strokeWidth={sw} />}
            {type === 'tag'   && <Tag   size={20} color={colour} strokeWidth={sw} />}
            {type === 'home'  && <Home  size={20} color={colour} strokeWidth={sw} />}
            {type === 'shirt' && <Shirt size={20} color={colour} strokeWidth={sw} />}
            {type === 'user'  && <User  size={20} color={colour} strokeWidth={sw} />}

            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                fontWeight: 500,
                color: colour,
                lineHeight: 1,
              }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
