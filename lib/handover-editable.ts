import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { resolveNestEvidencePublicUrl } from "@/lib/nest-evidence-upload"
import type { HandoverCreateInitialData } from "@/lib/handover-editable-types"

type ProfileRow = {
  org_id: string | null
  role: string | null
  display_name?: string | null
  company_name?: string | null
}

function canAccessHandover(
  row: {
    user_id: string
    org_id: string | null
    staff_id: string | null
  },
  userId: string,
  profile: ProfileRow | null
): boolean {
  if (!profile?.org_id) {
    return row.user_id === userId
  }
  if (profile.role === "OWNER") {
    return row.org_id === profile.org_id
  }
  return (
    row.org_id === profile.org_id &&
    row.staff_id === userId
  )
}

/**
 * Loads a handover the current user may continue editing (status `created` only).
 * Used by the create page (server) and GET /api/handover/editable.
 */
export async function loadHandoverEditableForPage(
  id: string | null | undefined
): Promise<HandoverCreateInitialData | null> {
  const trimmed = id?.trim()
  if (!trimmed) return null

  const supabase = await createServerSupabaseClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  const admin = getSupabaseAdmin()
  const { data: profile } = await admin
    .from("profiles")
    .select("org_id, role, display_name, company_name")
    .eq("id", user.id)
    .maybeSingle()

  const { data: row, error } = await admin
    .from("handover")
    .select(
      `
      id,
      user_id,
      org_id,
      staff_id,
      status,
      serial_number,
      sender_name,
      receiver_target_name,
      receiver_whatsapp,
      receiver_contact,
      receiver_email,
      receiver_target_phone,
      receiver_target_email,
      destination_address,
      destination_city,
      destination_postal_code,
      destination_lat,
      destination_lng
    `
    )
    .eq("id", trimmed)
    .maybeSingle()

  if (error || !row) return null
  if (row.status !== "created") return null
  if (!canAccessHandover(row, user.id, profile)) return null

  const { data: itemRows } = await admin
    .from("handover_items")
    .select("description, photo_url")
    .eq("handover_id", trimmed)
    .order("id", { ascending: true })

  const items = (itemRows ?? []).map((r) => ({
    description: String(r.description ?? ""),
    photo_url: r.photo_url ?? null
  }))

  const addr = String(row.destination_address ?? "").trim()
  const mode: "lite" | "pro" = addr.length > 0 ? "pro" : "lite"

  const wa =
    String(row.receiver_whatsapp ?? row.receiver_contact ?? row.receiver_target_phone ?? "").trim()
  const em = String(row.receiver_email ?? row.receiver_target_email ?? "").trim()
  const receiverName = String(row.receiver_target_name ?? "").trim()
  const senderName = String(row.sender_name ?? "").trim()

  const dn =
    (profile?.display_name && String(profile.display_name).trim()) ||
    (profile?.company_name && String(profile.company_name).trim()) ||
    ""
  const senderType: "self" | "other" =
    senderName && dn && senderName !== dn ? "other" : "self"

  let destLat =
    row.destination_lat != null && row.destination_lat !== ""
      ? Number(row.destination_lat)
      : null
  let destLng =
    row.destination_lng != null && row.destination_lng !== ""
      ? Number(row.destination_lng)
      : null
  if (destLat !== null && !Number.isFinite(destLat)) destLat = null
  if (destLng !== null && !Number.isFinite(destLng)) destLng = null

  const firstPhoto = items[0]?.photo_url ?? null
  const firstItemPhotoPublicUrl = firstPhoto
    ? resolveNestEvidencePublicUrl(firstPhoto)
    : null

  const serial =
    row.serial_number != null && String(row.serial_number).trim()
      ? String(row.serial_number).trim()
      : null

  return {
    handoverId: row.id,
    serialNumber: serial,
    mode,
    senderName,
    senderType,
    senderContact: "",
    receiverName,
    receiverWhatsapp: wa,
    receiverEmail: em,
    destinationAddress: addr,
    destinationCity: String(row.destination_city ?? "").trim(),
    destinationPostalCode: String(row.destination_postal_code ?? "").trim(),
    destinationLat: destLat,
    destinationLng: destLng,
    items,
    firstItemPhotoPublicUrl
  }
}
