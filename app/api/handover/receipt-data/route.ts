import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json(
        { success: false, error: "token wajib" },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()

    const { data: handover, error } = await admin
      .from("handover")
      .select(`
        id,
        user_id,
        serial_number,
        sender_name,
        receiver_target_name,
        destination_address,
        receiver_target_phone,
        receiver_target_email,
        notes,
        receiver_whatsapp,
        receiver_contact,
        receiver_email,
        status,
        received_at,
        receipt_url,
        receipt_status,
        handover_items (*)
      `)
      .eq("share_token", token)
      .single()

    if (error || !handover) {
      return NextResponse.json(
        { success: false, error: "data tidak ditemukan" },
        { status: 404 }
      )
    }

    const { data: receive_event } = await admin
      .from("receive_event")
      .select("*")
      .eq("handover_id", handover.id)
      .maybeSingle()

    const { data: profile } = await admin
      .from("profiles")
      .select("company_name, company_logo_url")
      .eq("id", handover.user_id)
      .maybeSingle()

    const {
      user_id: _uid,
      receiver_target_phone: _rtp,
      receiver_target_email: _rte,
      ...handoverPublic
    } = handover

    const payload = {
      ...handoverPublic,
      receive_event: receive_event ?? null,
      profiles: profile ?? null
    }

    const items = handover.handover_items as
      | Array<{ id?: string; photo_url?: string | null }>
      | null
      | undefined

    console.log("[receipt-data] before return", {
      handover_id: handover.id,
      status: handover.status,
      receipt_url: handover.receipt_url,
      handover_items_photo_urls: items?.map((i) => ({
        id: i.id,
        photo_url: i.photo_url
      }))
    })

    return NextResponse.json(payload)

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}