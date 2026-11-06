import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
// GET /api/version — the deployed commit, so open pages can tell they're out of date.
export async function GET() {
  return NextResponse.json({ v: process.env.VERCEL_GIT_COMMIT_SHA || 'dev' }, { headers: { 'Cache-Control': 'no-store' } })
}
