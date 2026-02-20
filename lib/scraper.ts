// lib/scraper.ts
// This file is responsible for reading newsletter content.
//
// THE KEY INSIGHT: Different newsletter platforms have different ways to access content.
// We try the smartest approach for each platform before falling back to raw HTML scraping.
//
// Strategy (in order of preference):
// 1. SUBSTACK API  — Substack has a free public JSON API. We use it directly.
//    This gives us clean, full article text without any HTML parsing problems.
//    Works for: any newsletter on Substack (*.substack.com or custom domains)
//
// 2. NEXT.JS DATA  — Some sites (like The Batch) are built with Next.js and bake
//    their data into the page as JSON. We extract that JSON directly.
//
// 3. HTML SCRAPING — For everything else, we visit the page and extract text.
//    This is the most fragile approach but works for many newsletters.
//
// 4. RSS/ATOM FEED — If the site publishes an RSS feed, we can parse that.
//    Clean text, widely supported.

import * as cheerio from 'cheerio';
import axios from 'axios';
import { RawNewsletter } from '@/types';

const FETCH_TIMEOUT = 15000;

// Browser-like headers to avoid being blocked
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Cache-Control': 'no-cache',
};

// -------------------------------------------------------------------
// Main function: given a newsletter homepage URL, return its content
// -------------------------------------------------------------------
export async function scrapeNewsletter(url: string): Promise<RawNewsletter> {
  const normalisedUrl = url.startsWith('http') ? url : `https://${url}`;
  const name = await extractName(normalisedUrl);

  try {
    // Strategy 1: Substack API (best quality — clean JSON, full text)
    const substackResult = await trySubstackApi(normalisedUrl, name);
    if (substackResult) return substackResult;

    // Strategy 2: RSS feed (clean, widely supported)
    const rssResult = await tryRssFeed(normalisedUrl, name);
    if (rssResult) return rssResult;

    // Strategy 3: Next.js __NEXT_DATA__ embedded JSON
    const nextResult = await tryNextJsData(normalisedUrl, name);
    if (nextResult) return nextResult;

    // Strategy 4: Plain HTML scraping (fallback)
    const htmlResult = await tryHtmlScraping(normalisedUrl, name);
    if (htmlResult) return htmlResult;

    return {
      name,
      url: normalisedUrl,
      text: '',
      error: 'Could not read this newsletter. The site may require login or block automated access. Try pasting a direct article URL instead.',
    };

  } catch (error) {
    return {
      name,
      url: normalisedUrl,
      text: '',
      error: `Failed to read this newsletter: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// -------------------------------------------------------------------
// STRATEGY 1: Substack public API
//
// Substack newsletters expose a free JSON API at /api/v1/posts
// This returns clean post data including the full HTML body.
// We detect Substack by: the URL containing "substack.com", OR
// the page's meta tags mentioning Substack.
// -------------------------------------------------------------------
async function trySubstackApi(url: string, name: string): Promise<RawNewsletter | null> {
  // Detect if this is a Substack newsletter
  const isSubstackDomain = url.includes('substack.com');

  // For custom domains (like lennysnewsletter.com), we need to check the page
  // Substack pages always load from substackcdn.com
  if (!isSubstackDomain) {
    try {
      const html = await fetchPage(url);
      if (!html || !html.includes('substackcdn.com')) return null;
    } catch {
      return null;
    }
  }

  try {
    // Get the base URL (without path) to hit the API
    const base = new URL(url);
    const apiUrl = `${base.protocol}//${base.hostname}/api/v1/posts?limit=1`;

    const response = await axios.get(apiUrl, {
      headers: { ...HEADERS, 'Accept': 'application/json' },
      timeout: FETCH_TIMEOUT,
    });

    const posts = response.data;
    if (!Array.isArray(posts) || posts.length === 0) return null;

    const post = posts[0];

    // Skip paywalled posts (audience = 'only_paid' AND no free preview)
    // We still try — sometimes paywalled posts have enough preview content
    const title = post.title || 'Latest issue';
    const subtitle = post.subtitle || '';
    const slug = post.slug || '';
    const postUrl = post.canonical_url || `${base.protocol}//${base.hostname}/p/${slug}`;

    // Get the full post HTML via the individual post API
    let bodyText = '';
    if (slug) {
      try {
        const postResponse = await axios.get(
          `${base.protocol}//${base.hostname}/api/v1/posts/${slug}`,
          { headers: { ...HEADERS, 'Accept': 'application/json' }, timeout: FETCH_TIMEOUT }
        );
        const postData = postResponse.data;
        const bodyHtml = postData.body_html || postData.body || '';
        bodyText = htmlToText(bodyHtml);
      } catch {
        // Fall back to just using the post listing data
      }
    }

    // If we couldn't get the full body, use what the listing gave us
    if (bodyText.length < 200) {
      bodyText = `${title}. ${subtitle}. ${post.search_engine_description || ''}`.trim();
    }

    if (bodyText.length < 50) return null;

    return {
      name: name || title,
      url: postUrl,
      text: bodyText.slice(0, 8000),
    };

  } catch {
    return null;
  }
}

// -------------------------------------------------------------------
// STRATEGY 2: RSS / Atom feed
//
// Many newsletters publish an RSS feed — a standardised XML format
// that lists recent posts with their content. This is clean and reliable.
// Common RSS paths: /feed, /rss, /feed.xml, /rss.xml
// -------------------------------------------------------------------
async function tryRssFeed(url: string, name: string): Promise<RawNewsletter | null> {
  const base = new URL(url);
  const feedPaths = ['/feed', '/rss', '/feed.xml', '/rss.xml', '/atom.xml', '/feed/rss', '/blog/feed'];

  for (const path of feedPaths) {
    try {
      const feedUrl = `${base.origin}${path}`;
      const response = await axios.get(feedUrl, {
        headers: { ...HEADERS, 'Accept': 'application/rss+xml, application/xml, text/xml' },
        timeout: 8000,
      });

      const xml = response.data;
      if (typeof xml !== 'string' || !xml.includes('<rss') && !xml.includes('<feed') && !xml.includes('<channel')) continue;

      // Parse the RSS XML to extract the first item's content
      const parsed = parseRssXml(xml);
      if (!parsed || parsed.text.length < 100) continue;

      return { name, url: parsed.url || url, text: parsed.text.slice(0, 8000) };
    } catch {
      continue; // Try the next path
    }
  }

  return null;
}

// Parse an RSS/Atom XML string and extract the first item's content
function parseRssXml(xml: string): { text: string; url: string } | null {
  try {
    // Extract the first <item> or <entry> (RSS vs Atom format)
    const itemMatch = xml.match(/<item[^>]*>([\s\S]*?)<\/item>/i) ||
                      xml.match(/<entry[^>]*>([\s\S]*?)<\/entry>/i);
    if (!itemMatch) return null;

    const item = itemMatch[1];

    // Get the URL
    const linkMatch = item.match(/<link[^>]*>(.*?)<\/link>/i) ||
                      item.match(/<link[^>]*href="([^"]*)"[^>]*\/>/i);
    const itemUrl = linkMatch ? linkMatch[1].trim() : '';

    // Get the content — RSS uses <description> or <content:encoded>, Atom uses <content>
    const contentMatch = item.match(/<content:encoded[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/i) ||
                         item.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i) ||
                         item.match(/<content[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/content>/i) ||
                         item.match(/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) ||
                         item.match(/<description[^>]*>([\s\S]*?)<\/description>/i);

    if (!contentMatch) return null;

    const rawContent = contentMatch[1];
    const text = htmlToText(rawContent);

    return { text, url: itemUrl };
  } catch {
    return null;
  }
}

// -------------------------------------------------------------------
// STRATEGY 3: Next.js embedded JSON data
//
// Next.js apps bake their server-side data into the HTML as a JSON blob
// in a <script id="__NEXT_DATA__"> tag. We can extract this without
// needing JavaScript execution.
// -------------------------------------------------------------------
async function tryNextJsData(url: string, name: string): Promise<RawNewsletter | null> {
  try {
    const html = await fetchPage(url);
    if (!html) return null;

    // Look for the Next.js data blob
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!match) return null;

    const data = JSON.parse(match[1]);
    const pageProps = data?.props?.pageProps || {};

    // Try to find posts/articles in the data
    const posts = pageProps.posts || pageProps.articles || pageProps.items || [];
    if (!Array.isArray(posts) || posts.length === 0) return null;

    // Collect content from the top posts — combine excerpts/descriptions
    // since we can't get full body text without JavaScript
    const latestPost = posts[0];
    const postTitle = latestPost.title || latestPost.name || '';

    // Collect text from multiple posts to give Claude more to work with
    const combinedText = posts
      .slice(0, 5)  // Top 5 posts
      .map(p => {
        const t = p.title || p.name || '';
        const e = p.excerpt || p.custom_excerpt || p.description || p.summary || '';
        // Also look for nested content
        const body = p.html || p.body || p.content || '';
        const bodyText = body ? htmlToText(body) : '';
        return [t, e, bodyText].filter(Boolean).join(' — ');
      })
      .filter(t => t.length > 10)
      .join('\n\n');

    if (combinedText.length < 100) return null;

    // Try to find the URL of the latest post
    const base = new URL(url);
    const slug = latestPost.slug || latestPost.url || '';
    const postUrl = slug.startsWith('http') ? slug : (slug ? `${base.origin}/${slug}` : url);

    return {
      name: name || postTitle,
      url: postUrl,
      text: combinedText.slice(0, 8000),
    };

  } catch {
    return null;
  }
}

