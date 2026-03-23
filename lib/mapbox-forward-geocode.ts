/**
 * Mapbox Geocoding API (v5) via HTTPS — avoids @mapbox/mapbox-sdk subpath/ESM issues on Vercel.
 * @see https://docs.mapbox.com/api/search/geocoding/
 */
export type MapboxGeocodeFeature = {
  id: string
  place_name: string
  center: [number, number]
}

export async function fetchForwardGeocodeSuggestions(
  query: string,
  accessToken: string,
  limit = 5
): Promise<MapboxGeocodeFeature[]> {
  const q = query.trim()
  if (!q || q.length < 2) return []

  const path = encodeURIComponent(q)
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${path}.json`
  )
  url.searchParams.set("access_token", accessToken)
  url.searchParams.set("limit", String(limit))
  url.searchParams.set("autocomplete", "true")

  const res = await fetch(url.toString())
  if (!res.ok) return []

  const data = (await res.json()) as {
    features?: Array<{
      id: string
      place_name?: string
      center?: [number, number]
    }>
  }

  const out: MapboxGeocodeFeature[] = []
  for (const f of data.features || []) {
    if (!f.center || f.center.length < 2 || !f.place_name) continue
    out.push({
      id: f.id,
      place_name: f.place_name,
      center: [f.center[0], f.center[1]]
    })
  }
  return out
}
