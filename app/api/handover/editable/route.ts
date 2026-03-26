import { NextResponse } from "next/server"
import { loadHandoverEditableForPage } from "@/lib/handover-editable"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const data = await loadHandoverEditableForPage(id)
  if (!data) {
    return NextResponse.json(
      { error: "Tidak ditemukan atau tidak dapat diedit" },
      { status: 404 }
    )
  }
  return NextResponse.json(data)
}
