import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

function generateToken() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16)
}

export async function POST(req: Request) {

  try {

    const body = await req.json()

    const {
      sender_name,
      receiver_target_name,
      receiver_target_phone,
      receiver_target_email,
      items
    } = body

    const token = generateToken()

    const { data, error } = await supabase
      .from("handover")
      .insert({
        share_token: token,
        status: "pending",
        sender_name,
        receiver_target_name,
        receiver_target_phone,
        receiver_target_email
      })
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json(
        { success:false, error: error?.message || "insert failed" },
        { status:500 }
      )
    }

    if (items && items.length > 0) {

      const rows = items.map((item: any) => ({
        handover_id: data.id,
        description: item.description,
        photo_url: item.photo_url ?? null
      }))

      const { error:itemsError } = await supabase
        .from("handover_items")
        .insert(rows)

      if(itemsError){
        return NextResponse.json(
          { success:false, error:itemsError.message },
          { status:500 }
        )
      }

    }

    return NextResponse.json({
      success:true,
      token,
      handover_id:data.id
    })

  } catch {

    return NextResponse.json(
      { success:false, error:"invalid request" },
      { status:400 }
    )

  }

}