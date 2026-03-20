import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json(
        { success: false, error: "token wajib" },
        { status: 400 }
      )
    }

    const { data: handover, error } = await supabase
      .from("handover")
      .select(`
        id,
        sender_name,
        receiver_target_name,
        status,
        receipt_url,
        receipt_status,
        handover_items (*)
      `)
      .eq("share_token", token)
      .single()

    if (error || !handover) {
      return NextResponse.json(
        { success: false, error: "data tidak ditemukan" },
        { status: 404 }
      )
    }

    const { data: receive_event } = await supabase
      .from("receive_event")
      .select("*")
      .eq("handover_id", handover.id)
      .maybeSingle()

    const payload = {
      ...handover,
      receive_event: receive_event ?? null,
    }

    console.log("[receipt-data] before return", {
      handover_id: handover.id,
      status: handover.status,
      receipt_url: handover.receipt_url,
    })

    return NextResponse.json(payload)

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}