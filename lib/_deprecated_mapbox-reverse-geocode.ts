/**
 * Mapbox reverse geocoding — parse `context` for district / city / postal (Indonesia-friendly).
 * @see https://docs.mapbox.com/api/search/geocoding/#reverse-geocoding
 */

type MapboxContextEntry = { id?: string; text?: string }

export type ReverseAddressParts = {
  /** Jalan + nomor (best effort from feature) */
  streetLine: string
  /** Kecamatan / kelurahan (district → locality → neighborhood) */
  district: string
  /** Kota / kabupaten */
  city: string
  postalCode: string
  /** Full Mapbox place_name (fallback / audit) */
  fullPlaceName: string
}

type MapboxReverseFeature = {
  id?: string
  place_name?: string
  text?: string
  place_type?: string[]
  context?: MapboxContextEntry[]
}

function contextByPrefix(
  context: MapboxContextEntry[] | undefined,
  prefix: string
): string {
  if (!context?.length) return ""
  for (const e of context) {
    const id = e.id ?? ""
    if (id.startsWith(prefix) && e.text?.trim()) return e.text.trim()
  }
  return ""
}

/** Kecamatan/Kelurahan: prefer district, then locality, then neighborhood */
function pickDistrict(ctx: MapboxContextEntry[] | undefined): string {
  return (
    contextByPrefix(ctx, "district") ||
    contextByPrefix(ctx, "locality") ||
    contextByPrefix(ctx, "neighborhood")
  )
}

export function parseReverseFeature(feature: MapboxReverseFeature): ReverseAddressParts {
  const full = (feature.place_name || "").trim()
  const ctx = feature.context
  const city = contextByPrefix(ctx, "place")
  const postalCode = contextByPrefix(ctx, "postcode")
  const district = pickDistrict(ctx)

  const ptype = feature.place_type || []
  let streetLine = ""
  if (
    (ptype.includes("address") || ptype.includes("poi")) &&
    feature.text?.trim()
  ) {
    streetLine = feature.text.trim()
  } else if (full) {
    const comma = full.indexOf(",")
    streetLine = (comma > 0 ? full.slice(0, comma) : full).trim()
  }

  return {
    streetLine,
    district,
    city,
    postalCode,
    fullPlaceName: full
  }
}

export async function fetchReverseAddressParts(
  lat: number,
  lng: number,
  accessToken: string
): Promise<ReverseAddressParts | null> {
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`
  )
  url.searchParams.set("access_token", accessToken)
  url.searchParams.set("limit", "1")
  url.searchParams.set("language", "id")
  url.searchParams.set("country", "id")

  const res = await fetch(url.toString())
  if (!res.ok) return null

  const data = (await res.json()) as {
    features?: MapboxReverseFeature[]
  }
  const f = data.features?.[0]
  if (!f) return null
  return parseReverseFeature(f)
}

/** @deprecated use fetchReverseAddressParts */
export async function fetchReversePlaceName(
  lat: number,
  lng: number,
  accessToken: string
): Promise<string | null> {
  const parts = await fetchReverseAddressParts(lat, lng, accessToken)
  return parts?.fullPlaceName ?? null
}
