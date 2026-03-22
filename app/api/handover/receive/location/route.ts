import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request){

  try{

    const body = await req.json()

    const {
      handover_id,
      gps_lat,
      gps_lng,
      gps_accuracy
    } = body

    if(!handover_id){
      return NextResponse.json({
        success:false,
        error:"invalid payload"
      })
    }

    const admin = getSupabaseAdmin()

    const { error } = await admin
      .from("receive_event")
      .update({
        gps_lat,
        gps_lng,
        gps_accuracy
      })
      .eq("handover_id", handover_id)

    if(error){
      console.log(error)
      return NextResponse.json({
        success:false,
        error:error.message
      })
    }

    return NextResponse.json({ success:true })

  }catch(err){
    console.log(err)
    return NextResponse.json({
      success:false,
      error:"server error"
    })
  }
}