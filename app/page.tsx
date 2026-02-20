// app/page.tsx
// This is the main page — the one you see when you open Morning Brief.
// It coordinates everything:
//   1. It remembers your newsletter URLs (saved in your browser)
//   2. It shows the "welcome" screen if you haven't added sources yet
//   3. It shows the loading state while your digest is being generated
//   4. It shows the full magazine once the digest is ready
//
// Think of this as the "stage manager" — it doesn't do any of the work itself,
// but it knows which component to show at any given moment.

'use client'; // Needed because this page uses browser features (localStorage, state, etc.)

import { useState, useEffect } from 'react';
import { Digest } from '@/types';
import Masthead from '@/components/Masthead';
import DigestView from '@/components/DigestView';
import LoadingState from '@/components/LoadingState';
import SourceManager from '@/components/SourceManager';

// The localStorage keys — these are the "labels" on our browser storage boxes.
const STORAGE_KEY_NEWSLETTERS = 'morning-brief-newsletters';
const STORAGE_KEY_EDITION = 'morning-brief-edition';
const STORAGE_KEY_DIGEST = 'morning-brief-last-digest';

export default function Home() {
  // ----------------------------------------------------------------
  // State — all the things this page needs to keep track of
  // ----------------------------------------------------------------

  const [newsletterUrls, setNewsletterUrls] = useState<string[]>([]);
  const [editionNumber, setEditionNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [digest, setDigest] = useState<Digest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialised, setIsInitialised] = useState(false);

  // ----------------------------------------------------------------
  // Load saved data from localStorage when the page first opens
  // ----------------------------------------------------------------
  useEffect(() => {
    try {
      const savedNewsletters = localStorage.getItem(STORAGE_KEY_NEWSLETTERS);
      if (savedNewsletters) setNewsletterUrls(JSON.parse(savedNewsletters));

      const savedEdition = localStorage.getItem(STORAGE_KEY_EDITION);
      if (savedEdition) setEditionNumber(parseInt(savedEdition, 10));

      const savedDigest = localStorage.getItem(STORAGE_KEY_DIGEST);
      if (savedDigest) setDigest(JSON.parse(savedDigest));
    } catch (err) {
      console.warn('Could not load from localStorage:', err);
    }
    setIsInitialised(true);
  }, []);

  // ----------------------------------------------------------------
  // Save newsletter URLs to localStorage whenever they change
  // ----------------------------------------------------------------
  function handleNewsletterUrlsChange(urls: string[]) {
    setNewsletterUrls(urls);
    try {
      localStorage.setItem(STORAGE_KEY_NEWSLETTERS, JSON.stringify(urls));
    } catch (err) {
      console.warn('Could not save to localStorage:', err);
    }
  }

  // ----------------------------------------------------------------
  // Generate a fresh digest when "New Issue" is clicked
  // ----------------------------------------------------------------
  async function handleRefresh() {
    if (isLoading) return;

    setError(null);

    if (newsletterUrls.length === 0) {
      setError('Please add at least one newsletter first. Click "Manage Sources" below to add one.');
      return;
    }

    setIsLoading(true);

    try {
      const newEdition = editionNumber + 1;

      const response = await fetch('/api/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsletterUrls,
          channelUrls: [],   // YouTube disabled for now
          editionNumber: newEdition,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      const newDigest: Digest = data.digest;

      setDigest(newDigest);
      setEditionNumber(newEdition);

      try {
        localStorage.setItem(STORAGE_KEY_EDITION, String(newEdition));
        localStorage.setItem(STORAGE_KEY_DIGEST, JSON.stringify(newDigest));
      } catch (err) {
        console.warn('Could not save digest to localStorage:', err);
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  // ----------------------------------------------------------------
  // Decide what to show on the page
  // ----------------------------------------------------------------

  // While reading from localStorage — show a blank page to avoid flicker
  if (!isInitialised) {
    return <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }} />;
  }

  const hasNoSources = newsletterUrls.length === 0;
  const hasNoPreviousDigest = !digest;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>

      {/* The magazine masthead */}
      <Masthead
        editionNumber={editionNumber}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />

      {/* ---- Error message ---- */}
      {error && (
        <div className="max-w-4xl mx-auto px-6 mb-8">
          <div
            style={{
              border: '1px solid #E8A89A',
              background: 'linear-gradient(135deg, #FEF5F3 0%, #FDF0ED 100%)',
            }}
            className="px-6 py-4"
          >
            <p
              style={{ fontFamily: 'var(--font-inter)', color: '#C0392B', fontSize: '14px', lineHeight: '1.6' }}
            >
              ⚠ {error}
            </p>
          </div>
        </div>
      )}

      {/* ---- Loading state ---- */}
      {isLoading && <LoadingState />}

      {/* ---- Welcome screen (first visit, no sources, no digest) ---- */}
      {!isLoading && hasNoSources && hasNoPreviousDigest && (
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">

          {/* Decorative fleuron — warm gold ornament */}
          <div
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: '52px',
              color: '#C5A55A',
              marginBottom: '24px',
              opacity: 0.7,
            }}
          >
            ❧
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-playfair)',
              color: '#1A1009',
              letterSpacing: '-0.02em',
            }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            Your first edition is waiting.
          </h2>

          <p
            style={{
              fontFamily: 'var(--font-inter)',
              color: '#9B9590',
              lineHeight: '1.8',
              fontSize: '17px',
              maxWidth: '400px',
              margin: '0 auto 32px',
            }}
          >
            Add your newsletters below, then hit{' '}
            <strong style={{ color: '#6B5A35' }}>New Issue</strong>{' '}
            to generate your personal digest.
          </p>

          {/* Gold-accented arrow pointing down to Source Manager */}
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-8" style={{ background: 'linear-gradient(to right, transparent, #C5A55A)' }} />
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                color: '#C5A55A',
                fontSize: '11px',
                letterSpacing: '0.25em',
              }}
              className="uppercase animate-pulse-slow"
            >
              ↓ Start below
            </p>
            <div className="h-px w-8" style={{ background: 'linear-gradient(to left, transparent, #C5A55A)' }} />
          </div>
        </div>
      )}

      {/* ---- The digest (shown when we have content and are not loading) ---- */}
      {!isLoading && digest && (
        <DigestView digest={digest} />
      )}

      {/* ---- Prompt to hit New Issue (sources added but no digest yet) ---- */}
      {!isLoading && !digest && !hasNoSources && (
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <p style={{ fontFamily: 'var(--font-inter)', color: '#9B9590', fontSize: '15px' }}>
            Hit <strong style={{ color: '#6B5A35' }}>New Issue</strong> to generate your first digest.
          </p>
        </div>
      )}

      {/* ---- Source Manager — always at the bottom of the page ---- */}
      <div className="mt-8 mb-12">
        <SourceManager
          newsletterUrls={newsletterUrls}
          onNewsletterUrlsChange={handleNewsletterUrlsChange}
        />
      </div>

    </div>
  );
}
