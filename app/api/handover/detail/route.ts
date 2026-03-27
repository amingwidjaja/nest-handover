import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  const { data: handover, error } = await admin
    .from("handover")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !handover) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  const { data: items } = await admin
    .from("handover_items")
    .select("*")
    .eq("handover_id", id)

  const { data: receive_event } = await admin
    .from("receive_event")
    .select("*")
    .eq("handover_id", id)
    .maybeSingle()

  return NextResponse.json({
    ...handover,
    handover_items: items || [],
    receive_event: receive_event || null,
  })
}
