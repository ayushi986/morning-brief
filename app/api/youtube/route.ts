// app/api/youtube/route.ts
// This is the YouTube-fetching API endpoint.
// When the app needs to fetch videos and transcripts, it calls this route.
// Think of it as the "go watch these YouTube channels for me" button.

import { NextRequest, NextResponse } from 'next/server';
import { getVideosFromChannel } from '@/lib/youtube';

// Allow up to 60 seconds — fetching transcripts from multiple channels takes time
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Read the list of YouTube channel URLs from the request
    const { channelUrls } = await request.json();

    if (!channelUrls || !Array.isArray(channelUrls) || channelUrls.length === 0) {
      return NextResponse.json(
        { error: 'Please provide an array of YouTube channel URLs' },
        { status: 400 }
      );
    }

    // Fetch videos from all channels at once (in parallel)
    const channelResults = await Promise.all(
      channelUrls.map((url: string) => getVideosFromChannel(url))
    );

    // Flatten the results — each channel returns multiple videos,
    // so we combine them all into one flat list
    const videos = channelResults.flat();

    return NextResponse.json({ videos });

  } catch (error) {
    console.error('YouTube route error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch YouTube videos' },
      { status: 500 }
    );
  }
}
