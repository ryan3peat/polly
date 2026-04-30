'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Tag, Heart } from 'lucide-react';

const TABS = [
  { href: '/style',  label: 'Style',  Icon: Sparkles },
  { href: '/deals',  label: 'Deals',  Icon: Tag      },
  { href: '/family', label: 'Family', Icon: Heart    },
] as const;

const ACTIVE   = '#C9848A';
const INACTIVE = '#7A7170';
const GOLD     = '#C4A35A';

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
      {TABS.map(({ href, label, Icon }) => {
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
            {/* Gold underline indicator */}
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

            <Icon
              size={20}
              color={colour}
              strokeWidth={active ? 2 : 1.5}
            />

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
