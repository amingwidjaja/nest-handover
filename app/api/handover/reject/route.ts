import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request) {
  try {
    const { token, rejection_reason } = await req.json()

    if (!token) {
      return NextResponse.json({ success: false, error: "invalid payload" }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    const { data: handover, error: fetchErr } = await admin
      .from("handover")
      .select("id, status, user_id, share_token, sender_name, receiver_target_name")
      .eq("share_token", token)
      .single()

    if (fetchErr || !handover) {
      return NextResponse.json({ success: false, error: "handover not found" }, { status: 404 })
    }

    if (handover.status !== "created") {
      return NextResponse.json({ success: false, error: "Paket sudah tidak bisa ditolak" }, { status: 409 })
    }

    const { error: updateErr } = await admin
      .from("handover")
      .update({
        status: "rejected",
        rejection_reason: rejection_reason?.trim() || null,
        rejected_at: new Date().toISOString(),
      })
      .eq("id", handover.id)

    if (updateErr) {
      console.error("[reject] update error:", updateErr)
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 })
    }

    // Notify pengirim via Edge Function (fire-and-forget)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const notifyUrl = supabaseUrl.replace("https://", "https://") + "/functions/v1/notify-handover"
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && serviceKey) {
      fetch(notifyUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          handover_id: handover.id,
          new_status: "rejected",
          rejection_reason: rejection_reason?.trim() || null,
        }),
      }).catch(e => console.warn("[reject] notify error:", e))
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[reject] server error:", err)
    return NextResponse.json({ success: false, error: "server error" }, { status: 500 })
  }
}
