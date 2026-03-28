import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { getUserFromRequest } from "@/lib/supabase/auth-from-request"

function canAccessHandover(
  row: {
    user_id: string
    org_id: string | null
    staff_id: string | null
  },
  userId: string,
  profile: { org_id: string | null; role: string | null } | null
): boolean {
  if (!profile?.org_id) {
    return row.user_id === userId
  }
  if (profile.role === "OWNER") {
    return row.org_id === profile.org_id
  }
  return row.org_id === profile.org_id && row.staff_id === userId
}

export async function PATCH(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: "invalid json" }, { status: 400 })
  }

  const handoverId = String(body.handover_id ?? "").trim()
  if (!handoverId) {
    return NextResponse.json({ success: false, error: "handover_id required" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  const { data: profile } = await admin
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .maybeSingle()

  const { data: row, error: fetchErr } = await admin
    .from("handover")
    .select("id, user_id, org_id, staff_id, status")
    .eq("id", handoverId)
    .maybeSingle()

  if (fetchErr || !row) {
    return NextResponse.json({ success: false, error: "Paket tidak ditemukan" }, { status: 404 })
  }

  if (row.status !== "created") {
    return NextResponse.json(
      { success: false, error: "Paket ini tidak lagi dapat diubah dari formulir." },
      { status: 409 }
    )
  }

  if (!canAccessHandover(row, user.id, profile)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const {
    sender_name,
    receiver_target_name,
    receiver_target_phone,
    receiver_whatsapp,
    receiver_email,
    receiver_target_email,
    destination_lat,
    destination_lng,
    destination_address,
    destination_district,
    destination_city,
    destination_postal_code,
    items
  } = body

  const wa = String(receiver_whatsapp ?? receiver_target_phone ?? "").trim()
  const em = String(receiver_email ?? receiver_target_email ?? "").trim()

  const updateRow: Record<string, unknown> = {
    sender_name: String(sender_name ?? ""),
    receiver_target_name: String(receiver_target_name ?? ""),
    receiver_target_phone: wa || String(receiver_target_phone ?? ""),
    receiver_whatsapp: wa,
    receiver_contact: wa,
    receiver_email: em,
    receiver_target_email: em
  }

  if (destination_address !== undefined && destination_address !== null) {
    updateRow.destination_address = String(destination_address)
  }
  if (destination_lat !== undefined && destination_lat !== null && destination_lat !== "") {
    updateRow.destination_lat = destination_lat
  }
  if (destination_lng !== undefined && destination_lng !== null && destination_lng !== "") {
    updateRow.destination_lng = destination_lng
  }
  if (destination_district !== undefined && destination_district !== null) {
    const t = String(destination_district).trim()
    updateRow.destination_district = t || null
  }
  if (destination_city !== undefined && destination_city !== null) {
    const t = String(destination_city).trim()
    updateRow.destination_city = t || null
  }
  if (destination_postal_code !== undefined && destination_postal_code !== null) {
    const t = String(destination_postal_code).trim()
    updateRow.destination_postal_code = t || null
  }

  const { error: upErr } = await admin.from("handover").update(updateRow).eq("id", handoverId)

  if (upErr) {
    return NextResponse.json({ success: false, error: upErr.message }, { status: 500 })
  }

  const { data: serialRow } = await admin
    .from("handover")
    .select("serial_number")
    .eq("id", handoverId)
    .maybeSingle()

  if (items !== undefined && Array.isArray(items)) {
    const { error: delErr } = await admin
      .from("handover_items")
      .delete()
      .eq("handover_id", handoverId)

    if (delErr) {
      return NextResponse.json({ success: false, error: delErr.message }, { status: 500 })
    }

    const rows = (items as { description?: string; photo_url?: string | null }[])
      .map((item) => ({
        handover_id: handoverId,
        description: String(item.description ?? ""),
        photo_url: item.photo_url ?? null
      }))
      .filter((r) => r.description.trim().length > 0)

    if (rows.length > 0) {
      const { error: insErr } = await admin.from("handover_items").insert(rows)
      if (insErr) {
        return NextResponse.json({ success: false, error: insErr.message }, { status: 500 })
      }
    }
  }

  return NextResponse.json({
    success: true,
    handover_id: handoverId,
    serial_number: serialRow?.serial_number ?? null
  })
}
