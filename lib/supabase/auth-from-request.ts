import { createClient, type User } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/lib/supabase/server"

/**
 * Resolves the current user from cookies (SSR) or from `Authorization: Bearer`.
 * Use the Bearer path right after client `signUp()` when cookies may not be on the request yet.
 */
export async function getUserFromRequest(req: Request): Promise<User | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (user) return user

  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null

  const token = auth.slice(7).trim()
  if (!token) return null

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null

  const supabaseJwt = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  })
  const {
    data: { user: u2 },
    error
  } = await supabaseJwt.auth.getUser()
  if (error || !u2) return null
  return u2
}
