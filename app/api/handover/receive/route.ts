import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {

  try {

    const body = await req.json()

    const {
      handover_id,
      receiver_name,
      receiver_relation,
      receive_method,
      photo_proof,
      device_id,
      gps_location
    } = body


    if (!handover_id) {
      return NextResponse.json(
        { error: "handover_id required" },
        { status: 400 }
      )
    }


    // ambil data handover
    const { data: handover, error: fetchError } = await supabase
      .from("handover")
      .select("id, status, expires_at")
      .eq("id", handover_id)
      .single()


    if (fetchError || !handover) {
      return NextResponse.json(
        { error: "handover not found" },
        { status: 404 }
      )
    }


    // cek expire
    if (handover.expires_at && new Date(handover.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "handover expired" },
        { status: 400 }
      )
    }


    // cek sudah diterima
    if (handover.status === "received") {
      return NextResponse.json(
        { error: "handover already received" },
        { status: 400 }
      )
    }


    // insert receive event
    const { data, error } = await supabase
      .from("receive_event")
      .insert({
        handover_id,
        receiver_name,
        receiver_relation,
        receive_method,
        photo_proof,
        device_id,
        gps_location
      })
      .select()
      .single()


    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }


    return NextResponse.json({
      success: true,
      receive_event: data
    })


  } catch {

    return NextResponse.json(
      { error: "invalid request" },
      { status: 400 }
    )

  }

}