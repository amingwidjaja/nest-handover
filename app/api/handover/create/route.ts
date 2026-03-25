import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { HANDOVER_ACTIVE_LIMITS } from "@/lib/handover-limits"
import {
  normalizeIndonesianPhoneTo628,
  sendNESTNotification
} from "@/lib/whatsapp"

function generateToken() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16)
}

function publicAppBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (explicit) {
    return explicit.replace(/\/$/, "")
  }
  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "").replace(/\/$/, "")
    return `https://${host}`
  }
  return ""
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()

    const {
      sender_name,
      receiver_target_name,
      receiver_target_phone,
      receiver_target_email,
      receiver_whatsapp,
      receiver_email,
      destination_lat,
      destination_lng,
      destination_address,
      destination_city,
      destination_postal_code,
      sender_address_info,
      items
    } = body

    const wa = String(receiver_whatsapp ?? receiver_target_phone ?? "").trim()
    const em = String(receiver_email ?? receiver_target_email ?? "").trim()

    const admin = getSupabaseAdmin()

    const { data: profile } = await admin
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .maybeSingle()

    const userType =
      profile?.user_type === "umkm" ? "umkm" : ("personal" as const)
    const limit = HANDOVER_ACTIVE_LIMITS[userType]

    const { count: activeCount, error: countErr } = await admin
      .from("handover")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("record_status", "active")

    if (countErr) {
      return NextResponse.json(
        { success: false, error: countErr.message },
        { status: 500 }
      )
    }

    if ((activeCount ?? 0) >= limit) {
      return NextResponse.json(
        {
          success: false,
          error: `Batas paket aktif tercapai (${limit} untuk akun ${userType}).`
        },
        { status: 429 }
      )
    }

    const { data: serialRaw, error: serialErr } = await admin.rpc(
      "next_handover_serial_number",
      {
        p_user_id: user.id,
        p_sender_name: String(sender_name ?? "")
      }
    )

    if (serialErr || serialRaw == null || String(serialRaw).trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: serialErr?.message || "Gagal membuat nomor seri"
        },
        { status: 500 }
      )
    }

    const serial_number = String(serialRaw).trim()

    const token = generateToken()

    const row: Record<string, unknown> = {
      share_token: token,
      status: "created",
      user_id: user.id,
      record_status: "active",
      serial_number,
      sender_name: sender_name ?? "",
      receiver_target_name: receiver_target_name ?? "",
      receiver_target_phone: wa || String(receiver_target_phone ?? ""),
      receiver_target_email: em || String(receiver_target_email ?? ""),
      receiver_whatsapp: wa,
      receiver_contact: wa,
      receiver_email: em,
      sender_address_info:
        sender_address_info && typeof sender_address_info === "object"
          ? sender_address_info
          : {}
    }

    if (destination_address !== undefined && destination_address !== null) {
      row.destination_address = String(destination_address)
    }
    if (destination_lat !== undefined && destination_lat !== null && destination_lat !== "") {
      row.destination_lat = destination_lat
    }
    if (destination_lng !== undefined && destination_lng !== null && destination_lng !== "") {
      row.destination_lng = destination_lng
    }
    if (destination_city !== undefined && destination_city !== null) {
      const t = String(destination_city).trim()
      if (t) row.destination_city = t
    }
    if (destination_postal_code !== undefined && destination_postal_code !== null) {
      const t = String(destination_postal_code).trim()
      if (t) row.destination_postal_code = t
    }

    const { data, error } = await admin
      .from("handover")
      .insert(row)
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: error?.message || "insert failed" },
        { status: 500 }
      )
    }

    if (items && items.length > 0) {
      const rows = items.map((item: { description?: string; photo_url?: string | null }) => ({
        handover_id: data.id,
        description: item.description,
        photo_url: item.photo_url ?? null
      }))

      const { error: itemsError } = await admin.from("handover_items").insert(rows)

      if (itemsError) {
        return NextResponse.json(
          { success: false, error: itemsError.message },
          { status: 500 }
        )
      }
    }

    const waForNotify = String(wa ?? "").trim()
    if (waForNotify) {
      const base = publicAppBaseUrl()
      const handoverLink = base
        ? `${base}/handover/${data.id}`
        : `/handover/${data.id}`
      const firstDesc =
        Array.isArray(items) &&
        items[0] &&
        typeof (items[0] as { description?: string }).description === "string"
          ? String((items[0] as { description: string }).description).trim()
          : ""
      const packageLabel = firstDesc || "Paket"
      const receiverLabel = String(receiver_target_name ?? "").trim() || "Penerima"

      try {
        const waResult = await sendNESTNotification(
          waForNotify,
          receiverLabel,
          packageLabel,
          handoverLink
        )
        const logTo =
          normalizeIndonesianPhoneTo628(waForNotify) ?? waForNotify
        console.log(
          `WA Protocol: Notification Sent to ${logTo} | Status: ${waResult.ok ? "Success" : "Fail"}`
        )
        if (!waResult.ok && waResult.error) {
          console.warn("[whatsapp] sendNESTNotification:", waResult.error)
        }
      } catch (err) {
        const logTo =
          normalizeIndonesianPhoneTo628(waForNotify) ?? waForNotify
        console.log(
          `WA Protocol: Notification Sent to ${logTo} | Status: Fail`
        )
        console.warn("[whatsapp] sendNESTNotification threw:", err)
      }
    }

    return NextResponse.json({
      success: true,
      token,
      handover_id: data.id,
      serial_number
    })
  } catch {
    return NextResponse.json(
      { success: false, error: "invalid request" },
      { status: 400 }
    )
  }
}
