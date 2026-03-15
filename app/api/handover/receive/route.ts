import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request){

  try{

    const body = await req.json()

    const {
      token,
      receiver_name,
      receiver_relation,
      receive_method
    } = body

    // cari handover dari token
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

    const handover_id = handover.id

    // insert receive event
    const { error:insertError } = await supabase
      .from("receive_event")
      .insert({
        handover_id,
        receiver_name,
        receiver_relation,
        receive_method,
        timestamp: new Date().toISOString()
      })

    if(insertError){
      return NextResponse.json(
        { success:false, error:insertError.message },
        { status:500 }
      )
    }

    // update status handover
    await supabase
      .from("handover")
      .update({
        status:"received",
        received_at:new Date().toISOString()
      })
      .eq("id",handover_id)

    return NextResponse.json({
      success:true
    })

  }catch{

    return NextResponse.json(
      { success:false },
      { status:400 }
    )

  }

}