/**
 * Extract street / city / postcode from Nominatim reverse JSON.
 */
export type ReverseGeocodeFields = {
  addressLine: string
  city: string
  postalCode: string
}

export function parseNominatimReverse(
  data: Record<string, unknown> | null
): ReverseGeocodeFields | null {
  if (!data) return null
  const addr = data.address as Record<string, string> | undefined
  if (!addr) {
    const dn = typeof data.display_name === "string" ? data.display_name.trim() : ""
    return dn ? { addressLine: dn, city: "", postalCode: "" } : null
  }

  const parts: string[] = []
  const road = addr.road || addr.pedestrian || addr.path || ""
  const house = addr.house_number || ""
  if (road) {
    parts.push(house ? `${road} No. ${house}` : road)
  } else if (house) {
    parts.push(house)
  }
  const suburb = addr.suburb || addr.neighbourhood || addr.quarter || ""
  if (suburb) parts.push(suburb)

  const city =
    addr.city ||
    addr.town ||
    addr.municipality ||
    addr.village ||
    addr.county ||
    addr.state_district ||
    ""

  const postalCode = addr.postcode || ""

  const addressLine =
    parts.join(", ").trim() ||
    (typeof data.display_name === "string"
      ? data.display_name.split(",").slice(0, 2).join(",").trim()
      : "")

  return {
    addressLine: addressLine || (typeof data.display_name === "string" ? data.display_name : ""),
    city: String(city).trim(),
    postalCode: String(postalCode).trim()
  }
}