// -------------------------------------------------------------------
// STRATEGY 4: Plain HTML scraping
//
// The most basic approach — fetch the page HTML, find the latest article
// link, fetch that page, extract the text. This works for many simple
// newsletter sites but fails for JavaScript-heavy apps.
// -------------------------------------------------------------------
async function tryHtmlScraping(url: string, name: string): Promise<RawNewsletter | null> {
  try {
    const homepageHtml = await fetchPage(url);
    if (!homepageHtml) return null;

    const $ = cheerio.load(homepageHtml);

    // Detect the platform to use the right selectors
    const platform = detectPlatform(url, $);

    // Find the link to the most recent post
    const latestPostUrl = findLatestPostUrl($, url, platform);

    if (latestPostUrl && latestPostUrl !== url) {
      // Fetch the article page itself
      const articleHtml = await fetchPage(latestPostUrl);
      if (articleHtml) {
        const article$ = cheerio.load(articleHtml);
        const text = extractCleanText(article$, platform);
        if (text.length > 200) {
          return { name, url: latestPostUrl, text: text.slice(0, 8000) };
        }
      }
    }

    // Fallback: extract text from the homepage itself
    const text = extractCleanText($, platform);
    if (text.length > 300) {
      return { name, url, text: text.slice(0, 8000) };
    }

    return null;
  } catch {
    return null;
  }
}

