import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

/**
 * Returns handovers visible to the current user:
 * — Legacy (no org): rows owned by user_id.
 * — OWNER: all handovers for org_id.
 * — STAFF: handovers created by this user within org_id.
 */
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

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
    .select(
      `
      id,
      share_token,
      status,
      sender_name,
      receiver_target_name,
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
    `
    )
    .order("created_at", { ascending: false })

  if (profile?.org_id) {
    if (profile.role === "OWNER") {
      q = q.eq("org_id", profile.org_id)
    } else {
      q = q.eq("org_id", profile.org_id).eq("staff_id", user.id)
    }
  } else {
    q = q.eq("user_id", user.id)
  }

  const { data, error } = await q

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

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
      staff_display_name: h.staff_id
        ? staffMap.get(h.staff_id) ?? null
        : null
    })
  )

  return NextResponse.json({
    success: true,
    handovers
  })
}
