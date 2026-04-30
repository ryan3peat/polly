'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tag, Heart } from 'lucide-react';

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

export default function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { href: '/style',  label: 'Style',  isDress: true,  Icon: null as typeof Tag | null },
    { href: '/deals',  label: 'Deals',  isDress: false, Icon: Tag },
    { href: '/family', label: 'Family', isDress: false, Icon: Heart },
  ];

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
      {tabs.map(({ href, label, Icon, isDress }) => {
        const active = pathname === href;
        const colour = active ? ACTIVE : INACTIVE;

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

            {isDress
              ? <DressIcon size={20} color={colour} strokeWidth={active ? 2 : 1.5} />
              : Icon && <Icon size={20} color={colour} strokeWidth={active ? 2 : 1.5} />
            }

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
