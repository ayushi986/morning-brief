// components/Masthead.tsx
// The masthead is the "cover" of our magazine — the big header at the top.
// Think of it like the "VOGUE" or "WIRED" logo at the top of a real magazine.
//
// Design philosophy: luxury magazine, not newspaper.
// - The title has a warm gradient tint — not flat black
// - There's a decorative rule above and below with ornamental details
// - The date sits quietly above the title in small caps
// - The "New Issue" button feels special — gold/amber accent, not just a black border box

'use client'; // This tells Next.js this component can use browser features like onClick

interface MastheadProps {
  editionNumber: number;          // Which edition this is (e.g. Edition 12)
  onRefresh: () => void;          // Function to call when the Refresh button is clicked
  isLoading: boolean;             // Whether we're currently generating a digest
}

export default function Masthead({ editionNumber, onRefresh, isLoading }: MastheadProps) {
  // Format today's date in the style "Thursday, 20 February 2025"
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    // Outer wrapper — full width, warm background, generous top padding
    <header className="w-full bg-white pt-10 pb-6 px-6">
      <div className="max-w-4xl mx-auto">

        {/* ---- Top metadata row: date on left, New Issue button on right ---- */}
        <div className="flex items-center justify-between mb-6">

          {/* Date + edition — small, quiet, like the fine print on a magazine cover */}
          <p
            style={{ fontFamily: 'var(--font-inter)' }}
            className="text-xs tracking-[0.2em] uppercase text-[#9CA3AF]"
          >
            {formattedDate}
            <span className="mx-2 text-[#DCC8C8]">·</span>
            No. {editionNumber}
          </p>

          {/* "New Issue" button — this is the most important button on the page.
              It's styled to feel special: amber/gold border, elegant hover fill.
              NOT a plain black rectangle — that's newspaper. This is magazine. */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={`
              group relative px-5 py-2 text-xs tracking-[0.15em] uppercase transition-all duration-300
              ${isLoading
                ? 'opacity-40 cursor-not-allowed'
                : 'cursor-pointer hover:shadow-lg'
              }
            `}
            style={{
              fontFamily: 'var(--font-inter)',
              border: '1px solid #9F1239',  // Deep rose border
              color: isLoading ? '#9CA3AF' : '#7F0E2D',  // Dark rose text
              background: isLoading ? 'transparent' : 'linear-gradient(135deg, #FFFAFA 0%, #FEF2F4 100%)',  // Subtle blush
            }}
          >
            {/* Hover overlay — fills with warm gold on hover */}
            {!isLoading && (
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(135deg, #9F1239 0%, #7F0E2D 100%)' }}
              />
            )}
            {/* Button text — sits above the hover overlay */}
            <span className="relative" style={{ color: 'inherit' }}>
              {isLoading ? '⏳ Printing your edition...' : '✦ New Issue'}
            </span>
          </button>
        </div>

        {/* ---- The main masthead — the "magazine logo" area ---- */}

        {/* Top ornamental rule — two thin lines with a gap between */}
        <div className="flex flex-col gap-[3px] mb-5">
          <div className="h-px w-full bg-[#1A1A1A]" />
          <div className="h-px w-full bg-[#1A1A1A] opacity-20" />
        </div>

        {/* The "MORNING BRIEF" title — the centrepiece.
            We use a warm gradient on the text so it feels rich, not flat newspaper black.
            On browsers that don't support text gradients, it falls back to dark brown. */}
        <div className="text-center py-4">
          <h1
            style={{
              fontFamily: 'var(--font-playfair)',
              // Gradient from warm brown-black to slightly cooler dark — rich, not flat
              background: 'linear-gradient(135deg, #1A0A0A 0%, #2C0A14 40%, #1A1A1A 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.01em',
              fontSize: '72px',
              fontWeight: 600,
            }}
            className="leading-[1.15] block"
          >
            Morning Brief
          </h1>
        </div>

        {/* Bottom ornamental rule — mirror of the top */}
        <div className="flex flex-col gap-[3px] mt-5 mb-5">
          <div className="h-px w-full bg-[#1A1A1A] opacity-20" />
          <div className="h-px w-full bg-[#1A1A1A]" />
        </div>

        {/* Tagline row — centred, flanked by decorative ornaments */}
        <div className="flex items-center justify-center gap-4">
          <span style={{ color: '#9F1239', fontSize: '10px' }}>◆</span>
          <p
            style={{ fontFamily: 'var(--font-inter)' }}
            className="text-center text-[10px] tracking-[0.3em] uppercase text-[#9CA3AF]"
          >
            Your personal read, curated fresh
          </p>
          <span style={{ color: '#9F1239', fontSize: '10px' }}>◆</span>
        </div>

      </div>
    </header>
  );
}
