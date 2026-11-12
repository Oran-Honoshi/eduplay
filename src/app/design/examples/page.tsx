import { notFound } from 'next/navigation'
import Examples from './examples'

// Design QA: the worked-example boards (column board, place-value board) on
// sample examples. Preview links only, no sign-in.
export default function Page() {
  if (process.env.VERCEL_ENV === 'production') notFound()
  return <Examples />
}
