import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request){

  try{

    const body = await req.json()

    const {
      token,
      handover_id,
      receiver_name,
      receiver_relation,
      receive_method,
      receiver_type // 🔥 NEW
    } = body

    let finalHandoverId = handover_id

    if(!finalHandoverId && token){

      const { data:handover, error:findError } = await supabase
        .from("handover")
        .select("id")
        .eq("share_token",token)
        .single()

      if(findError || !handover){
        return NextResponse.json(
          { success:false, error:"handover tidak ditemukan" },
          { status:404 }
        )
      }

      finalHandoverId = handover.id

    }

    if(!finalHandoverId){
      return NextResponse.json(
        { success:false, error:"handover_id atau token wajib ada" },
        { status:400 }
      )
    }

    // 🔥 determine status
    const finalStatus = receiver_type === "direct"
      ? "accepted"
      : "received"

    // 🔥 insert event
    const { error:insertError } = await supabase
      .from("receive_event")
      .insert({
        handover_id: finalHandoverId,
        receiver_name,
        receiver_relation,
        receive_method,
        receiver_type,
        timestamp: new Date().toISOString()
      })

    if(insertError){
      return NextResponse.json(
        { success:false, error:insertError.message },
        { status:500 }
      )
    }

    // 🔥 update handover
    const { error:updateError } = await supabase
      .from("handover")
      .update({
        status: finalStatus,
        received_at: new Date().toISOString()
      })
      .eq("id",finalHandoverId)

    if(updateError){
      return NextResponse.json(
        { success:false, error:updateError.message },
        { status:500 }
      )
    }

    return NextResponse.json({
      success:true,
      status: finalStatus
    })

  }catch{

    return NextResponse.json(
      { success:false, error:"request gagal" },
      { status:400 }
    )

  }

}