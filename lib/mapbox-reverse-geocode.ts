/**
 * Mapbox reverse geocoding (lng,lat order in path).
 * @see https://docs.mapbox.com/api/search/geocoding/#reverse-geocoding
 */
export async function fetchReversePlaceName(
  lat: number,
  lng: number,
  accessToken: string
): Promise<string | null> {
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`
  )
  url.searchParams.set("access_token", accessToken)
  url.searchParams.set("limit", "1")
  url.searchParams.set("language", "id")

  const res = await fetch(url.toString())
  if (!res.ok) return null

  const data = (await res.json()) as {
    features?: Array<{ place_name?: string }>
  }
  const name = data.features?.[0]?.place_name
  return typeof name === "string" && name.trim() ? name.trim() : null
}
