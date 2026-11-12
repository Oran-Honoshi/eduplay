import { notFound } from 'next/navigation'
import Examples from './examples'
import { designAllowed } from '@/lib/designAccess'

// Design QA: the worked-example boards (column board, place-value board) on
// sample examples. No sign-in. Preview links, or the live site with ?key=.
export const dynamic = 'force-dynamic'
export const metadata = { robots: { index: false, follow: false } }

export default function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  if (!designAllowed(searchParams)) notFound()
  return <Examples />
}
