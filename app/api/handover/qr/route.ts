import { NextResponse } from "next/server"
import QRCode from "qrcode"

export async function GET(req: Request) {

  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.json(
      { error: "token required" },
      { status: 400 }
    )
  }

  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/receive/${token}`

  const qr = await QRCode.toDataURL(url)

  return NextResponse.json({
    qr
  })

}