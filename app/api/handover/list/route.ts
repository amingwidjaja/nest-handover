import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

/**
 * Visibility rules:
 *
 * Personal / no org:
 *   → WHERE user_id = auth.uid()
 *
 * UMKM NEST-Lite (mode=lite) — isolated per member:
 *   OWNER → WHERE user_id = auth.uid()   (hanya milik boss sendiri)
 *   STAFF → WHERE user_id = auth.uid()   (hanya milik staff ini)
 *
 * UMKM NEST-Pro (mode=pro):
 *   OWNER → WHERE org_id = profile.org_id  (semua transaksi org)
 *   STAFF → WHERE user_id = auth.uid()     (hanya milik staff ini)
 *
 * Mode dibaca dari query param ?mode=lite|pro
 * (dikirim oleh dashboard yang baca dari localStorage)
 */
export async function GET(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Read mode from query param — sent by dashboard
  const url = new URL(req.url)
  const mode = url.searchParams.get("mode") // "lite" | "pro" | null

  const admin = getSupabaseAdmin()
  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .maybeSingle()

  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 })
  }

  let q = admin
    .from("handover")
    .select(`
      id,
      share_token,
      status,
      sender_name,
      receiver_target_name,
      destination_address,
      created_at,
      received_at,
      receipt_url,
      staff_id,
      org_id,
      handover_items (
        id,
        description,
        photo_url
      )
    `)
    .order("created_at", { ascending: false })
    .limit(100)

  const hasOrg = Boolean(profile?.org_id)
  const isOwner = profile?.role === "OWNER"
  const isPro = mode === "pro"

  if (hasOrg && isOwner && isPro) {
    // OWNER + Pro → semua transaksi org
    q = q.eq("org_id", profile!.org_id)
  } else if (hasOrg && !isOwner) {
    // STAFF (Lite or Pro) → hanya milik staff ini dalam org
    q = q.eq("org_id", profile!.org_id).eq("user_id", user.id)
  } else {
    // Personal, OWNER+Lite, atau no org → hanya milik user ini
    q = q.eq("user_id", user.id)
  }

  const { data, error } = await q

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Resolve staff display names for OWNER+Pro team feed
  const staffIds = [
    ...new Set(
      (data ?? [])
        .map((h: { staff_id?: string | null }) => h.staff_id)
        .filter((id): id is string => Boolean(id))
    )
  ]

  const staffMap = new Map<string, string>()
  if (staffIds.length > 0) {
    const { data: profs } = await admin
      .from("profiles")
      .select("id, display_name, company_name")
      .in("id", staffIds)

    for (const p of profs ?? []) {
      const label =
        (p.display_name && String(p.display_name).trim()) ||
        (p.company_name && String(p.company_name).trim()) ||
        "Anggota tim"
      staffMap.set(p.id, label)
    }
  }

  const handovers = (data ?? []).map(
    (h: { staff_id?: string | null; [key: string]: unknown }) => ({
      ...h,
      staff_display_name: h.staff_id ? staffMap.get(h.staff_id) ?? null : null,
    })
  )

  return NextResponse.json({ success: true, handovers })
}
