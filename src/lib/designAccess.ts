// The design QA pages (/design/...) open on preview links, and on the live
// site only with this key in the link (?key=...). They show sample and bank
// questions only, never children or families, and save nothing.
export const DESIGN_KEY = 'oli-notebook-7f3k29qx'

export function designAllowed(searchParams?: Record<string, string | string[] | undefined>) {
  if (process.env.VERCEL_ENV !== 'production') return true
  const k = searchParams?.key
  return (Array.isArray(k) ? k[0] : k) === DESIGN_KEY
}
