import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

type ReceiveBody = {
  handover_id?: string
  token?: string
  receiver_name?: string
  receiver_relation?: string
  receive_method?: string
  receiver_type?: "direct" | "proxy"
}

const ALLOWED_METHODS = [
  "direct_qr",
  "direct_photo",
  "proxy_qr",
  "proxy_photo",
]

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReceiveBody

    const token = body.token?.trim()
    const receiver_name = body.receiver_name?.trim() || ""
    const receiver_relation = body.receiver_relation?.trim() || ""

    if (!body.receive_method || !ALLOWED_METHODS.includes(body.receive_method)) {
      return NextResponse.json(
        { success: false, error: "receive_method tidak valid" },
        { status: 400 }
      )
    }

    const receive_method = body.receive_method

    const receiver_type =
      receive_method.startsWith("direct") ? "direct" : "proxy"

    let handoverId = body.handover_id?.trim() || ""

    if (!handoverId) {
      if (!token) {
        return NextResponse.json(
          { success: false, error: "handover_id atau token wajib ada" },
          { status: 400 }
        )
      }

      const { data: handoverRow, error } = await supabase
        .from("handover")
        .select("id,status")
        .eq("share_token", token)
        .single()

      if (error || !handoverRow) {
        return NextResponse.json(
          { success: false, error: "handover tidak ditemukan" },
          { status: 404 }
        )
      }

      handoverId = handoverRow.id
    } else {
      const { data: handoverRow, error } = await supabase
        .from("handover")
        .select("id,status")
        .eq("id", handoverId)
        .single()

      if (error || !handoverRow) {
        return NextResponse.json(
          { success: false, error: "handover tidak ditemukan" },
          { status: 404 }
        )
      }
    }

    const { error: insertError } = await supabase
      .from("receive_event")
      .insert({
        handover_id: handoverId,
        receiver_name,
        receiver_relation,
        receive_method,
        receiver_type,
      })

    if (insertError) {
      const msg = insertError.message?.toLowerCase() || ""

      if (!msg.includes("duplicate") && !msg.includes("unique")) {
        return NextResponse.json(
          { success: false, error: insertError.message },
          { status: 500 }
        )
      }
    }

    const { data: finalHandover, error: finalError } = await supabase
      .from("handover")
      .select("id,status,received_at")
      .eq("id", handoverId)
      .single()

    if (finalError || !finalHandover) {
      return NextResponse.json(
        { success: false, error: "gagal membaca status handover" },
        { status: 500 }
      )
    }

    // ✅ FIX: trigger PDF berdasarkan DB state (status)
    if (finalHandover.status === "accepted") {
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/handover/generate-receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handover_id: handoverId }),
      })
    }

    return NextResponse.json({
      success: true,
      handover_id: finalHandover.id,
      status: finalHandover.status,
      received_at: finalHandover.received_at,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "internal server error"

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}