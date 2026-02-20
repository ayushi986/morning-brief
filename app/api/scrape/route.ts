// app/api/scrape/route.ts
// This is the newsletter-fetching API endpoint.
// When the app needs to read newsletters, it calls this route.
// Think of it as the "go read these newsletters for me" button.

import { NextRequest, NextResponse } from 'next/server';
import { scrapeNewsletter } from '@/lib/scraper';

// Tell Vercel to allow up to 60 seconds for this to run
// (fetching multiple newsletters can take a while)
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Read the list of newsletter URLs from the request
    const { urls } = await request.json();

    // Validate that we actually received some URLs
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'Please provide an array of newsletter URLs' },
        { status: 400 }
      );
    }

    // Fetch all newsletters at the same time (in parallel, for speed)
    // This is like sending multiple people to read different things simultaneously
    const results = await Promise.all(
      urls.map((url: string) => scrapeNewsletter(url))
    );

    return NextResponse.json({ newsletters: results });

  } catch (error) {
    console.error('Scrape route error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch newsletters' },
      { status: 500 }
    );
  }
}
