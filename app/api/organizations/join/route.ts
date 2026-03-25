import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

/**
 * Joins an existing organization as STAFF using invite_code.
 */
export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const raw =
    typeof body.invite_code === "string" ? body.invite_code.trim() : ""
  const invite_code = raw.toUpperCase().replace(/\s/g, "")
  if (invite_code.length < 6) {
    return NextResponse.json({ error: "Kode undangan tidak valid." }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const { data: profile } = await admin
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.org_id) {
    return NextResponse.json(
      { error: "Akun sudah tergabung di sebuah studio." },
      { status: 409 }
    )
  }

  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .select("id, name, invite_code")
    .eq("invite_code", invite_code)
    .maybeSingle()

  if (orgErr) {
    return NextResponse.json({ error: orgErr.message }, { status: 500 })
  }
  if (!org) {
    return NextResponse.json(
      { error: "Kode undangan tidak ditemukan." },
      { status: 404 }
    )
  }

  const { error: upErr } = await admin
    .from("profiles")
    .update({
      org_id: org.id,
      role: "STAFF",
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id)

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 })
  }

  console.log(
    `[NEST76 STUDIO] User ${user.id} joined org ${org.id} as STAFF`
  )

  return NextResponse.json({
    success: true,
    organization: { id: org.id, name: org.name }
  })
}
