// components/DigestView.tsx
// This is the main "magazine layout" component — it takes all the articles
// from the digest and arranges them like a real magazine spread.
//
// Layout rhythm:
// - First article: always full-width (the "cover story" / feature)
// - Middle articles: 2-column grid (regular magazine pages)
// - Last article (if odd total): full-width again for balance
//
// The design goal: when you see this page, it should feel like you've
// opened a beautifully designed personal magazine — not a list of cards.

import { Digest } from '@/types';
import ArticleCard from './ArticleCard';
import EditorialIntro from './EditorialIntro';

interface DigestViewProps {
  digest: Digest;
}

export default function DigestView({ digest }: DigestViewProps) {
  const { articles, bigThemes } = digest;

  if (!articles || articles.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <p style={{ fontFamily: 'var(--font-inter)', color: '#9B9590' }}>
          No articles were generated. Try adding more sources and refreshing.
        </p>
      </div>
    );
  }

  return (
    <main className="pb-24">

      {/* Thin decorative rule below the masthead — like a magazine's section divider */}
      <div
        className="mb-10"
        style={{
          height: '1px',
          background: 'linear-gradient(to right, transparent, #D0C8B4 20%, #D0C8B4 80%, transparent)',
        }}
      />

      {/* Big Themes / Editor's Note — only appears if Claude found connections */}
      {bigThemes && bigThemes.length > 0 && (
        <EditorialIntro themes={bigThemes} />
      )}

      {/* ---- Article Grid ---- */}
      <div className="max-w-4xl mx-auto px-6">

        {/* Section header — "Today's Reading" with flanking rules */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, #D0C8B4)' }} />
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '10px',
              letterSpacing: '0.25em',
              color: '#9B9590',
            }}
            className="uppercase font-medium whitespace-nowrap"
          >
            Today&apos;s Reading
          </p>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, #D0C8B4)' }} />
        </div>

        {/* The article grid — 2 columns on desktop, 1 on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((article, index) => {
            // The FIRST article always gets the full-width "feature" treatment
            const isFirstArticle = index === 0;

            // If there's an odd number of articles, the last one is also full-width
            // (avoids a lonely half-width card at the end of the grid)
            const isLastAndOdd = index === articles.length - 1 && articles.length % 2 !== 0 && articles.length > 1;

            return (
              <ArticleCard
                key={article.sourceUrl + index}
                article={article}
                isFeature={isFirstArticle || isLastAndOdd}
              />
            );
          })}
        </div>

        {/* Footer of the digest — edition info and generation timestamp */}
        <div className="mt-20 text-center">

          {/* Decorative close ornament */}
          <div
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: '28px',
              color: '#C5A55A',
              marginBottom: '16px',
              opacity: 0.6,
            }}
          >
            ✦
          </div>

          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '11px',
              letterSpacing: '0.15em',
              color: '#B0AAA4',
            }}
            className="uppercase"
          >
            {/* Format: "Generated 09:15 · 3 sources · Edition 4" */}
            Generated {new Date(digest.generatedAt).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
            })}
            <span className="mx-2" style={{ color: '#D0C8B4' }}>·</span>
            {articles.length} {articles.length === 1 ? 'source' : 'sources'}
            <span className="mx-2" style={{ color: '#D0C8B4' }}>·</span>
            Edition {digest.editionNumber}
          </p>

          <p
            style={{ fontFamily: 'var(--font-playfair)', color: '#C5B9A5', fontSize: '20px' }}
            className="mt-3 italic"
          >
            — fin —
          </p>
        </div>

      </div>
    </main>
  );
}
