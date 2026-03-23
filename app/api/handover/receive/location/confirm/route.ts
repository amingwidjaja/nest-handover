import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

const MAX_RADIUS = 100

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3
  const φ1 = lat1 * (Math.PI / 180)
  const φ2 = lat2 * (Math.PI / 180)
  const Δφ = (lat2 - lat1) * (Math.PI / 180)
  const Δλ = (lon2 - lon1) * (Math.PI / 180)

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

function parseCoord(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { accuracy, handover_id } = body

    const lat = parseCoord(body.lat)
    const lng = parseCoord(body.lng)

    if (lat == null || lng == null || handover_id === undefined || handover_id === null || handover_id === "") {
      return NextResponse.json({ error: "Data koordinat atau ID tidak lengkap" }, { status: 400 })
    }

    const { data: handover, error: handoverErr } = await supabase
      .from("handover")
      .select("destination_lat, destination_lng")
      .eq("id", handover_id)
      .maybeSingle()

    if (handoverErr) {
      console.error("Supabase select handover:", handoverErr)
      throw new Error(`Database Error: ${handoverErr.message}`)
    }

    if (!handover) {
      return NextResponse.json({ error: "Handover tidak ditemukan" }, { status: 404 })
    }

    const destLat = parseCoord(handover.destination_lat)
    const destLng = parseCoord(handover.destination_lng)

    if (destLat == null || destLng == null) {
      return NextResponse.json(
        { error: "Lokasi tujuan belum diatur", success: false, isValid: false },
        { status: 400 }
      )
    }

    let address = ""
    try {
      const geo = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
      )
      const geoData = await geo.json()
      address = geoData.features?.[0]?.place_name || "Alamat tidak ditemukan"
    } catch {
      address = "Gagal mengambil alamat"
    }

    const distance = getDistance(lat, lng, destLat, destLng)
    const isValid = distance <= MAX_RADIUS

    const acc = typeof accuracy === "number" && Number.isFinite(accuracy) ? accuracy : Number(accuracy) || 0
    const distanceRounded = Math.round(distance)

    const gpsPayload = {
      gps_lat: lat,
      gps_lng: lng,
      gps_accuracy: acc,
      address,
      distance_m: distanceRounded,
      is_valid: isValid
    }

    const { data: existing, error: selErr } = await supabase
      .from("receive_event")
      .select("id")
      .eq("handover_id", handover_id)
      .maybeSingle()

    if (selErr) {
      console.error("Supabase select receive_event:", selErr)
      throw new Error(`Database Error: ${selErr.message}`)
    }

    if (existing) {
      const { error } = await supabase
        .from("receive_event")
        .update(gpsPayload)
        .eq("handover_id", handover_id)

      if (error) {
        console.error("Supabase Error detail:", error)
        throw new Error(`Database Error: ${error.message}`)
      }
    } else {
      const { error } = await supabase
        .from("receive_event")
        .insert({
          handover_id,
          receive_method: "GPS",
          receiver_type: "direct",
          receiver_name: null,
          receiver_relation: null,
          ...gpsPayload
        })

      if (error) {
        console.error("Supabase Error detail:", error)
        throw new Error(`Database Error: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      address,
      distance: distanceRounded,
      isValid
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error"
    console.error("Server Error detail:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
