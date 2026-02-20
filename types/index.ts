// types/index.ts
// This file defines the "shape" of all data in the app.
// Think of it like labelling every box before you pack it —
// TypeScript uses these to catch mistakes before they happen.

// One article in the final digest — could be from YouTube or a newsletter
export interface ArticleSummary {
  title: string;           // Rewritten editorial headline
  sourceName: string;      // e.g. "MKBHD" or "The Rundown"
  sourceType: 'youtube' | 'newsletter';  // Which kind of source
  sourceUrl: string;       // Link back to the original
  emoji: string;           // Chosen by Claude to represent the content
  summary: string;         // The full engaging paragraph
  takeaways: string[];     // 3-4 quick bullet points
  accentColor: string;     // The colour assigned to this source (for the UI)
}

// A "Big Theme" — a connection Claude spotted across multiple sources
export interface BigTheme {
  title: string;           // Short theme name
  observation: string;     // 2-3 sentence punchy observation
}

// The complete digest — everything Claude produces in one refresh
export interface Digest {
  generatedAt: string;     // ISO timestamp of when this was generated
  editionNumber: number;   // Increments each time you refresh
  articles: ArticleSummary[];  // All the article summaries
  bigThemes: BigTheme[];   // Cross-source connections (may be empty)
}

// A newsletter source that Ayushi has saved
export interface NewsletterSource {
  url: string;             // The homepage URL she pasted
  name?: string;           // Optional friendly name (auto-detected if blank)
}

// A YouTube channel that Ayushi has saved
export interface YouTubeSource {
  url: string;             // The channel URL she pasted
  name?: string;           // Auto-detected channel name
}

// Raw content fetched from a newsletter before Claude processes it
export interface RawNewsletter {
  name: string;            // Newsletter name (detected from the page)
  url: string;             // The URL we fetched from
  text: string;            // The cleaned article text
  error?: string;          // If something went wrong fetching it
}

// Raw content fetched from a YouTube video before Claude processes it
export interface RawVideo {
  title: string;           // Video title
  channelName: string;     // Channel name
  videoId: string;         // YouTube video ID (used to build the URL)
  url: string;             // Full YouTube URL
  transcript: string;      // Full transcript text (or description if no captions)
  hasTranscript: boolean;  // Whether we got real captions or fell back to description
}
