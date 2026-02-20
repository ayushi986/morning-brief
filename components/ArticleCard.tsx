// components/ArticleCard.tsx
// This is the main "article" component — each newsletter gets rendered as one of these.
//
// Design philosophy: a page spread in a real luxury magazine.
// Each card has:
//   - A coloured left accent bar (not just a top strip — more architectural)
//   - A large editorial headline in our serif font
//   - A byline in refined small type
//   - Generous body text with proper leading
//   - "In Brief" takeaways styled like a magazine sidebar
//
// Feature articles (first + last-if-odd) get extra presence:
//   - Larger headline
//   - A warm tinted background block for the header area
//   - More padding

import { ArticleSummary } from '@/types';

interface ArticleCardProps {
  article: ArticleSummary;
  isFeature?: boolean;  // Feature articles are larger/more prominent
}

export default function ArticleCard({ article, isFeature = false }: ArticleCardProps) {
  return (
    <article
      className={`
        bg-white overflow-hidden
        transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5
        animate-fade-in
        ${isFeature ? 'col-span-2' : 'col-span-1'}
      `}
      style={{
        // Subtle outer shadow — gives the card depth, like paper lifting off the page
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        border: '1px solid #EAE6DE',
      }}
    >
      {/* ---- The coloured header block ---- */}
      {/* For feature articles, this gets a warm tinted background — more presence */}
      <div
        style={{
          background: isFeature
            ? `linear-gradient(135deg, ${hexToRgba(article.accentColor, 0.08)} 0%, transparent 60%)`
            : 'transparent',
          borderBottom: '1px solid #EAE6DE',
        }}
        className={`${isFeature ? 'p-8 md:p-10' : 'p-6 md:p-8'} relative`}
      >
        {/* Left accent bar — a thick coloured stripe on the left edge of the header.
            This is the signature design element: more architectural than a top strip. */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: article.accentColor }}
        />

        {/* Source badge row — emoji + source type label */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`${isFeature ? 'text-2xl' : 'text-lg'}`}>{article.emoji}</span>
          <span
            style={{
              fontFamily: 'var(--font-inter)',
              color: article.accentColor,
              fontSize: '10px',
              letterSpacing: '0.2em',
            }}
            className="font-semibold uppercase"
          >
            Newsletter
          </span>
        </div>

        {/* The article headline — big, editorial.
            Claude rewrites this to feel like a real magazine headline. */}
        <h2
          style={{ fontFamily: 'var(--font-playfair)', letterSpacing: '-0.01em' }}
          className={`
            font-bold text-[#1A1009] leading-tight mb-4
            ${isFeature ? 'text-3xl md:text-[40px]' : 'text-2xl md:text-3xl'}
          `}
        >
          {article.title}
        </h2>

        {/* Byline — "From [Source Name]" with an accent dot */}
        <div className="flex items-center gap-2.5">
          {/* Small filled circle in the source's accent colour — like a section-colour tag */}
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: article.accentColor }}
          />
          <p
            style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', letterSpacing: '0.05em' }}
            className="text-[#9B9590] uppercase"
          >
            From{' '}
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium transition-colors"
              style={{ color: '#5A5550' }}
              onMouseOver={e => (e.currentTarget.style.color = article.accentColor)}
              onMouseOut={e => (e.currentTarget.style.color = '#5A5550')}
            >
              {article.sourceName}
            </a>
          </p>
        </div>
      </div>

      {/* ---- Article body ---- */}
      <div className={`${isFeature ? 'p-8 md:p-10' : 'p-6 md:p-8'} pl-7 md:pl-9`}>

        {/* The main summary — the article body, written by Claude.
            Line-height of 1.85 is the "comfortable magazine" sweet spot.
            The text is warm near-black, not pure black — feels less harsh. */}
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            lineHeight: '1.85',
            color: '#2D2820',
            fontSize: isFeature ? '17px' : '15px',
          }}
          className="mb-7"
        >
          {article.summary}
        </p>

        {/* ---- "In Brief" sidebar — the bullet takeaways ---- */}
        {/* Styled like a real magazine sidebar: slightly smaller type, left border rule */}
        {article.takeaways && article.takeaways.length > 0 && (
          <div
            className="pl-5 py-1"
            style={{ borderLeft: `2px solid ${article.accentColor}` }}
          >
            {/* Section label */}
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                color: article.accentColor,
                fontSize: '10px',
                letterSpacing: '0.2em',
              }}
              className="font-semibold uppercase mb-3"
            >
              In Brief
            </p>

            {/* The takeaway bullets */}
            <ul className="space-y-2.5">
              {article.takeaways.map((takeaway, index) => (
                <li
                  key={index}
                  className="flex gap-3"
                  style={{ fontFamily: 'var(--font-inter)', fontSize: '13px', color: '#3D3830', lineHeight: '1.6' }}
                >
                  {/* Diamond bullet in accent colour — more refined than a plain dot */}
                  <span
                    className="flex-shrink-0 mt-[5px]"
                    style={{ color: article.accentColor, fontSize: '8px' }}
                  >
                    ◆
                  </span>
                  {takeaway}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ---- Footer link ---- */}
        <div className="mt-7 pt-5" style={{ borderTop: '1px solid #EAE6DE' }}>
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: 'var(--font-inter)',
              color: article.accentColor,
              fontSize: '10px',
              letterSpacing: '0.2em',
            }}
            className="uppercase font-semibold hover:opacity-70 transition-opacity"
          >
            Read original newsletter →
          </a>
        </div>

      </div>
    </article>
  );
}

// -------------------------------------------------------------------
// Helper: convert a hex colour to rgba with given opacity
// Used to create the subtle tinted background on feature articles
// e.g. hexToRgba('#E85D4A', 0.08) → 'rgba(232, 93, 74, 0.08)'
// -------------------------------------------------------------------
function hexToRgba(hex: string, alpha: number): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch {
    return `rgba(0, 0, 0, ${alpha})`;
  }
}
