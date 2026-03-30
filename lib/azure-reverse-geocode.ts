/**
 * Azure Maps Search API — reverse geocoding.
 * @see https://learn.microsoft.com/en-us/rest/api/maps/search/get-search-address-reverse
 *
 * CATATAN municipalitySubdivision:
 * Di Jakarta, Azure Maps mengembalikan "municipalitySubdivision" = "Jakarta Pusat"
 * atau bahkan "DKI Jakarta" — bukan nama kecamatan.
 *
 * Untuk mendapat kecamatan yang benar, kita perlu parse dari freeformAddress.
 * Format freeformAddress Jakarta: "Jl. XX, Kelurahan, Kecamatan, Kota Adm., DKI Jakarta 12345"
 * Kecamatan biasanya ada di segmen ke-3 dari belakang (sebelum kota administratif).
 */

export type ReverseAddressParts = {
  streetLine:    string
  district:      string   // kecamatan/kelurahan yang benar
  city:          string   // kota/kabupaten
  postalCode:    string
  fullPlaceName: string
}

export async function fetchReverseAddressParts(
  lat: number,
  lng: number,
  accessToken: string
): Promise<ReverseAddressParts | null> {
  const params = new URLSearchParams({
    "api-version":      "1.0",
    "subscription-key": accessToken,
    query:              `${lat},${lng}`,
    language:           "id-ID",
  })

  try {
    const res = await fetch(
      `https://atlas.microsoft.com/search/address/reverse/json?${params}`
    )
    if (!res.ok) return null

    const data = await res.json() as {
      addresses?: Array<{
        address?: {
          streetNameAndNumber?:     string
          streetName?:              string
          municipalitySubdivision?: string
          municipality?:            string
          countrySecondarySubdivision?: string
          postalCode?:              string
          freeformAddress?:         string
        }
      }>
    }

    const addr = data.addresses?.[0]?.address
    if (!addr) return null

    const freeform   = addr.freeformAddress || ""
    const streetLine = addr.streetNameAndNumber || addr.streetName || ""
    const postalCode = addr.postalCode || ""

    // Coba ekstrak kecamatan dari freeformAddress
    // Format: "Jl. Budi, Kel. Gambir, Kec. Gambir, Jakarta Pusat, DKI Jakarta 10110"
    // Atau:   "Jl. Budi, Gambir, Jakarta Pusat, DKI Jakarta 10110"
    const district = extractDistrict(freeform, addr.municipalitySubdivision)
    const city     = extractCity(freeform, addr.municipality)

    return {
      streetLine,
      district,
      city,
      postalCode,
      fullPlaceName: freeform,
    }
  } catch {
    return null
  }
}

/**
 * Ekstrak nama kecamatan dari freeformAddress.
 *
 * Logika:
 * 1. Kalau municipalitySubdivision ada dan bukan nama provinsi/kota besar → pakai itu
 * 2. Parse freeformAddress — kecamatan biasanya segmen setelah jalan, sebelum kota
 * 3. Fallback ke string kosong (user isi manual)
 */
function extractDistrict(freeform: string, municipalitySubdivision?: string): string {
  // Daftar nama yang BUKAN kecamatan (provinsi, kota besar, dll)
  const NOT_DISTRICT = [
    "dki jakarta", "jawa barat", "jawa tengah", "jawa timur", "banten",
    "bali", "sumatera", "kalimantan", "sulawesi", "papua",
    "jakarta", "bandung", "surabaya", "medan", "semarang", "makassar",
    "depok", "tangerang", "bekasi", "bogor", "palembang", "denpasar",
    "indonesia",
  ]

  // Kalau municipalitySubdivision ada dan bukan nama provinsi/kota besar → pakai
  if (municipalitySubdivision) {
    const lower = municipalitySubdivision.toLowerCase().trim()
    const isNotDistrict = NOT_DISTRICT.some(n => lower === n || lower.includes(n))
    if (!isNotDistrict && lower.length > 0) {
      return municipalitySubdivision
    }
  }

  // Parse dari freeformAddress
  // Hapus kode pos dari akhir
  const cleaned = freeform.replace(/\s*\d{5}\s*$/, "").trim()
  const parts   = cleaned.split(",").map(p => p.trim()).filter(Boolean)

  // Minimal perlu 3 bagian: [jalan, kecamatan/kel, kota, ...]
  if (parts.length < 3) return ""

  // Cari segmen yang mengandung "kec." atau "kel." → paling akurat
  for (const p of parts) {
    const lower = p.toLowerCase()
    if (lower.startsWith("kec.") || lower.startsWith("kecamatan ") ||
        lower.startsWith("kel.") || lower.startsWith("kelurahan ")) {
      return p
    }
  }

  // Ambil segmen ke-2 (index 1) — biasanya kelurahan/kecamatan
  // Tapi skip kalau itu nama jalan (mengandung "jl." atau "jalan")
  for (let i = 1; i < parts.length - 1; i++) {
    const lower = parts[i].toLowerCase()
    const isStreet   = lower.startsWith("jl.") || lower.startsWith("jalan ") || lower.startsWith("gang ") || lower.startsWith("gg.")
    const isProvince = NOT_DISTRICT.some(n => lower === n || lower.includes(n))
    if (!isStreet && !isProvince) {
      return parts[i]
    }
  }

  return ""
}

/**
 * Ekstrak nama kota dari freeformAddress atau municipality.
 * Prioritaskan municipality dari Azure Maps, tapi bersihkan kalau perlu.
 */
function extractCity(freeform: string, municipality?: string): string {
  if (municipality) {
    // Bersihkan "Kota Administrasi " prefix
    return municipality
      .replace(/^Kota Administrasi\s+/i, "Kota ")
      .replace(/^Kabupaten Administrasi\s+/i, "Kabupaten ")
      .trim()
  }

  // Fallback: ambil segmen ke-2 dari belakang (biasanya kota)
  const cleaned = freeform.replace(/\s*\d{5}\s*$/, "").trim()
  const parts   = cleaned.split(",").map(p => p.trim()).filter(Boolean)
  if (parts.length >= 2) {
    return parts[parts.length - 2] || parts[parts.length - 1] || ""
  }

  return freeform
}
