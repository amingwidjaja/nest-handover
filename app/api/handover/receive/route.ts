import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import {
  notifyReceiver,
  notifySenderProxy
} from "@/lib/whatsapp"

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
      device_id,
      device_model
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

    // Resolve handover_id from token if needed
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

    // Fetch handover data for WA notification
    const { data: handover, error: fetchErr } = await admin
      .from("handover")
      .select(`
        id,
        share_token,
        sender_name,
        receiver_whatsapp,
        receiver_target_name,
        is_sender_proxy,
        sender_whatsapp,
        org_id,
        profiles:user_id (
          company_name
        )
      `)
      .eq("id", handover_id)
      .single()

    if (fetchErr || !handover) {
      return NextResponse.json(
        { success: false, error: "handover not found" },
        { status: 404 }
      )
    }

    // Insert receive_event — DB trigger will update handover.status
    const insertPayload: Record<string, unknown> = {
      handover_id,
      receive_method,
      receiver_type,
      receiver_name: receiver_name ?? null,
      receiver_relation: receiver_relation ?? null,
      device_id: device_id ?? null,
      device_model: device_model ?? null
    }

    if (photo_url) {
      insertPayload.photo_url = photo_url
    }

    const { error: insertErr } = await admin
      .from("receive_event")
      .insert(insertPayload)

    if (insertErr) {
      console.error("[receive] INSERT ERROR:", insertErr)
      return NextResponse.json({
        success: false,
        error: insertErr.message
      })
    }

    // === WA NOTIFICATIONS (fire-and-forget — non-blocking) ===
    // Derive base URL from request
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      || `https://${req.headers.get("host") || "nest76.com"}`

    const senderLabel =
      (handover as any).profiles?.company_name?.trim() ||
      handover.sender_name?.trim() ||
      "NEST76 STUDIO"

    const shareToken = handover.share_token

    // 1. Always notify receiver target
    const receiverPhone = handover.receiver_whatsapp
    if (receiverPhone && shareToken) {
      notifyReceiver({
        to: receiverPhone,
        senderLabel,
        shareToken,
        baseUrl
      }).then((res) => {
        if (!res.ok) console.warn("[WA] notifyReceiver failed:", res.error)
      }).catch((e) => console.warn("[WA] notifyReceiver exception:", e))
    }

    // 2. Notify original sender only if user is proxy sender
    if (handover.is_sender_proxy && handover.sender_whatsapp && shareToken) {
      const receivedByName =
        receiver_type === "proxy"
          ? (receiver_name?.trim() || "seseorang")
          : (handover.receiver_target_name?.trim() || "penerima")

      notifySenderProxy({
        to: handover.sender_whatsapp,
        senderLabel,
        receiverName: receivedByName,
        shareToken,
        baseUrl
      }).then((res) => {
        if (!res.ok) console.warn("[WA] notifySenderProxy failed:", res.error)
      }).catch((e) => console.warn("[WA] notifySenderProxy exception:", e))
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[receive] server error:", err)
    return NextResponse.json({
      success: false,
      error: "server error"
    })
  }
}
