import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request){

  try{

    const body = await req.json()

    const {
      handover_id,
      receive_method,
      receiver_name,
      receiver_relation,
      gps_lat,
      gps_lng,
      gps_accuracy,
      photo_url
    } = body

    if(!handover_id || !photo_url){
      return NextResponse.json({ success:false, error:"invalid payload" })
    }

    const admin = getSupabaseAdmin()

    await admin.from("receive_event").insert({
      handover_id,
      receive_method,
      receiver_name,
      receiver_relation,
      gps_lat,
      gps_lng,
      gps_accuracy,
      photo_url
    })

    await admin
      .from("handover")
      .update({
        status: "received",
        received_at: new Date().toISOString()
      })
      .eq("id", handover_id)

    return NextResponse.json({ success:true })

  }catch(err){
    console.log(err)
    return NextResponse.json({ success:false, error:"server error" })
  }
}