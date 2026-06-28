/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
    ADMIN_API_TOKEN: process.env.ADMIN_API_TOKEN ?? '',
  },
}

export default nextConfig
