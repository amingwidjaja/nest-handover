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

    // ✅ STEP 1: ambil handover + items (AMAN)
    const { data: handover, error } = await supabase
      .from("handover")
      .select(`
        id,
        sender_name,
        receiver_target_name,
        status,
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

    // ✅ STEP 2: ambil receive_event (OPTIONAL)
    const { data: receive_event } = await supabase
      .from("receive_event")
      .select("*")
      .eq("handover_id", handover.id)
      .maybeSingle()

    return NextResponse.json({
      ...handover,
      receive_event: receive_event ?? null
    })

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}