import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(){

  const { data, error } = await supabase
    .from("handover")
    .select(`
      id,
      share_token,
      status,
      sender_name,
      receiver_target_name,
      created_at,
      received_at,
      receipt_url,
      handover_items (
        id,
        description,
        photo_url
      )
    `)
    .order("created_at", { ascending:false })

  if(error){
    return NextResponse.json(
      { error:error.message },
      { status:500 }
    )
  }

  return NextResponse.json({
    success:true,
    handovers:data
  })

}