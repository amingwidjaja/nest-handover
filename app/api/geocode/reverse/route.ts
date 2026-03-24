import { NextResponse } from "next/server"

/**
 * Server-side reverse geocode (Nominatim) — avoids browser CORS and keeps
 * User-Agent policy-compliant requests.
 *
 * @see https://nominatim.org/release-docs/latest/api/Reverse/
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get("lat") ?? "")
  const lon = parseFloat(searchParams.get("lon") ?? "")
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json(
      { error: "lat and lon query params required" },
      { status: 400 }
    )
  }

  const url =
    `https://nominatim.openstreetmap.org/reverse?` +
    new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      format: "json",
      addressdetails: "1"
    })

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "NEST-Handover/1.0 (reverse geocode)"
      },
      next: { revalidate: 0 }
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: "reverse geocode upstream failed" },
        { status: 502 }
      )
    }

    const data = (await res.json()) as Record<string, unknown>
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: "reverse geocode request failed" },
      { status: 502 }
    )
  }
}