// -------------------------------------------------------------------
// Detect the newsletter platform
// -------------------------------------------------------------------
function detectPlatform(url: string, $: ReturnType<typeof cheerio.load>): string {
  if (url.includes('substack.com')) return 'substack';
  if (url.includes('beehiiv.com') || $('meta[content*="beehiiv"]').length > 0) return 'beehiiv';
  if ($('meta[name="generator"][content*="Ghost"]').length > 0) return 'ghost';
  if (url.includes('mailchimp.com')) return 'mailchimp';
  return 'generic';
}

// -------------------------------------------------------------------
// Find the latest post URL using platform-specific logic
// -------------------------------------------------------------------
function findLatestPostUrl($: ReturnType<typeof cheerio.load>, baseUrl: string, platform: string): string | null {
  const base = new URL(baseUrl);

  if (platform === 'substack' || platform === 'beehiiv') {
    const link = $('a[href*="/p/"]').first().attr('href');
    if (link) return link.startsWith('http') ? link : `${base.origin}${link}`;
  }

  if (platform === 'ghost') {
    const link = $('article a').first().attr('href') || $('h2 a, h3 a').first().attr('href');
    if (link) return link.startsWith('http') ? link : `${base.origin}${link}`;
  }

  // Generic: try common article link patterns
  const selectors = [
    'article h2 a', 'article h3 a', 'h2 a[href]', 'h3 a[href]',
    '.post-title a', '.entry-title a', '.post-card a', 'a.post-link',
  ];

  for (const selector of selectors) {
    const link = $(selector).first().attr('href');
    if (link && !link.startsWith('#')) {
      return link.startsWith('http') ? link : `${base.origin}${link}`;
    }
  }

  // Try links that look like article URLs (have date or keyword slug patterns)
  const articlePatterns = ['/post/', '/posts/', '/blog/', '/article/', '/newsletter/', '/issue/', '/p/'];
  let found: string | null = null;

  $('a[href]').each((_, el) => {
    if (found) return;
    const href = $(el).attr('href') || '';
    if (href.startsWith('#') || href.includes('mailto:') || href.includes('?')) return;
    const fullUrl = href.startsWith('http') ? href : `${base.origin}${href}`;
    if (href.startsWith('http') && !fullUrl.includes(base.hostname)) return;
    const skip = ['/about', '/contact', '/subscribe', '/login', '/archive', '/tag', '/category', '/privacy', '/terms'];
    if (skip.some(s => href === s || href.startsWith(s + '/'))) return;
    if (articlePatterns.some(p => href.includes(p))) found = fullUrl;
  });

  return found;
}

