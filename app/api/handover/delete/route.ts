import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { deleteHandoverStorage } from "@/lib/nest-evidence-upload"
import { getUserFromRequest } from "@/lib/supabase/auth-from-request"

export async function POST(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { ids } = body

  if (!ids || !Array.isArray(ids)) {
    return NextResponse.json({ error: "ids required" }, { status: 400 })
  }

  const idList = ids
    .map((x: unknown) => String(x ?? "").trim())
    .filter(Boolean)

  if (idList.length === 0) {
    return NextResponse.json({ error: "ids required" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  const { data: rows, error: checkError } = await admin
    .from("handover")
    .select("id, user_id, status")
    .in("id", idList)

  if (checkError) {
    return NextResponse.json({ error: checkError.message }, { status: 500 })
  }

  const mine = (rows ?? []).filter((r) => r.user_id === user.id)

  if (mine.length === 0) {
    return NextResponse.json(
      { error: "Tidak ada paket yang dapat dihapus" },
      { status: 403 }
    )
  }

  const blocked = mine.filter((r) => r.status === "received")
  if (blocked.length > 0) {
    return NextResponse.json(
      { error: "Paket masih dalam proses dan belum bisa dihapus" },
      { status: 403 }
    )
  }

  for (const r of mine) {
    try {
      const { errors } = await deleteHandoverStorage(
        admin,
        r.user_id,
        r.id
      )
      if (errors.length > 0) {
        console.warn("[delete] nest-evidence cleanup:", r.id, errors)
      }
    } catch (e) {
      console.warn("[delete] nest-evidence cleanup failed:", r.id, e)
    }
  }

  const toDelete = mine.map((r) => r.id)
  const { error } = await admin.from("handover").delete().in("id", toDelete)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
