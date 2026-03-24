import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import {
  NEST_EVIDENCE_BUCKET,
  buildHandoverPhotoPath
} from "@/lib/nest-evidence-upload"
import { getUserFromRequest } from "@/lib/supabase/auth-from-request"

/**
 * Multipart upload (FormData) — server uses service role so bucket RLS on the client is not required.
 *
 * Fields:
 * - `file` (required) — image blob
 * - `handover_id` (required)
 * - `mode`: `package_first_item` | `proof_only` (default `package_first_item`)
 */
export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", detail: "Missing session or Bearer token" },
        { status: 401 }
      )
    }

    const ct = (req.headers.get("content-type") || "").toLowerCase()
    if (!ct.includes("multipart/form-data")) {
      return NextResponse.json(
        {
          error: "File missing",
          detail: "Gunakan multipart/form-data dengan field file"
        },
        { status: 400 }
      )
    }

    const form = await req.formData()
    const handover_id = String(form.get("handover_id") ?? "").trim()
    const mode = String(form.get("mode") ?? "package_first_item").trim()
    const file = form.get("file")

    if (!handover_id) {
      return NextResponse.json(
        { error: "handover_id wajib" },
        { status: 400 }
      )
    }

    const hasFile =
      file &&
      typeof file === "object" &&
      "size" in file &&
      typeof (file as Blob).size === "number" &&
      (file as Blob).size > 0

    if (!hasFile || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "File missing", detail: "Field file kosong atau bukan blob" },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()
    const { data: ho, error: hoErr } = await admin
      .from("handover")
      .select("id, user_id")
      .eq("id", handover_id)
      .single()

    if (hoErr || !ho) {
      return NextResponse.json({ error: "Handover tidak ditemukan" }, { status: 404 })
    }
    if (ho.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const buf = Buffer.from(await file.arrayBuffer())
    const path = buildHandoverPhotoPath(handover_id, "photo")
    const contentType =
      file.type && file.type.startsWith("image/")
        ? file.type
        : "image/jpeg"

    const { error: upErr } = await admin.storage
      .from(NEST_EVIDENCE_BUCKET)
      .upload(path, buf, {
        contentType,
        upsert: false
      })

    if (upErr) {
      console.error("UPLOAD_DEBUG:", upErr)
      return NextResponse.json(
        { error: upErr.message || "Upload gagal" },
        { status: 500 }
      )
    }

    const { data: pub } = admin.storage
      .from(NEST_EVIDENCE_BUCKET)
      .getPublicUrl(path)
    const publicUrl = pub.publicUrl

    if (mode === "proof_only") {
      return NextResponse.json({
        success: true,
        publicUrl,
        path
      })
    }

    const { data: firstRows, error: itemErr } = await admin
      .from("handover_items")
      .select("id")
      .eq("handover_id", handover_id)
      .order("id", { ascending: true })
      .limit(1)

    if (itemErr) {
      console.error("UPLOAD_DEBUG:", itemErr)
      return NextResponse.json({ error: itemErr.message }, { status: 500 })
    }

    const firstId = firstRows?.[0]?.id
    if (firstId) {
      const { error: updErr } = await admin
        .from("handover_items")
        .update({ photo_url: publicUrl })
        .eq("id", firstId)

      if (updErr) {
        console.error("UPLOAD_DEBUG:", updErr)
        return NextResponse.json({ error: updErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      publicUrl,
      path
    })
  } catch (e: unknown) {
    console.error("UPLOAD_DEBUG:", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "upload failed" },
      { status: 500 }
    )
  }
}
