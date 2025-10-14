// lib/supabase/server.ts
// 서버 컴포넌트 및 Server Actions에서 사용할 Supabase 클라이언트 초기화
// 쿠키 기반 세션 관리를 통해 서버사이드에서 인증된 요청 처리
// 관련 파일: lib/supabase/client.ts, app/(auth)/actions.ts

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // 서버 컴포넌트에서 쿠키를 설정할 수 없는 경우 무시
          }
        },
      },
    }
  )
}


