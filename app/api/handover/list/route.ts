import { NextResponse } from "next/server"
import { supabase } from "../../lib/supabase"

export async function GET() {

  const { data, error } = await supabase
    .from("handover")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json(data)

}