import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(req:Request){

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if(!id){
    return NextResponse.json({ error:"id required" },{ status:400 })
  }

  const { data:handover } = await supabase
    .from("handover")
    .select("*")
    .eq("id",id)
    .single()

  const { data:items } = await supabase
    .from("handover_items")
    .select("*")
    .eq("handover_id",id)

  const { data:receive_event } = await supabase
    .from("receive_event")
    .select("*")
    .eq("handover_id",id)
    .single()

  return NextResponse.json({
    handover,
    items,
    receive_event
  })

}