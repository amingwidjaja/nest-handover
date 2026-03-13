import { NextResponse } from "next/server"
import { supabase } from "../../lib/supabase"

export async function POST(req: Request) {
  const body = await req.json()

  const {
    sender_name,
    receiver_target_name,
    receiver_target_phone,
    receiver_target_email,
    items
  } = body

  const tokenRes = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/handover/token`
  )

  const { token } = await tokenRes.json()

  const { data, error } = await supabase
    .from("handover")
    .insert({
      share_token: token,
      status: "created",
      sender_name,
      receiver_target_name,
      receiver_target_phone,
      receiver_target_email
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error },
      { status: 500 }
    )
  }

  if (items?.length) {
    const rows = items.map((item: any) => ({
      handover_id: data.id,
      description: item.description,
      photo_url: item.photo_url
    }))

    await supabase
      .from("handover_items")
      .insert(rows)
  }

  return NextResponse.json({
    token,
    handover_id: data.id
  })
}