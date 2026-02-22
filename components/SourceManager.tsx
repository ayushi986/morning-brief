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
  const ACCENT_COLORS = ['#B45309', '#1D4ED8', '#15803D', '#6D28D9', '#0F766E', '#92400E'];

  return (
    <div className="max-w-4xl mx-auto px-6">

      {/* ---- Toggle button ---- */}
      {/* Sits quietly below the content; only the gold colour gives it presence */}
      <div className="text-center py-6" style={{ borderTop: '1px solid #F3E8E8' }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{ fontFamily: 'var(--font-inter)' }}
          className="group inline-flex items-center gap-2 cursor-pointer transition-all duration-200"
        >
          {/* Gold diamond ornament */}
          <span style={{ color: '#9F1239', fontSize: '8px', transition: 'transform 0.2s' }}>
            {isOpen ? '◆' : '◇'}
          </span>
          <span
            style={{
              fontSize: '10px',
              letterSpacing: '0.2em',
              color: '#9CA3AF',
              textTransform: 'uppercase',
            }}
            className="group-hover:text-[#7F0E2D] transition-colors"
          >
            {isOpen
              ? 'Hide Sources'
              : `Manage Sources${newsletterUrls.length > 0 ? ` (${newsletterUrls.length})` : ''}`
            }
          </span>
          <span style={{ color: '#9F1239', fontSize: '8px' }}>
            {isOpen ? '◆' : '◇'}
          </span>
        </button>
      </div>

      {/* ---- Expanded panel ---- */}
      {isOpen && (
        <div
          className="mb-12 p-7 md:p-9"
          style={{
            background: 'linear-gradient(135deg, #FEF6F6 0%, #FBF0F0 100%)',
            border: '1px solid #F3E8E8',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          {/* Panel header — flanked by gradient rules, gold text */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, #9F1239)' }} />
            <h3
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '10px',
                letterSpacing: '0.25em',
                color: '#7F0E2D',
              }}
              className="uppercase font-semibold whitespace-nowrap"
            >
              ◆ Your Newsletters ◆
            </h3>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, #9F1239)' }} />
          </div>

          {/* Explanation */}
          <p
            style={{ fontFamily: 'var(--font-inter)', fontSize: '14px', color: '#6B5B5B', lineHeight: '1.7' }}
            className="mb-6 max-w-lg"
          >
            Paste the homepage URL of any newsletter you follow — Substack, Beehiiv, Ghost, or any public newsletter site.
            We&apos;ll automatically find and read the latest issue each time you hit{' '}
            <strong style={{ color: '#2D1515' }}>New Issue</strong>.
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
                border: '1px solid #F3E8E8',
                background: '#FFFAFA',
                color: '#1A0A0A',
                flex: 1,
                padding: '10px 14px',
                outline: 'none',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#9F1239')}
              onBlur={e => (e.currentTarget.style.borderColor = '#F3E8E8')}
            />
            <button
              onClick={addNewsletter}
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '10px',
                letterSpacing: '0.15em',
                border: '1px solid #9F1239',
                color: '#7F0E2D',
                background: 'linear-gradient(135deg, #FFFAFA 0%, #FEF2F4 100%)',
                padding: '10px 18px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
                transition: 'all 0.2s',
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #9F1239 0%, #7F0E2D 100%)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #FFFAFA 0%, #FEF2F4 100%)';
                e.currentTarget.style.color = '#7F0E2D';
              }}
            >
              Add
            </button>
          </div>

          {/* List of saved newsletters */}
          {newsletterUrls.length === 0 ? (
            <p
              style={{ fontFamily: 'var(--font-inter)', fontSize: '14px', color: '#9CA3AF', fontStyle: 'italic' }}
            >
              No newsletters added yet. Paste a URL above to get started.
            </p>
          ) : (
            <ul className="space-y-2 max-w-lg">
              {newsletterUrls.map((url, index) => {
                const dotColor = ACCENT_COLORS[index % ACCENT_COLORS.length];

                return (
                  <li key={url} className="flex items-center gap-3 py-1.5">
                    {/* Small accent dot */}
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: dotColor }}
                    />

                    {/* Domain name */}
                    <span
                      style={{ fontFamily: 'var(--font-inter)', fontSize: '14px', color: '#2D1515', flex: 1 }}
                      className="truncate"
                      title={url}
                    >
                      {shortenUrl(url)}
                    </span>

                    {/* Delete button — always visible, turns red on hover */}
                    <button
                      onClick={() => removeNewsletter(url)}
                      title="Remove this newsletter"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '16px',
                        lineHeight: 1,
                        color: '#D4B0B8',
                        cursor: 'pointer',
                        background: 'none',
                        border: 'none',
                        padding: '0 2px',
                        transition: 'color 0.15s',
                        flexShrink: 0,
                      }}
                      onMouseOver={e => (e.currentTarget.style.color = '#9F1239')}
                      onMouseOut={e => (e.currentTarget.style.color = '#D4B0B8')}
                    >
                      ×
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
              color: '#9CA3AF',
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
