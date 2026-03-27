/**
 * Azure Maps Search API — reverse geocoding.
 * Replaces mapbox-reverse-geocode.ts
 * @see https://learn.microsoft.com/en-us/rest/api/maps/search/get-search-address-reverse
 */

export type ReverseAddressParts = {
  streetLine: string
  district: string
  city: string
  postalCode: string
  fullPlaceName: string
}

export async function fetchReverseAddressParts(
  lat: number,
  lng: number,
  accessToken: string
): Promise<ReverseAddressParts | null> {
  const params = new URLSearchParams({
    "api-version": "1.0",
    "subscription-key": accessToken,
    query: `${lat},${lng}`,
    language: "id-ID",
  })

  try {
    const res = await fetch(
      `https://atlas.microsoft.com/search/address/reverse/json?${params}`
    )
    if (!res.ok) return null

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
    if (!addr) return null

    return {
      streetLine: addr.streetNameAndNumber || addr.streetName || "",
      district:   addr.municipalitySubdivision || "",
      city:       addr.municipality || "",
      postalCode: addr.postalCode || "",
      fullPlaceName: addr.freeformAddress || "",
    }
  } catch {
    return null
  }
}
