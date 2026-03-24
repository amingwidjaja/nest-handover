import { NextResponse } from "next/server"

/**
 * Server-side reverse geocode (Nominatim). Browsers cannot call Nominatim reliably (CORS + policy).
 * @see https://operations.osmfoundation.org/policies/nominatim/
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")
  if (!lat || !lon) {
    return NextResponse.json({ error: "lat and lon required" }, { status: 400 })
  }
  const la = Number(lat)
  const lo = Number(lon)
  if (!Number.isFinite(la) || !Number.isFinite(lo)) {
    return NextResponse.json({ error: "invalid coordinates" }, { status: 400 })
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse")
  url.searchParams.set("lat", String(la))
  url.searchParams.set("lon", String(lo))
  url.searchParams.set("format", "json")
  url.searchParams.set("addressdetails", "1")
  url.searchParams.set("zoom", "18")

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "NEST-Handover/1.0 (https://github.com/nest-handover)"
      },
      next: { revalidate: 0 }
    })
    if (!res.ok) {
      return NextResponse.json(
        { error: `Nominatim HTTP ${res.status}` },
        { status: 502 }
      )
    }
    const data = (await res.json()) as Record<string, unknown>
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "reverse geocode failed" },
      { status: 500 }
    )
  }
}
