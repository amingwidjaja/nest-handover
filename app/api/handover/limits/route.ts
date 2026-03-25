import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { HANDOVER_ACTIVE_LIMITS } from "@/lib/handover-limits"

/**
 * Active handover quota: org-wide for OWNER, per-staff for STAFF, legacy per-user if no org.
 */
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { authenticated: false, limit: null, used: null, user_type: null },
      { status: 200 }
    )
  }

  const admin = getSupabaseAdmin()

  const { data: profile } = await admin
    .from("profiles")
    .select("user_type, org_id, role")
    .eq("id", user.id)
    .maybeSingle()

  const userType =
    profile?.user_type === "umkm" ? "umkm" : ("personal" as const)
  const limit = HANDOVER_ACTIVE_LIMITS[userType]

  let countQuery = admin
    .from("handover")
    .select("*", { count: "exact", head: true })
    .eq("record_status", "active")

  if (profile?.org_id) {
    if (profile.role === "OWNER") {
      countQuery = countQuery.eq("org_id", profile.org_id)
    } else {
      countQuery = countQuery
        .eq("org_id", profile.org_id)
        .eq("staff_id", user.id)
    }
  } else {
    countQuery = countQuery.eq("user_id", user.id)
  }

  const { count, error } = await countQuery

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const used = count ?? 0

  return NextResponse.json({
    authenticated: true,
    user_type: userType,
    studio_role: profile?.role ?? null,
    org_id: profile?.org_id ?? null,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    at_limit: used >= limit
  })
}
