import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // puppeteer-core and @sparticuz/chromium must not be bundled — they use
  // native binaries that are loaded at runtime on the server.
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
}

export default nextConfig
