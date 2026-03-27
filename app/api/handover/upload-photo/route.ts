import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import {
  NEST_EVIDENCE_BUCKET,
  buildPaketObjectPath,
  resolveNestEvidencePublicUrl
} from "@/lib/nest-evidence-upload"
import { getUserFromRequest } from "@/lib/supabase/auth-from-request"

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
        { error: "File missing", detail: "Gunakan multipart/form-data dengan field file" },
        { status: 400 }
      )
    }

    const form = await req.formData()
    const handover_id = String(form.get("handover_id") ?? "").trim()
    const mode = String(form.get("mode") ?? "package_first_item").trim()
    const file = form.get("file")

    if (!handover_id) {
      return NextResponse.json({ error: "handover_id wajib" }, { status: 400 })
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

    // proof_only = uploaded by receiver (not the handover owner)
    // package_first_item = uploaded by sender (must be owner)
    if (mode !== "proof_only" && ho.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const buf = Buffer.from(await file.arrayBuffer())
    const objectType = mode === "proof_only" ? "proof" : "paket"
    const mime = file.type?.startsWith("image/") ? file.type : "image/jpeg"
    const ext: "webp" | "jpg" = mime.includes("webp") ? "webp" : "jpg"
    const storagePath = buildPaketObjectPath(user.id, handover_id, objectType, ext)

    const { error: upErr } = await admin.storage
      .from(NEST_EVIDENCE_BUCKET)
      .upload(storagePath, buf, {
        contentType: mime,
        upsert: true  // allow retake
      })

    if (upErr) {
      console.error("[upload-photo] storage error:", upErr)
      return NextResponse.json(
        { error: upErr.message || "Upload gagal" },
        { status: 500 }
      )
    }

    const publicUrl = resolveNestEvidencePublicUrl(storagePath)

    if (mode === "proof_only") {
      return NextResponse.json({ success: true, storagePath, publicUrl })
    }

    // package_first_item: update first handover_item photo
    const { data: firstRows, error: itemErr } = await admin
      .from("handover_items")
      .select("id")
      .eq("handover_id", handover_id)
      .order("id", { ascending: true })
      .limit(1)

    if (itemErr) {
      return NextResponse.json({ error: itemErr.message }, { status: 500 })
    }

    const firstId = firstRows?.[0]?.id
    if (firstId) {
      const { error: updErr } = await admin
        .from("handover_items")
        .update({ photo_url: storagePath })
        .eq("id", firstId)

      if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, storagePath, publicUrl })
  } catch (e: unknown) {
    console.error("[upload-photo] error:", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "upload failed" },
      { status: 500 }
    )
  }
}
