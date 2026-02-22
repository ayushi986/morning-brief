// components/LoadingState.tsx
// The loading state — shown while your digest is being generated.
// Takes 20–40 seconds (visiting newsletters, sending to Claude, waiting for response).
//
// Design: feels like a premium magazine being "printed" for you.
// Warm cream tone, gold accent, refined typography — consistent with the masthead.
// The rotating messages make the wait feel purposeful, not frozen.

'use client';

import { useEffect, useState } from 'react';

// Messages that rotate every 5 seconds during loading.
// They mirror what's actually happening server-side.
const LOADING_MESSAGES = [
  { message: 'Reading your newsletters...', detail: 'Visiting each newsletter and finding the latest issue' },
  { message: 'Writing your articles...', detail: 'Claude is reading and crafting a proper summary for each one' },
  { message: 'Spotting big themes...', detail: 'Looking for interesting connections across everything you follow' },
  { message: 'Laying out your edition...', detail: 'Almost ready — assembling your personal magazine' },
  { message: 'Finishing touches...', detail: 'This issue is going to be a good one' },
];

export default function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0);

  // Advance to the next message every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev =>
        prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const current = LOADING_MESSAGES[messageIndex];

  return (
    // Full-width loading section — vertically centred, generous padding
    <div className="max-w-4xl mx-auto px-6 py-28 flex flex-col items-center">

      {/* Animated press/printing graphic — three gold dots that pulse in sequence.
          The gold colour matches the "New Issue" button — everything feels connected. */}
      <div className="flex gap-3 mb-12">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: '#9F1239',  // Warm gold — matches the button accent
              animation: `pulse-slow 1.5s ease-in-out infinite`,
              animationDelay: `${i * 0.25}s`,
            }}
          />
        ))}
      </div>

      {/* The "press" decorative element — a thin horizontal rule with a small ornament.
          Evokes the feeling of a printing press running. */}
      <div className="flex items-center gap-3 mb-8 w-full max-w-xs">
        <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, #9F1239)' }} />
        <span style={{ color: '#9F1239', fontSize: '10px' }}>◆</span>
        <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, #9F1239)' }} />
      </div>

      {/* Main status headline — changes every 5 seconds, big Playfair serif */}
      <h2
        style={{
          fontFamily: 'var(--font-playfair)',
          color: '#1A0A0A',
          letterSpacing: '-0.01em',
        }}
        className="text-3xl md:text-4xl font-bold text-center mb-3 transition-all duration-500"
      >
        {current.message}
      </h2>

      {/* Detail line — explains what's actually happening */}
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          color: '#9CA3AF',
          lineHeight: '1.7',
          fontSize: '15px',
        }}
        className="text-center max-w-sm"
      >
        {current.detail}
      </p>

      {/* Progress pills — show which step we're on */}
      <div className="flex gap-2 mt-10">
        {LOADING_MESSAGES.map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: i === messageIndex ? '24px' : '8px',
              backgroundColor: i <= messageIndex ? '#9F1239' : '#F3E8E8',
            }}
          />
        ))}
      </div>

      {/* Reassuring note — sets expectations */}
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          color: '#9CA3AF',
          fontSize: '12px',
          letterSpacing: '0.05em',
        }}
        className="mt-10"
      >
        This takes about 30 seconds — your magazine is being written fresh
      </p>

    </div>
  );
}
