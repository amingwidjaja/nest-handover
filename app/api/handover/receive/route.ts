import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request){

  try{

    const body = await req.json()

    console.log("receive body:", body)

    const {
      handover_id,
      receiver_name,
      receiver_relation,
      receive_method
    } = body

    const { error } = await supabase
      .from("receive_event")
      .insert({
        handover_id,
        receiver_name,
        receiver_relation,
        receive_method,
        timestamp: new Date().toISOString()
      })

    if(error){

      return NextResponse.json(
        { success:false, error:error.message },
        { status:500 }
      )

    }

    await supabase
      .from("handover")
      .update({
        status:"received"
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