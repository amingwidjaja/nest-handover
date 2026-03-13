import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  const body = await req.json()

  const {
    token,
    receiver_name,
    receiver_relation,
    receive_method,
    photo_proof,
    device_id,
    gps_location
  } = body

  const { data: handover } = await supabase
    .from("handover")
    .select("*")
    .eq("share_token", token)
    .single()

  if (!handover) {
    return NextResponse.json(
      { error: "Invalid token" },
      { status: 404 }
    )
  }

  const { error } = await supabase
    .from("receive_event")
    .insert({
      handover_id: handover.id,
      receiver_name,
      receiver_relation,
      receive_method,
      photo_proof,
      device_id,
      gps_location
    })

  if (error) {
    return NextResponse.json(
      { error },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true
  })
}