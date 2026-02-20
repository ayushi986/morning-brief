// app/api/digest/route.ts
// This is the main "generate my digest" endpoint — the orchestrator.
// When you hit the Refresh button, THIS is what runs.
// It coordinates everything: fetching newsletters, fetching YouTube videos,
// sending each one to Claude for summarising, then finding Big Themes.
// Think of it as the editor who coordinates all the writers.

import { NextRequest, NextResponse } from 'next/server';
import { scrapeNewsletter } from '@/lib/scraper';
import { getVideosFromChannel } from '@/lib/youtube';
import { summariseNewsletter, summariseVideo, findBigThemes } from '@/lib/claude';
import { ArticleSummary, Digest } from '@/types';

// Allow up to 60 seconds — this does a lot of work!
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Read the newsletter URLs and YouTube channel URLs from the request
    const { newsletterUrls, channelUrls, editionNumber } = await request.json();

    const newsletters = newsletterUrls || [];
    const channels = channelUrls || [];

    // Validate that we have something to work with
    if (newsletters.length === 0 && channels.length === 0) {
      return NextResponse.json(
        { error: 'Please add at least one newsletter or YouTube channel first.' },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------------
    // Step 1: Fetch all content in parallel
    // We fetch newsletters AND YouTube videos at the same time
    // so we're not waiting for one before starting the other
    // ---------------------------------------------------------------
    const [newsletterContents, channelVideoArrays] = await Promise.all([
      Promise.all(newsletters.map((url: string) => scrapeNewsletter(url))),
      Promise.all(channels.map((url: string) => getVideosFromChannel(url))),
    ]);

    const videoContents = channelVideoArrays.flat();

    // ---------------------------------------------------------------
    // Step 2: Send each piece of content to Claude for summarising
    // We summarise newsletters and videos in parallel for speed
    // Each one gets a colour from our palette (assigned by index)
    // ---------------------------------------------------------------
    const [newsletterSummaries, videoSummaries] = await Promise.all([
      Promise.all(
        newsletterContents.map((newsletter, index) =>
          summariseNewsletter(newsletter, index)
        )
      ),
      Promise.all(
        videoContents.map((video, index) =>
          // Videos get colour indices after newsletters
          // so they don't share the same colour
          summariseVideo(video, newsletterContents.length + index)
        )
      ),
    ]);

    // Remove any null results (sources that failed or had no content)
    const allArticles: ArticleSummary[] = [
      ...newsletterSummaries.filter((s): s is ArticleSummary => s !== null),
      ...videoSummaries.filter((s): s is ArticleSummary => s !== null),
    ];

    if (allArticles.length === 0) {
      return NextResponse.json(
        { error: 'Could not generate any articles. Check your newsletter URLs and YouTube channels.' },
        { status: 422 }
      );
    }

    // ---------------------------------------------------------------
    // Step 3: Find Big Themes across all the articles
    // Claude looks at everything and spots genuine connections
    // ---------------------------------------------------------------
    const bigThemes = await findBigThemes(allArticles);

    // ---------------------------------------------------------------
    // Step 4: Build the complete digest and return it
    // ---------------------------------------------------------------
    const digest: Digest = {
      generatedAt: new Date().toISOString(),
      editionNumber: editionNumber || 1,
      articles: allArticles,
      bigThemes,
    };

    return NextResponse.json({ digest });

  } catch (error) {
    console.error('Digest route error:', error);
    return NextResponse.json(
      { error: 'Something went wrong generating your digest. Please try again.' },
      { status: 500 }
    );
  }
}
