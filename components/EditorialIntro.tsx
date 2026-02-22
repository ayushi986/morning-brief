// components/EditorialIntro.tsx
// The "Big Themes" section — appears at the top of the digest when Claude
// finds interesting connections across the newsletters you follow.
//
// Styled like a real magazine's "Editor's Letter" or "This Week" intro section.
// Warm cream background, italic tone, refined typography.

import { BigTheme } from '@/types';

interface EditorialIntroProps {
  themes: BigTheme[];
}

export default function EditorialIntro({ themes }: EditorialIntroProps) {
  if (!themes || themes.length === 0) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 mb-10">

      {/* The editorial intro card — warm cream background */}
      <div
        style={{
          background: 'linear-gradient(135deg, #FEF6F6 0%, #FBF0F0 100%)',
          border: '1px solid #F3E8E8',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
        className="p-8 md:p-10 relative overflow-hidden"
      >

        {/* Large decorative fleuron — purely aesthetic, like a real magazine pullquote */}
        <div
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '160px',
            color: '#E8C0C8',
            position: 'absolute',
            top: '-20px',
            right: '24px',
            lineHeight: 1,
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          ❧
        </div>

        {/* Section header — small caps label, flanked by gradient rules */}
        <div className="flex items-center gap-4 mb-7">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, #9F1239)' }} />
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '10px',
              letterSpacing: '0.25em',
              color: '#7F0E2D',
            }}
            className="uppercase font-semibold whitespace-nowrap"
          >
            ◆ What&apos;s Connecting This Week ◆
          </p>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, #9F1239)' }} />
        </div>

        {/* The themes themselves */}
        <div className={`${themes.length > 1 ? 'space-y-7' : ''}`}>
          {themes.map((theme, index) => (
            <div
              key={index}
              className={`relative ${themes.length > 1 && index < themes.length - 1 ? 'pb-7' : ''}`}
            >
              {/* Divider between themes */}
              {themes.length > 1 && index < themes.length - 1 && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-px"
                  style={{ background: 'linear-gradient(to right, transparent, #F3E8E8, transparent)' }}
                />
              )}

              {/* Theme title */}
              <h3
                style={{
                  fontFamily: 'var(--font-playfair)',
                  color: '#1A0A0A',
                  letterSpacing: '-0.01em',
                }}
                className="text-xl md:text-2xl font-bold mb-3"
              >
                {theme.title}
              </h3>

              {/* Theme observation — italic, like an editor's note */}
              <p
                style={{
                  fontFamily: 'var(--font-playfair)',
                  color: '#3D2424',
                  lineHeight: '1.8',
                  fontSize: '16px',
                }}
                className="italic relative z-10"
              >
                {theme.observation}
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
