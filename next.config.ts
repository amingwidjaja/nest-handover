/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ini penting agar Mapbox diproses dengan benar oleh Next.js
  transpilePackages: ['react-map-gl', 'mapbox-gl', '@mapbox/mapbox-sdk'],
}

module.exports = nextConfig