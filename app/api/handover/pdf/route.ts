import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { resolveNestEvidencePublicUrl } from "@/lib/nest-evidence-upload"

/**
 * Download / view receipt PDF: redirects to the public object URL (relative path in DB).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("handover")
    .select("receipt_url")
    .eq("share_token", token)
    .maybeSingle()

  if (error || !data?.receipt_url) {
    return NextResponse.json(
      { error: "Receipt belum tersedia atau tidak ditemukan" },
      { status: 404 }
    )
  }

  const url = resolveNestEvidencePublicUrl(data.receipt_url)
  if (!url) {
    return NextResponse.json({ error: "URL receipt tidak valid" }, { status: 500 })
  }

  return NextResponse.redirect(url)
}
