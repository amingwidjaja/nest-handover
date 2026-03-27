import { NextResponse } from "next/server"

/**
 * Server-side reverse geocode via Azure Maps.
 * Keeps token server-side — AZURE_MAPS_KEY tidak di-expose ke client.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get("lat") ?? "")
  const lon = parseFloat(searchParams.get("lon") ?? "")

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "lat and lon required" }, { status: 400 })
  }

  const key = process.env.NEXT_PUBLIC_AZURE_MAPS_KEY
  if (!key) {
    return NextResponse.json({ error: "Azure Maps key not configured" }, { status: 500 })
  }

  const params = new URLSearchParams({
    "api-version": "1.0",
    "subscription-key": key,
    query: `${lat},${lon}`,
    language: "id-ID",
  })

  try {
    const res = await fetch(
      `https://atlas.microsoft.com/search/address/reverse/json?${params}`,
      { next: { revalidate: 0 } }
    )
    if (!res.ok) {
      return NextResponse.json({ error: "reverse geocode upstream failed" }, { status: 502 })
    }

    const data = await res.json() as {
      addresses?: Array<{
        address?: {
          streetNameAndNumber?: string
          streetName?: string
          municipalitySubdivision?: string
          municipality?: string
          postalCode?: string
          freeformAddress?: string
        }
      }>
    }

    const addr = data.addresses?.[0]?.address
    if (!addr) {
      return NextResponse.json({ error: "no results" }, { status: 404 })
    }

    // Normalize to same shape as nominatim-parse output
    return NextResponse.json({
      display_name: addr.freeformAddress ?? "",
      address: {
        road: addr.streetNameAndNumber || addr.streetName || "",
        suburb: addr.municipalitySubdivision || "",
        city: addr.municipality || "",
        postcode: addr.postalCode || "",
      }
    })
  } catch {
    return NextResponse.json({ error: "reverse geocode request failed" }, { status: 502 })
  }
}
