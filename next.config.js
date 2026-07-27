// TODO(infra): next@14.1.0 has a known security vulnerability with a patch
// available — see nextjs.org/blog/security-update-2025-12-11 (flagged in a
// Vercel build log warning on 2026-07-27). Not urgent enough to bump inline
// with today's other work, but should not be forgotten — upgrade next and
// re-verify the build/runtime before closing this out.

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'commons.wikimedia.org' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
}
module.exports = nextConfig