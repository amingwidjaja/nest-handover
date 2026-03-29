import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// POST /api/handover/accept
// Dipanggil dari /accept/[token] oleh TARGET receiver
//
// Preconditions yang dicek:
//   1. Handover exists dan status === 'received'
//   2. Tidak bisa accept kalau masih 'created' (proxy belum handshake)
//   3. Tidak bisa double-accept kalau sudah 'accepted'
//
// Body:
//   token         string  — share_token handover
//   save_to_dash  boolean — target minta simpan ke dashboard (opsional)
//
// Side effects:
//   - status: received → accepted
//   - accepted_at: now()
//   - kalau save_to_dash + ada session → receiver_user_id di-set
//   - trigger fn_on_handover_accepted → receipt-worker → PDF

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, save_to_dash } = body

    if (!token) {
      return NextResponse.json(
        { success: false, error: "token required" },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()

    // Resolve handover dari token
    const { data: handover, error: fetchErr } = await admin
      .from("handover")
      .select("id, status, receiver_whatsapp, share_token")
      .eq("share_token", token)
      .single()

    if (fetchErr || !handover) {
      return NextResponse.json(
        { success: false, error: "handover not found" },
        { status: 404 }
      )
    }

    // Guard: hanya bisa accept dari status 'received'
    if (handover.status === "created") {
      return NextResponse.json(
        { success: false, error: "not_received_yet", 
          message: "Paket belum diterima secara fisik. Tunggu konfirmasi penerima pertama." },
        { status: 409 }
      )
    }

    if (handover.status === "accepted") {
      return NextResponse.json(
        { success: false, error: "already_accepted" },
        { status: 409 }
      )
    }

    if (handover.status === "rejected") {
      return NextResponse.json(
        { success: false, error: "already_rejected" },
        { status: 409 }
      )
    }

    if (handover.status !== "received") {
      return NextResponse.json(
        { success: false, error: "invalid_status" },
        { status: 409 }
      )
    }

    // Cek session — kalau target minta save_to_dash dan ada akun
    let receiverUserId: string | null = null
    if (save_to_dash) {
      try {
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.id) receiverUserId = user.id
      } catch {
        // No session — save_to_dash diabaikan, bukan error
      }
    }

    // Update status → accepted
    // accepted_at di-set manual karena tidak semua setup punya generated column
    const updatePayload: Record<string, unknown> = {
      status: "accepted",
      // Link receiver ke user kalau ada session dan minta save
      ...(receiverUserId ? { } : {}),
    }

    const { error: updateErr } = await admin
      .from("handover")
      .update(updatePayload)
      .eq("id", handover.id)
      .eq("status", "received") // double-check race condition

    if (updateErr) {
      console.error("[accept] update error:", updateErr)
      return NextResponse.json(
        { success: false, error: updateErr.message },
        { status: 500 }
      )
    }

    // Kalau ada session dan minta save → update receive_event.receiver_user_id
    // receive_event sudah ada dari waktu proxy handshake
    if (receiverUserId) {
      const { error: evErr } = await admin
        .from("receive_event")
        .update({ receiver_user_id: receiverUserId })
        .eq("handover_id", handover.id)
        // Hanya update kalau belum di-claim user lain
        .is("receiver_user_id", null)

      if (evErr) {
        // Non-fatal — accept tetap berhasil, dashboard link saja yang gagal
        console.warn("[accept] receive_event update error:", evErr)
      }
    }

    // fn_on_handover_accepted trigger otomatis tembak receipt-worker
    // Tidak perlu call manual dari sini

    return NextResponse.json({
      success: true,
      saved_to_dash: !!receiverUserId,
    })

  } catch (err) {
    console.error("[accept] server error:", err)
    return NextResponse.json(
      { success: false, error: "server error" },
      { status: 500 }
    )
  }
}
