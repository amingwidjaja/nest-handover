import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      token,
      handover_id: handoverIdFromBody,
      receive_method,
      receiver_type,
      receiver_name,
      receiver_relation,
      photo_url,
      device_id
    } = body

    if (!receive_method || !receiver_type) {
      return NextResponse.json(
        { success: false, error: "invalid payload" },
        { status: 400 }
      )
    }

    if (!handoverIdFromBody && !token) {
      return NextResponse.json(
        { success: false, error: "invalid payload" },
        { status: 400 }
      )
    }

    const needsPhoto =
      receive_method === "direct_photo" || receive_method === "proxy_photo"
    if (needsPhoto && !photo_url) {
      return NextResponse.json(
        { success: false, error: "invalid payload" },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()

    let handover_id: string | undefined = handoverIdFromBody

    if (token) {
      const { data: h, error: hErr } = await admin
        .from("handover")
        .select("id")
        .eq("share_token", token)
        .single()

      if (hErr || !h) {
        return NextResponse.json(
          { success: false, error: "invalid token" },
          { status: 400 }
        )
      }
      handover_id = h.id
    }

    if (!handover_id) {
      return NextResponse.json(
        { success: false, error: "invalid payload" },
        { status: 400 }
      )
    }

    const insertPayload: Record<string, unknown> = {
      handover_id,
      receive_method,
      receiver_type,
      receiver_name: receiver_name ?? null,
      receiver_relation: receiver_relation ?? null,
      device_id: device_id ?? null
    }

    if (photo_url) {
      insertPayload.photo_url = photo_url
    }

    const { error } = await admin.from("receive_event").insert(insertPayload)

    if (error) {
      console.log("INSERT ERROR:", error)
      return NextResponse.json({
        success: false,
        error: error.message
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.log(err)
    return NextResponse.json({
      success: false,
      error: "server error"
    })
  }
}
