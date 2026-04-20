import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('Missing url', { status: 400 })

  const allowed = ['upload.wikimedia.org', 'images.unsplash.com']
  try {
    const parsed = new URL(url)
    if (!allowed.some(d => parsed.hostname.endsWith(d))) {
      return new NextResponse('Domain not allowed', { status: 403 })
    }
  } catch {
    return new NextResponse('Invalid url', { status: 400 })
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'EduPlay/1.0 (educational app)' }
    })
    if (!res.ok) return new NextResponse('Upstream error', { status: res.status })
    const blob = await res.blob()
    return new NextResponse(blob, {
      headers: {
        'Content-Type': res.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      }
    })
  } catch {
    return new NextResponse('Fetch failed', { status: 502 })
  }
}