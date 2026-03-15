import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request){

  const body = await req.json()
  const { ids } = body

  if(!ids || !Array.isArray(ids)){
    return NextResponse.json(
      { error:"ids required" },
      { status:400 }
    )
  }

  const { data:rows, error:checkError } = await supabase
    .from("handover")
    .select("id,status")
    .in("id",ids)

  if(checkError){
    return NextResponse.json(
      { error:checkError.message },
      { status:500 }
    )
  }

  const blocked = rows?.filter(r => r.status === "receiving")

  if(blocked && blocked.length > 0){
    return NextResponse.json(
      { error:"handover sedang dalam proses receive" },
      { status:403 }
    )
  }

  const { error } = await supabase
    .from("handover")
    .delete()
    .in("id",ids)

  if(error){
    return NextResponse.json(
      { error:error.message },
      { status:500 }
    )
  }

  return NextResponse.json({
    success:true
  })

}