// -------------------------------------------------------------------
// Extract clean text from a cheerio-loaded HTML page
// -------------------------------------------------------------------
function extractCleanText($: ReturnType<typeof cheerio.load>, platform: string): string {
  // Remove everything that isn't article content
  ['nav', 'header', 'footer', 'script', 'style', 'iframe', 'noscript',
   '.nav', '.header', '.footer', '.sidebar', 'img', 'video', 'svg',
   '[class*="subscribe"]', '[class*="cookie"]', '[class*="banner"]',
   'button', 'form', 'input'].forEach(sel => {
    try { $(sel).remove(); } catch { /* skip */ }
  });

  const contentSelectors: Record<string, string[]> = {
    substack: ['.post-content', '.body.markup', '.body', 'article'],
    beehiiv: ['.post-content', '.content-body', 'article', 'main'],
    ghost: ['.gh-content', '.post-content', 'article', 'main'],
    mailchimp: ['#templateBody', '.mcnTextContent'],
    generic: ['article', 'main', '.post-content', '.entry-content', '.content-body', '[role="main"]', '#content'],
  };

  const selectors = contentSelectors[platform] || contentSelectors.generic;
  for (const selector of selectors) {
    const el = $(selector).first();
    if (el.length > 0) {
      const text = cleanRawText(el.text());
      if (text.length > 200) return text;
    }
  }

  return cleanRawText($('body').text());
}

// -------------------------------------------------------------------
// Convert HTML to plain text (strips tags, decodes entities)
// -------------------------------------------------------------------
function htmlToText(html: string): string {
  if (!html) return '';
  // Remove script and style blocks
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')  // Strip remaining tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '...');
  return cleanRawText(text);
}

// -------------------------------------------------------------------
// Clean up raw extracted text — remove junk lines, normalise spacing
// -------------------------------------------------------------------
function cleanRawText(raw: string): string {
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(line => {
      if (line.length === 0) return false;
      // Remove lines that are obviously code/markup artefacts
      if (line.startsWith('src=') || line.startsWith('href=') || line.startsWith('data-')) return false;
      if (line.includes('function(') && line.includes('{')) return false;
      if (/^[{}\[\]();,]+$/.test(line)) return false;
      return true;
    })
    .join(' ')
    .replace(/\s{3,}/g, '  ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .trim();
}

// -------------------------------------------------------------------
// Fetch a page and return its HTML
// -------------------------------------------------------------------
async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url, {
      headers: HEADERS,
      timeout: FETCH_TIMEOUT,
      maxRedirects: 5,
    });
    return response.data;
  } catch {
    return null;
  }
}

// -------------------------------------------------------------------
// Extract a newsletter name from its URL / page title
// -------------------------------------------------------------------
async function extractName(url: string): Promise<string> {
  try {
    const html = await fetchPage(url);
    if (html) {
      const ogName = html.match(/<meta[^>]*property="og:site_name"[^>]*content="([^"]+)"/i);
      if (ogName) return ogName[1].trim();
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) return titleMatch[1].split('|')[0].split('-')[0].trim().slice(0, 60);
    }
  } catch { /* ignore */ }
  // Fall back to domain name
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}
