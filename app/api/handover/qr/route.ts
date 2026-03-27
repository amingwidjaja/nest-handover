import { NextResponse } from "next/server"
import QRCode from "qrcode"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 })
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    `https://${req.headers.get("host")}`

  // Forward receiver_type and delegate info to receive page
  // rt = receiver_type (direct|proxy), rn = receiver_name, rr = receiver_relation
  const forward = new URLSearchParams()
  const rt = searchParams.get("rt")
  const rn = searchParams.get("rn")
  const rr = searchParams.get("rr")
  const notes = searchParams.get("notes")

  if (rt) forward.set("rt", rt)
  if (rn) forward.set("rn", rn)
  if (rr) forward.set("rr", rr)
  if (notes) forward.set("notes", notes)

  const qs = forward.toString()
  const url = `${baseUrl}/receive/${token}${qs ? `?${qs}` : ""}`

  const qr = await QRCode.toDataURL(url, {
    width: 512,
    margin: 2,
    color: { dark: "#3E2723", light: "#FAF9F6" }
  })

  return NextResponse.json({ qr, url })
}
