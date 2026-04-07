import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch');
    const html = await response.text();

    // Simple RegEx based scraping for og:image
    const ogImageMatch = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["'](.*?)["']/i);
    const twitterImageMatch = html.match(/<meta\s+(?:property|name)=["']twitter:image["']\s+content=["'](.*?)["']/i);
    
    // Normalize URL
    let image = ogImageMatch ? ogImageMatch[1] : (twitterImageMatch ? twitterImageMatch[1] : null);

    // Handle relative URLs (rare for og:image but possible)
    if (image && !image.startsWith('http')) {
        const urlObj = new URL(url);
        image = `${urlObj.protocol}//${urlObj.host}${image.startsWith('/') ? '' : '/'}${image}`;
    }

    return NextResponse.json({ image });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
  }
}
