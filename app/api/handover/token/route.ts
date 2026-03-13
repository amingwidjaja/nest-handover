import { NextResponse } from "next/server"

function generateToken(length = 8) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

  let token = ""

  for (let i = 0; i < length; i++) {
    token += chars.charAt(
      Math.floor(Math.random() * chars.length)
    )
  }

  return token
}

export async function GET() {
  const token = generateToken()

  return NextResponse.json({
    token
  })
}