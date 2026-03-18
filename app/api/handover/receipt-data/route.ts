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

    const { data, error } = await supabase
      .from("handover")
      .select(`
        id,
        sender_name,
        receiver_target_name,
        status,
        handover_items (*),
        receive_event (*)
      `)
      .eq("share_token", token)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "data tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json(data)

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}