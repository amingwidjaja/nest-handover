/**
 * Azure Maps Search API — forward geocoding (autocomplete suggestions).
 * Replaces mapbox-forward-geocode.ts
 * @see https://learn.microsoft.com/en-us/rest/api/maps/search/get-search-fuzzy
 */

export type GeocodeFeature = {
  id: string
  place_name: string
  center: [number, number] // [lng, lat]
  city?: string
  district?: string  // kecamatan / municipalitySubdivision
  postcode?: string
}

export type ForwardGeocodeOptions = {
  limit?: number
  proximity?: { lng: number; lat: number }
}

export async function fetchForwardGeocodeSuggestions(
  query: string,
  accessToken: string,
  options: ForwardGeocodeOptions = {}
): Promise<GeocodeFeature[]> {
  const q = query.trim()
  if (!q || q.length < 2) return []

  const params = new URLSearchParams({
    "api-version": "1.0",
    "subscription-key": accessToken,
    query: q,
    limit: String(options.limit ?? 5),
    countrySet: "ID",
    language: "id-ID",
  })

  if (options.proximity) {
    params.set("lat", String(options.proximity.lat))
    params.set("lon", String(options.proximity.lng))
  }

  try {
    const res = await fetch(
      `https://atlas.microsoft.com/search/fuzzy/json?${params}`
    )
    if (!res.ok) return []

    const data = await res.json() as {
      results?: Array<{
        id: string
        address?: {
          freeformAddress?: string
          municipality?: string
          municipalitySubdivision?: string
          localName?: string
          postalCode?: string
        }
        position?: { lat: number; lon: number }
      }>
    }

    return (data.results ?? [])
      .filter(r => r.position && r.address?.freeformAddress)
      .map(r => {
        const addr = r.address!
        // Azure Maps Indonesia: municipality bisa kosong, coba localName sebagai fallback
        const city = addr.municipality?.trim() || addr.localName?.trim() || ""
        const district = addr.municipalitySubdivision?.trim() || ""
        return {
          id: r.id,
          place_name: addr.freeformAddress!,
          center: [r.position!.lon, r.position!.lat] as [number, number],
          city: city || undefined,
          district: district || undefined,
          postcode: addr.postalCode?.trim() || undefined,
        }
      })
  } catch {
    return []
  }
}
