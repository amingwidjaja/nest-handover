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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReceiveBody

    const token = body.token?.trim()
    const receiver_name = body.receiver_name?.trim() || ""
    const receiver_relation = body.receiver_relation?.trim() || ""
    const receive_method = body.receive_method?.trim() || "qr"
    const receiver_type = body.receiver_type === "direct" ? "direct" : "proxy"

    let handoverId = body.handover_id?.trim() || ""

    // resolve handover_id from token if needed
    if (!handoverId) {
      if (!token) {
        return NextResponse.json(
          { success: false, error: "handover_id atau token wajib ada" },
          { status: 400 }
        )
      }

      const { data: handoverRow, error: handoverLookupError } = await supabase
        .from("handover")
        .select("id,status")
        .eq("share_token", token)
        .single()

      if (handoverLookupError || !handoverRow) {
        return NextResponse.json(
          { success: false, error: "handover tidak ditemukan" },
          { status: 404 }
        )
      }

      handoverId = handoverRow.id
    } else {
      const { data: handoverRow, error: handoverLookupError } = await supabase
        .from("handover")
        .select("id,status")
        .eq("id", handoverId)
        .single()

      if (handoverLookupError || !handoverRow) {
        return NextResponse.json(
          { success: false, error: "handover tidak ditemukan" },
          { status: 404 }
        )
      }
    }

    // insert receive_event only
    const { error: insertError } = await supabase
      .from("receive_event")
      .insert({
        handover_id: handoverId,
        receiver_name,
        receiver_relation,
        receive_method,
        receiver_type,
      })

    // idempotent handling
    if (insertError) {
      const message = insertError.message?.toLowerCase() || ""
      const details = String(insertError.details || "").toLowerCase()

      const looksLikeDuplicate =
        message.includes("duplicate") ||
        message.includes("unique") ||
        details.includes("duplicate") ||
        details.includes("unique")

      if (!looksLikeDuplicate) {
        return NextResponse.json(
          { success: false, error: insertError.message || "gagal simpan penerimaan" },
          { status: 500 }
        )
      }
    }

    // read final state from DB
    const { data: finalHandover, error: finalReadError } = await supabase
      .from("handover")
      .select("id,status,received_at")
      .eq("id", handoverId)
      .single()

    if (finalReadError || !finalHandover) {
      return NextResponse.json(
        { success: false, error: "gagal membaca status handover" },
        { status: 500 }
      )
    }

    // 🔥 trigger pdf generation (ONLY HERE, inside try)
    if (finalHandover.status === "accepted") {
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/handover/generate-receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handover_id: handoverId })
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