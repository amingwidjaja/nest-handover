/**
 * Mapbox Geocoding API (v5) via HTTPS — avoids @mapbox/mapbox-sdk subpath/ESM issues on Vercel.
 * @see https://docs.mapbox.com/api/search/geocoding/
 */
export type MapboxGeocodeFeature = {
  id: string
  place_name: string
  center: [number, number]
  /** From `context`: `place` (or `locality` fallback), kota/kabupaten. */
  city?: string
  /** From `context` entry with id prefix `postcode`. */
  postcode?: string
}

export type ForwardGeocodeOptions = {
  limit?: number
  /**
   * Prefer results near this point. Mapbox expects `proximity` as `longitude,latitude`.
   */
  proximity?: { lng: number; lat: number }
}

type MapboxContextEntry = {
  id?: string
  text?: string
}

/**
 * Mapbox encodes hierarchy in `context`: ids like `place.xxx`, `postcode.xxx`.
 */
export function cityAndPostcodeFromContext(
  context: MapboxContextEntry[] | undefined
): { city?: string; postcode?: string } {
  if (!context?.length) return {}
  let city: string | undefined
  let locality: string | undefined
  let postcode: string | undefined
  for (const entry of context) {
    const id = entry.id ?? ""
    if (!postcode && id.startsWith("postcode") && entry.text) {
      postcode = entry.text.trim()
    }
    if (!city && id.startsWith("place") && entry.text) {
      city = entry.text.trim()
    }
    if (!locality && id.startsWith("locality") && entry.text) {
      locality = entry.text.trim()
    }
  }
  return { city: city ?? locality, postcode }
}

export async function fetchForwardGeocodeSuggestions(
  query: string,
  accessToken: string,
  options: ForwardGeocodeOptions = {}
): Promise<MapboxGeocodeFeature[]> {
  const q = query.trim()
  if (!q || q.length < 2) return []

  const limit = options.limit ?? 5

  const path = encodeURIComponent(q)
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${path}.json`
  )
  url.searchParams.set("access_token", accessToken)
  url.searchParams.set("limit", String(limit))
  url.searchParams.set("autocomplete", "true")

  url.searchParams.set("country", "id")
  url.searchParams.set("types", "address,poi,place")
  url.searchParams.set("language", "id")

  const prox = options.proximity
  if (
    prox &&
    Number.isFinite(prox.lng) &&
    Number.isFinite(prox.lat)
  ) {
    url.searchParams.set("proximity", `${prox.lng},${prox.lat}`)
  }

  const res = await fetch(url.toString())
  if (!res.ok) return []

  const data = (await res.json()) as {
    features?: Array<{
      id: string
      place_name?: string
      center?: [number, number]
      context?: MapboxContextEntry[]
    }>
  }

  const out: MapboxGeocodeFeature[] = []
  for (const f of data.features || []) {
    if (!f.center || f.center.length < 2 || !f.place_name) continue
    const { city, postcode } = cityAndPostcodeFromContext(f.context)
    const row: MapboxGeocodeFeature = {
      id: f.id,
      place_name: f.place_name,
      center: [f.center[0], f.center[1]]
    }
    if (city) row.city = city
    if (postcode) row.postcode = postcode
    out.push(row)
  }
  return out
}
