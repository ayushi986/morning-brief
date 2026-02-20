// components/SourceManager.tsx
// This is the panel where you add and manage your newsletter sources.
// It's intentionally kept small and tucked at the bottom of the page
// so it doesn't compete with the magazine content.
// Think of it like the "settings" button in a good app — available when needed,
// invisible when you're in reading mode.
//
// Design note: the toggle button uses gold accents to match the masthead.
// The panel itself is warm cream — the same tone as the editorial intro card.
//
// URLs are saved to localStorage — the browser's own built-in storage.
// Nothing goes to a server; everything stays on your computer.

'use client';

import { useState } from 'react';

interface SourceManagerProps {
  newsletterUrls: string[];
  onNewsletterUrlsChange: (urls: string[]) => void;
}

export default function SourceManager({
  newsletterUrls,
  onNewsletterUrlsChange,
}: SourceManagerProps) {

  // Text in the "add newsletter" input field
  const [newNewsletterUrl, setNewNewsletterUrl] = useState('');

  // Whether the panel is expanded or collapsed
  const [isOpen, setIsOpen] = useState(false);

  function addNewsletter() {
    const url = newNewsletterUrl.trim();
    if (!url) return;
    if (newsletterUrls.includes(url)) return; // Don't add duplicates
    onNewsletterUrlsChange([...newsletterUrls, url]);
    setNewNewsletterUrl('');
  }

  function removeNewsletter(url: string) {
    onNewsletterUrlsChange(newsletterUrls.filter(u => u !== url));
  }

  // Handle pressing Enter in the input (so you don't have to click Add every time)
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') addNewsletter();
  }

  // Shorten a URL for display — shows just the domain
  // e.g. "https://therundown.ai/p/latest" → "therundown.ai"
  function shortenUrl(url: string): string {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsed.hostname.replace('www.', '');
    } catch {
      return url.slice(0, 35) + (url.length > 35 ? '...' : '');
    }
  }

  // The 6 accent colours — same palette as the article cards
  const ACCENT_COLORS = ['#E85D4A', '#3B82F6', '#16A34A', '#D97706', '#7C3AED', '#0E7490'];

  return (
    <div className="max-w-4xl mx-auto px-6">

      {/* ---- Toggle button ---- */}
      {/* Sits quietly below the content; only the gold colour gives it presence */}
      <div className="text-center py-6" style={{ borderTop: '1px solid #EAE6DE' }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{ fontFamily: 'var(--font-inter)' }}
          className="group inline-flex items-center gap-2 cursor-pointer transition-all duration-200"
        >
          {/* Gold diamond ornament */}
          <span style={{ color: '#C5A55A', fontSize: '8px', transition: 'transform 0.2s' }}>
            {isOpen ? '◆' : '◇'}
          </span>
          <span
            style={{
              fontSize: '10px',
              letterSpacing: '0.2em',
              color: '#9B9590',
              textTransform: 'uppercase',
            }}
            className="group-hover:text-[#6B5A35] transition-colors"
          >
            {isOpen
              ? 'Hide Sources'
              : `Manage Sources${newsletterUrls.length > 0 ? ` (${newsletterUrls.length})` : ''}`
            }
          </span>
          <span style={{ color: '#C5A55A', fontSize: '8px' }}>
            {isOpen ? '◆' : '◇'}
          </span>
        </button>
      </div>

      {/* ---- Expanded panel ---- */}
      {isOpen && (
        <div
          className="mb-12 p-7 md:p-9"
          style={{
            background: 'linear-gradient(135deg, #F7F3EB 0%, #F2EDE3 100%)',
            border: '1px solid #E0D8C8',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          {/* Panel header — flanked by gradient rules, gold text */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, #C5A55A)' }} />
            <h3
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '10px',
                letterSpacing: '0.25em',
                color: '#8B6914',
              }}
              className="uppercase font-semibold whitespace-nowrap"
            >
              ◆ Your Newsletters ◆
            </h3>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, #C5A55A)' }} />
          </div>

          {/* Explanation */}
          <p
            style={{ fontFamily: 'var(--font-inter)', fontSize: '14px', color: '#6B6050', lineHeight: '1.7' }}
            className="mb-6 max-w-lg"
          >
            Paste the homepage URL of any newsletter you follow — Substack, Beehiiv, Ghost, or any public newsletter site.
            We&apos;ll automatically find and read the latest issue each time you hit{' '}
            <strong style={{ color: '#4A3A20' }}>New Issue</strong>.
          </p>

          {/* Input + Add button */}
          <div className="flex gap-2 mb-6 max-w-lg">
            <input
              type="url"
              value={newNewsletterUrl}
              onChange={e => setNewNewsletterUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://yournewsletter.substack.com"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '14px',
                border: '1px solid #D8D0C0',
                background: '#FDFAF4',
                color: '#2D2010',
                flex: 1,
                padding: '10px 14px',
                outline: 'none',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#C5A55A')}
              onBlur={e => (e.currentTarget.style.borderColor = '#D8D0C0')}
            />
            <button
              onClick={addNewsletter}
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '10px',
                letterSpacing: '0.15em',
                border: '1px solid #C5A55A',
                color: '#8B6914',
                background: 'linear-gradient(135deg, #FEFCF5 0%, #FDF6E3 100%)',
                padding: '10px 18px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
                transition: 'all 0.2s',
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #C5A55A 0%, #A8893D 100%)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #FEFCF5 0%, #FDF6E3 100%)';
                e.currentTarget.style.color = '#8B6914';
              }}
            >
              Add
            </button>
          </div>

          {/* List of saved newsletters */}
          {newsletterUrls.length === 0 ? (
            <p
              style={{ fontFamily: 'var(--font-inter)', fontSize: '14px', color: '#B0AAA0', fontStyle: 'italic' }}
            >
              No newsletters added yet. Paste a URL above to get started.
            </p>
          ) : (
            <ul className="space-y-2 max-w-lg">
              {newsletterUrls.map((url, index) => {
                const dotColor = ACCENT_COLORS[index % ACCENT_COLORS.length];

                return (
                  <li key={url} className="flex items-center gap-3 group py-1.5">
                    {/* Small accent dot */}
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: dotColor }}
                    />

                    {/* Domain name */}
                    <span
                      style={{ fontFamily: 'var(--font-inter)', fontSize: '14px', color: '#4A3A20', flex: 1 }}
                      className="truncate"
                      title={url}
                    >
                      {shortenUrl(url)}
                    </span>

                    {/* Remove button — appears on hover */}
                    <button
                      onClick={() => removeNewsletter(url)}
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '11px',
                        color: '#B0AAA0',
                        opacity: 0,
                        cursor: 'pointer',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        transition: 'color 0.15s, opacity 0.15s',
                        flexShrink: 0,
                      }}
                      className="group-hover:opacity-100"
                      onMouseOver={e => (e.currentTarget.style.color = '#E85D4A')}
                      onMouseOut={e => (e.currentTarget.style.color = '#B0AAA0')}
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Footer note */}
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '11px',
              color: '#B0AAA0',
              marginTop: '20px',
              letterSpacing: '0.03em',
            }}
          >
            Sources are saved in your browser. They&apos;ll still be here next time you visit.
          </p>

        </div>
      )}

    </div>
  );
}
