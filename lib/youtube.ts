// lib/youtube.ts
// This file handles everything YouTube-related:
// 1. Turning a channel URL into a channel ID (YouTube's internal identifier)
// 2. Fetching the most recent videos from that channel
// 3. Getting the full transcript (captions) from each video
//
// NOTE: We fetch transcripts ourselves by reading the YouTube watch page directly
// and pulling the caption track URL out of the page source. This is more reliable
// than third-party npm packages (like youtube-transcript) which break whenever
// YouTube changes their internal format.

import axios from 'axios';
import { RawVideo } from '@/types';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// How many recent videos to fetch per channel
const VIDEOS_PER_CHANNEL = 2;

// Small delay between transcript fetches to avoid YouTube throttling us
const TRANSCRIPT_DELAY_MS = 300;

// -------------------------------------------------------------------
// Main function: given a YouTube channel URL, return recent videos
// with their full transcripts
// -------------------------------------------------------------------
export async function getVideosFromChannel(channelUrl: string): Promise<RawVideo[]> {
  try {
    // Step 1: Convert the channel URL to a YouTube channel ID
    const channelId = await resolveChannelId(channelUrl);
    if (!channelId) {
      console.error(`Could not resolve channel ID for: ${channelUrl}`);
      return [];
    }

    // Step 2: Get the most recent videos from that channel
    const videos = await getRecentVideos(channelId);
    if (videos.length === 0) return [];

    // Step 3: For each video, fetch its transcript
    const results: RawVideo[] = [];
    for (const video of videos) {
      const transcript = await getTranscript(video.videoId);

      results.push({
        title: video.title,
        channelName: video.channelName,
        videoId: video.videoId,
        url: `https://www.youtube.com/watch?v=${video.videoId}`,
        transcript: transcript.text,
        hasTranscript: transcript.isReal,
      });

      // Wait a moment before the next transcript fetch to be polite to YouTube
      await delay(TRANSCRIPT_DELAY_MS);
    }

    return results;

  } catch (error) {
    console.error(`Error processing channel ${channelUrl}:`, error);
    return [];
  }
}

// -------------------------------------------------------------------
// Convert any YouTube channel URL format to a channel ID
// YouTube channel URLs come in several formats — we handle all of them
// -------------------------------------------------------------------
async function resolveChannelId(url: string): Promise<string | null> {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const pathname = parsed.pathname;

    // Format 1: youtube.com/channel/UCxxxxxxxx — ID is right in the URL
    const channelMatch = pathname.match(/^\/channel\/(UC[\w-]+)/);
    if (channelMatch) return channelMatch[1];

    // Format 2: youtube.com/@handle — need to ask YouTube API
    const handleMatch = pathname.match(/^\/@([\w.-]+)/);
    if (handleMatch) {
      return await lookupChannelByHandle(handleMatch[1]);
    }

    // Format 3: youtube.com/c/CustomName or youtube.com/user/Username
    const customMatch = pathname.match(/^\/(c|user)\/([\w.-]+)/);
    if (customMatch) {
      return await lookupChannelByUsername(customMatch[2]);
    }

    // Format 4: youtube.com/CustomName (no prefix) — try username lookup
    const plainMatch = pathname.match(/^\/([\w.-]+)$/);
    if (plainMatch && plainMatch[1] !== 'watch') {
      return await lookupChannelByUsername(plainMatch[1]);
    }

    return null;
  } catch (error) {
    console.error('Error resolving channel ID:', error);
    return null;
  }
}

// Look up a channel ID by its @handle (e.g. @mkbhd → UC...)
async function lookupChannelByHandle(handle: string): Promise<string | null> {
  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
      params: {
        part: 'id',
        forHandle: handle,
        key: YOUTUBE_API_KEY,
      },
    });
    return response.data.items?.[0]?.id || null;
  } catch {
    return null;
  }
}

// Look up a channel ID by username (legacy format)
async function lookupChannelByUsername(username: string): Promise<string | null> {
  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
      params: {
        part: 'id',
        forUsername: username,
        key: YOUTUBE_API_KEY,
      },
    });
    if (response.data.items?.[0]?.id) return response.data.items[0].id;

    // If username lookup failed, try handle lookup
    return await lookupChannelByHandle(username);
  } catch {
    return null;
  }
}

