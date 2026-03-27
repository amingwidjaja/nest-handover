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
      device_model,
      gps_lat,
      gps_lng,
      gps_accuracy,
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

    // Fetch handover — no join, plain query to avoid FK resolution issues
    const { data: handover, error: fetchErr } = await admin
      .from("handover")
      .select(
        "id, user_id, share_token, sender_name, receiver_whatsapp, receiver_target_name, is_sender_proxy, sender_whatsapp, org_id"
      )
      .eq("id", handover_id)
      .single()

    if (fetchErr || !handover) {
      console.error("[receive] handover fetch error:", fetchErr?.message, "id:", handover_id)
      return NextResponse.json(
        { success: false, error: "handover not found" },
        { status: 404 }
      )
    }

    // Fetch sender label from profiles separately
    let companyName: string | null = null
    if (handover.user_id) {
      const { data: profile } = await admin
        .from("profiles")
        .select("company_name")
        .eq("id", handover.user_id)
        .maybeSingle()
      companyName = profile?.company_name ?? null
    }

    // Build receive_event — GPS inline, one insert, no race condition
    const insertPayload: Record<string, unknown> = {
      handover_id,
      receive_method,
      receiver_type,
      receiver_name: receiver_name ?? null,
      receiver_relation: receiver_relation ?? null,
      device_id: device_id ?? null,
      device_model: device_model ?? null,
    }

    if (photo_url) insertPayload.photo_url = photo_url

    const lat = typeof gps_lat === "number" && isFinite(gps_lat) ? gps_lat : null
    const lng = typeof gps_lng === "number" && isFinite(gps_lng) ? gps_lng : null
    const acc = typeof gps_accuracy === "number" && isFinite(gps_accuracy) ? gps_accuracy : null

    if (lat !== null && lng !== null) {
      insertPayload.gps_lat = lat
      insertPayload.gps_lng = lng
      if (acc !== null) insertPayload.gps_accuracy = acc
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

    // === WA NOTIFICATIONS (fire-and-forget) ===
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      `https://${req.headers.get("host") || "nest76.com"}`

    const senderLabel =
      companyName?.trim() ||
      handover.sender_name?.trim() ||
      "NEST76 STUDIO"

    const shareToken = handover.share_token

    if (handover.receiver_whatsapp && shareToken) {
      notifyReceiver({
        to: handover.receiver_whatsapp,
        senderLabel,
        shareToken,
        baseUrl
      }).then((res) => {
        if (!res.ok) console.warn("[WA] notifyReceiver failed:", res.error)
      }).catch((e) => console.warn("[WA] notifyReceiver exception:", e))
    }

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
