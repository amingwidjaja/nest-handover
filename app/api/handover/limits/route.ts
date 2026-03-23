import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { HANDOVER_ACTIVE_LIMITS } from "@/lib/handover-limits"

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
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle()

  const userType =
    profile?.user_type === "umkm" ? "umkm" : ("personal" as const)
  const limit = HANDOVER_ACTIVE_LIMITS[userType]

  const { count, error } = await admin
    .from("handover")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("record_status", "active")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const used = count ?? 0

  return NextResponse.json({
    authenticated: true,
    user_type: userType,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    at_limit: used >= limit
  })
}
