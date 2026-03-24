/** @type {import('next').NextConfig} */
function supabaseStorageRemotePattern() {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!u) return null
  try {
    return {
      protocol: "https",
      hostname: new URL(u).hostname,
      pathname: "/storage/v1/object/public/**"
    }
  } catch {
    return null
  }
}

const supabasePattern = supabaseStorageRemotePattern()

const nextConfig = {
  // Ini penting agar Mapbox diproses dengan benar oleh Next.js
  transpilePackages: ["react-map-gl", "mapbox-gl"],
  images: {
    remotePatterns: [
      ...(supabasePattern ? [supabasePattern] : []),
      {
        protocol: "https",
        hostname: "api.qrserver.com",
        pathname: "/v1/create-qr-code/**"
      }
    ]
  }
}

module.exports = nextConfig