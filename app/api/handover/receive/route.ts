import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { supabase } from "@/lib/supabase"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

type JsonReceiveBody = {
  handover_id?: string
  token?: string
  receiver_name?: string | null
  receiver_relation?: string | null
  receive_method?: string
  receiver_type?: "direct" | "proxy"
}

const ALLOWED_METHODS = [
  "direct_qr",
  "direct_photo",
  "proxy_qr",
  "proxy_photo",
]

function isPhotoMethod(m: string) {
  return m === "direct_photo" || m === "proxy_photo"
}

function receiverTypeFromMethod(receive_method: string): "direct" | "proxy" {
  return receive_method.startsWith("direct") ? "direct" : "proxy"
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || ""

    let receive_method: string
    let receiver_name = ""
    let receiver_relation = ""
    let photoFile: File | null = null
    let gps_lat: number | null = null
    let gps_lng: number | null = null
    let gps_accuracy: number | null = null
    let handoverIdInput = ""
    let tokenInput = ""

    // =========================
    // PARSE INPUT
    // =========================
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData()

      handoverIdInput = String(form.get("handover_id") || "").trim()
      tokenInput = String(form.get("token") || "").trim()
      receive_method = String(form.get("receive_method") || "").trim()

      receiver_name = String(form.get("receiver_name") ?? "")
      receiver_relation = String(form.get("receiver_relation") ?? "")

      const latRaw = form.get("gps_lat")
      const lngRaw = form.get("gps_lng")
      const accRaw = form.get("gps_accuracy")

      if (latRaw) {
        const n = Number(latRaw)
        if (!Number.isNaN(n)) gps_lat = n
      }
      if (lngRaw) {
        const n = Number(lngRaw)
        if (!Number.isNaN(n)) gps_lng = n
      }
      if (accRaw) {
        const n = Number(accRaw)
        if (!Number.isNaN(n)) gps_accuracy = n
      }

      const f = form.get("photo")
      if (f instanceof File && f.size > 0) {
        photoFile = f
      }
    } else {
      const body = (await req.json()) as JsonReceiveBody

      handoverIdInput = body.handover_id?.trim() || ""
      tokenInput = body.token?.trim() || ""
      receive_method = body.receive_method?.trim() || ""

      receiver_name = body.receiver_name?.trim() || ""
      receiver_relation = body.receiver_relation?.trim() || ""
    }

    if (!receive_method || !ALLOWED_METHODS.includes(receive_method)) {
      return NextResponse.json(
        { success: false, error: "receive_method tidak valid" },
        { status: 400 }
      )
    }

    const receiver_type = receiverTypeFromMethod(receive_method)

    if (isPhotoMethod(receive_method)) {
      if (!photoFile) {
        return NextResponse.json(
          { success: false, error: "foto wajib untuk serah terima foto" },
          { status: 400 }
        )
      }
      if (gps_lat == null || gps_lng == null) {
        return NextResponse.json(
          { success: false, error: "GPS wajib untuk serah terima foto" },
          { status: 400 }
        )
      }
    }

    // =========================
    // RESOLVE HANDOVER
    // =========================
    let handoverId = handoverIdInput

    if (!handoverId) {
      if (!tokenInput) {
        return NextResponse.json(
          { success: false, error: "handover_id atau token wajib ada" },
          { status: 400 }
        )
      }

      const { data: row, error } = await supabase
        .from("handover")
        .select("id")
        .eq("share_token", tokenInput)
        .single()

      if (error || !row) {
        return NextResponse.json(
          { success: false, error: "handover tidak ditemukan" },
          { status: 404 }
        )
      }

      handoverId = row.id
    }

    const { data: handoverRow, error: hoErr } = await supabase
      .from("handover")
      .select("id,tenant_id,status")
      .eq("id", handoverId)
      .single()

    if (hoErr || !handoverRow) {
      return NextResponse.json(
        { success: false, error: "handover tidak ditemukan" },
        { status: 404 }
      )
    }

    console.error("[receive] handoverRow", {
      status: handoverRow.status,
      receive_method,
    })

    // =========================
    // GUARD (ANTI DUPLICATE)
    // =========================
    if (handoverRow.status === "received") {
      return NextResponse.json(
        { success: false, error: "handover sudah diterima" },
        { status: 400 }
      )
    }

    if (handoverRow.status === "accepted") {
      return NextResponse.json(
        { success: false, error: "handover sudah selesai" },
        { status: 400 }
      )
    }

    const tenant_id = handoverRow.tenant_id

    // =========================
    // UPLOAD PHOTO
    // =========================
    let photo_url: string | null = null
    const receive_event_id = randomUUID()

    if (isPhotoMethod(receive_method) && photoFile) {
      const admin = getSupabaseAdmin()

      const path = `${tenant_id}/handover/${handoverId}/receive/${receive_event_id}.jpg`

      const bytes = await photoFile.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const { error: upErr } = await admin.storage
        .from("nest-evidence")
        .upload(path, buffer, {
          contentType: photoFile.type || "image/jpeg",
          upsert: false,
        })

      if (upErr) {
        console.error("[receive] storage upload error", upErr)
        return NextResponse.json(
          { success: false, error: upErr.message },
          { status: 500 }
        )
      }

      const { data } = admin.storage
        .from("nest-evidence")
        .getPublicUrl(path)

      photo_url = data?.publicUrl || null

      if (!photo_url) {
        return NextResponse.json(
          { success: false, error: "gagal mendapatkan URL foto" },
          { status: 500 }
        )
      }
    }

    // =========================
    // INSERT EVENT
    // =========================
    const { error: insertError } = await supabase
      .from("receive_event")
      .insert({
        id: receive_event_id,
        handover_id: handoverId,
        tenant_id,
        receiver_name,
        receiver_relation,
        receive_method,
        receiver_type,
        photo_url,
        gps_lat,
        gps_lng,
        gps_accuracy,
      })

    if (insertError) {
      console.error("[receive] insert receive_event error", insertError)
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      )
    }

    // =========================
    // FETCH RESULT
    // =========================
    const { data: finalHandover, error: finalError } = await supabase
      .from("handover")
      .select("id,status,received_at")
      .eq("id", handoverId)
      .single()

    if (finalError || !finalHandover) {
      return NextResponse.json(
        { success: false, error: "gagal membaca status handover" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      handover_id: finalHandover.id,
      status: finalHandover.status,
      received_at: finalHandover.received_at,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "internal server error"

    console.error("[receive] unhandled exception", error)

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}