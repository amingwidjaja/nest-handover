import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(req: Request){

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if(!id){
    return NextResponse.json(
      { error:"missing id" },
      { status:400 }
    )
  }

  const { data, error } = await supabase
    .from("handover")
    .select("share_token")
    .eq("id",id)
    .single()

  if(error){
    return NextResponse.json(
      { error:error.message },
      { status:500 }
    )
  }

  return NextResponse.json({
    share_token:data.share_token
  })

}