// -------------------------------------------------------------------
// Fetch the most recent videos from a channel
// -------------------------------------------------------------------
async function getRecentVideos(channelId: string): Promise<Array<{ videoId: string; title: string; channelName: string; description: string }>> {
  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/search`, {
      params: {
        part: 'snippet',
        channelId,
        order: 'date',         // Most recent first
        type: 'video',
        maxResults: VIDEOS_PER_CHANNEL,
        key: YOUTUBE_API_KEY,
      },
    });

    return (response.data.items || []).map((item: {
      id: { videoId: string };
      snippet: { title: string; channelTitle: string; description: string };
    }) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelName: item.snippet.channelTitle,
      description: item.snippet.description || '',
    }));

  } catch (error) {
    console.error('Error fetching recent videos:', error);
    return [];
  }
}

// -------------------------------------------------------------------
// Fetch the full transcript (captions) for a YouTube video
//
// How this works:
// 1. We fetch the YouTube watch page (just like a browser would)
// 2. We find the caption track URL buried in the page's JavaScript data
// 3. We fetch that caption track URL — it returns an XML file with all the text
// 4. We parse the XML and join the lines into one readable string
//
// This approach is more reliable than third-party packages because we're
// doing exactly what YouTube's own player does to load captions.
// If captions aren't available, we fall back to the video description.
// -------------------------------------------------------------------
async function getTranscript(videoId: string): Promise<{ text: string; isReal: boolean }> {
  try {
    // Step 1: Fetch the YouTube watch page
    const watchPageResponse = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        // We send browser-like headers so YouTube doesn't block us
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 10000,
    });

    const pageHtml: string = watchPageResponse.data;

    // Step 2: Find the caption tracks data in the page source
    // YouTube embeds caption URLs in a JSON object called "captionTracks" in the page HTML
    // We use a regex to find it — this is like searching for a specific phrase in a very long document
    const captionTracksMatch = pageHtml.match(/"captionTracks":\s*(\[.*?\])/);
    if (!captionTracksMatch) {
      // No captions found in this video — fall through to description fallback
      throw new Error('No caption tracks found in page');
    }

    // Step 3: Parse the caption tracks JSON
    // It looks like: [{"baseUrl":"https://...","name":{"simpleText":"English"},...}]
    const captionTracks = JSON.parse(captionTracksMatch[1]);

    // Prefer English captions; fall back to the first available track
    const englishTrack = captionTracks.find((t: { languageCode?: string }) =>
      t.languageCode === 'en' || t.languageCode === 'en-US' || t.languageCode === 'en-GB'
    );
    const track = englishTrack || captionTracks[0];

    if (!track?.baseUrl) {
      throw new Error('No usable caption track URL found');
    }

    // Step 4: Fetch the actual caption file (it's an XML file)
    // The URL looks like: https://www.youtube.com/api/timedtext?v=xxx&...
    const captionResponse = await axios.get(track.baseUrl, { timeout: 10000 });
    const captionXml: string = captionResponse.data;

    // Step 5: Parse the XML and extract just the text
    // The XML format looks like: <text start="0.5" dur="2.1">Hello world</text>
    // We use a regex to pull out just the text content from each tag
    const textMatches = captionXml.match(/<text[^>]*>([\s\S]*?)<\/text>/g) || [];
    const fullText = textMatches
      .map(tag => {
        // Remove the XML tags and decode HTML entities like &amp; → & and &#39; → '
        return tag
          .replace(/<[^>]+>/g, '')           // Strip XML tags
          .replace(/&amp;/g, '&')            // Decode &
          .replace(/&lt;/g, '<')             // Decode <
          .replace(/&gt;/g, '>')             // Decode >
          .replace(/&#39;/g, "'")            // Decode '
          .replace(/&quot;/g, '"')           // Decode "
          .replace(/\n/g, ' ')              // Replace newlines with spaces
          .trim();
      })
      .filter(t => t.length > 0)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (fullText.length > 100) {
      return { text: fullText, isReal: true };
    }

    throw new Error('Caption text too short');

  } catch (error) {
    console.log(`Transcript fetch failed for ${videoId}, falling back to description:`, (error as Error).message);
  }

  // Fallback: get the video description from YouTube API
  // This is less ideal (short description vs full transcript) but better than nothing
  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
      params: {
        part: 'snippet',
        id: videoId,
        key: YOUTUBE_API_KEY,
      },
    });
    const description = response.data.items?.[0]?.snippet?.description || '';
    return {
      text: description || 'No transcript or description available for this video.',
      isReal: false,
    };
  } catch {
    return { text: 'No transcript available.', isReal: false };
  }
}

// -------------------------------------------------------------------
// Simple delay helper — waits for a given number of milliseconds
// Used to be polite to YouTube's servers between requests
// -------------------------------------------------------------------
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
