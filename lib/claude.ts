// lib/claude.ts
// This file is the bridge between our app and Claude AI.
// It sends content to Claude and gets back beautifully written summaries.
// Think of it as the "call the writer" function — we send the raw material,
// Claude sends back a polished magazine article.

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { buildSourceSummaryPrompt, buildBigThemesPrompt } from './prompts';
import { RawNewsletter, RawVideo, ArticleSummary, BigTheme } from '@/types';

// The Claude model we're using — Sonnet is fast, affordable, and excellent at writing
const MODEL = 'claude-sonnet-4-5-20250929';

// -------------------------------------------------------------------
// Read the API key directly from .env.local as a reliable fallback.
//
// WHY DO THIS? Two reasons:
//
// 1. Module-level initialization: if we did `const anthropic = new Anthropic(...)`
//    at the top of the file, it would run at import time — potentially before
//    Next.js has loaded .env.local. So we moved it into a function.
//
// 2. Shell environment override: Claude Code (the tool used to build this app)
//    sets ANTHROPIC_API_KEY to an EMPTY STRING in the shell environment.
//    Next.js always prefers actual system environment variables over .env.local,
//    so the empty string wins and our real key in .env.local gets ignored.
//
// The solution: read .env.local ourselves and extract the key directly.
// This bypasses both problems completely.
// -------------------------------------------------------------------
function getApiKey(): string {
  // First, try reading directly from .env.local — this is the most reliable source
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      if (line.startsWith('ANTHROPIC_API_KEY=')) {
        const key = line.substring('ANTHROPIC_API_KEY='.length).trim();
        if (key) return key;
      }
    }
  } catch {
    // .env.local not found or not readable — fall through to process.env
  }

  // Fallback: try the environment variable (works in production/Vercel)
  const envKey = process.env.ANTHROPIC_API_KEY;
  if (envKey) return envKey;

  throw new Error(
    'ANTHROPIC_API_KEY not found. Make sure it is in your .env.local file.'
  );
}

function getAnthropicClient() {
  return new Anthropic({ apiKey: getApiKey() });
}

// The 6 accent colours assigned to sources in order (cycles if you have more than 6)
const ACCENT_COLORS = [
  '#E85D4A', // coral red
  '#3B82F6', // electric blue
  '#16A34A', // forest green
  '#D97706', // golden amber
  '#7C3AED', // dusty purple
  '#0E7490', // slate teal
];

// -------------------------------------------------------------------
// Summarise a single newsletter issue
// Sends the full article text to Claude, gets back a magazine article
// -------------------------------------------------------------------
export async function summariseNewsletter(
  newsletter: RawNewsletter,
  colorIndex: number
): Promise<ArticleSummary | null> {
  // If we couldn't fetch the newsletter content, skip it
  if (!newsletter.text || newsletter.text.length < 100) {
    console.log(`Skipping ${newsletter.name} — no content to summarise`);
    return null;
  }

  try {
    const { system, user } = buildSourceSummaryPrompt(newsletter, 'newsletter');

    // Create a fresh client here — this ensures the API key is read from env at call time
    const response = await getAnthropicClient().messages.create({
      model: MODEL,
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: user }],
    });

    // Extract the text content from Claude's response
    const content = response.content[0];
    if (content.type !== 'text') return null;

    // Parse the JSON that Claude returns
    const parsed = JSON.parse(extractJson(content.text));

    return {
      title: parsed.title || newsletter.name,
      sourceName: parsed.sourceName || newsletter.name,
      sourceType: 'newsletter',
      sourceUrl: newsletter.url,
      emoji: parsed.emoji || '📰',
      summary: parsed.summary || '',
      takeaways: parsed.takeaways || [],
      accentColor: ACCENT_COLORS[colorIndex % ACCENT_COLORS.length],
    };

  } catch (error) {
    console.error(`Error summarising newsletter ${newsletter.name}:`, error);
    return null;
  }
}

// -------------------------------------------------------------------
// Summarise a single YouTube video
// Sends the full transcript to Claude, gets back a magazine article
// -------------------------------------------------------------------
export async function summariseVideo(
  video: RawVideo,
  colorIndex: number
): Promise<ArticleSummary | null> {
  // If we have no content at all, skip this video
  if (!video.transcript || video.transcript.length < 50) {
    console.log(`Skipping ${video.title} — no transcript content`);
    return null;
  }

  try {
    const { system, user } = buildSourceSummaryPrompt(video, 'youtube');

    // Create a fresh client here — same reason as above
    const response = await getAnthropicClient().messages.create({
      model: MODEL,
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: user }],
    });

    const content = response.content[0];
    if (content.type !== 'text') return null;

    const parsed = JSON.parse(extractJson(content.text));

    return {
      title: parsed.title || video.title,
      sourceName: parsed.sourceName || video.channelName,
      sourceType: 'youtube',
      sourceUrl: video.url,
      emoji: parsed.emoji || '🎥',
      summary: parsed.summary || '',
      takeaways: parsed.takeaways || [],
      accentColor: ACCENT_COLORS[colorIndex % ACCENT_COLORS.length],
    };

  } catch (error) {
    console.error(`Error summarising video ${video.title}:`, error);
    return null;
  }
}

// -------------------------------------------------------------------
// Find Big Themes across all the day's articles
// Claude looks at all the titles and spots genuine cross-source connections
// -------------------------------------------------------------------
export async function findBigThemes(articles: ArticleSummary[]): Promise<BigTheme[]> {
  // Only bother if we have at least 2 articles to compare
  if (articles.length < 2) return [];

  try {
    const articleTitles = articles.map(a => `${a.emoji} ${a.title} (${a.sourceName})`);
    const { system, user } = buildBigThemesPrompt(articleTitles);

    // Create a fresh client here — same reason as above
    const response = await getAnthropicClient().messages.create({
      model: MODEL,
      max_tokens: 512,
      system,
      messages: [{ role: 'user', content: user }],
    });

    const content = response.content[0];
    if (content.type !== 'text') return [];

    const parsed = JSON.parse(extractJson(content.text));
    return parsed.themes || [];

  } catch (error) {
    console.error('Error finding big themes:', error);
    return []; // Big themes are optional — never crash because of them
  }
}

// -------------------------------------------------------------------
// Helper: Extract JSON from Claude's response
// Sometimes Claude adds a tiny bit of text before/after the JSON —
// this function finds and extracts just the JSON part
// -------------------------------------------------------------------
function extractJson(text: string): string {
  // Try to find a JSON object in the text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];

  // If no match, return the text as-is and let JSON.parse fail naturally
  return text;
}
