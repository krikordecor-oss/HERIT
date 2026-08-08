import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.warn('Supabase is not configured.')

    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null }),
            limit: () => ({
              single: async () => ({ data: null }),
            }),
          }),
        }),
        insert: async () => ({ data: null }),
      }),
    } as any
  }

  return createBrowserClient(url, key)
}