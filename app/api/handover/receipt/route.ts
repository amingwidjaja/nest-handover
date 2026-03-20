import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(req: Request) {

  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("handover")
    .select(`
      id,
      status,
      sender_name,
      receiver_target_name,
      receipt_url,
      receipt_status,
      handover_items (*),
      receive_event (*)
    `)
    .eq("share_token", token)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  return NextResponse.json(data)
}