import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

// GET /api/handover/received
// Ambil semua handover yang pernah diterima oleh user yang login
// Join: receive_event.receiver_user_id = auth.uid()

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    const admin = getSupabaseAdmin()

    const { data, error } = await admin
      .from("receive_event")
      .select(`
        id,
        received_at,
        receiver_name,
        receive_method,
        handover:handover_id (
          id,
          share_token,
          sender_name,
          notes,
          destination_address,
          destination_city,
          created_at,
          handover_items (
            id,
            description,
            photo_url
          )
        )
      `)
      .eq("receiver_user_id", user.id)
      .order("received_at", { ascending: false })

    if (error) {
      console.error("[received] fetch error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ received: data ?? [] })
  } catch (err) {
    console.error("[received] server error:", err)
    return NextResponse.json({ error: "server error" }, { status: 500 })
  }
}
