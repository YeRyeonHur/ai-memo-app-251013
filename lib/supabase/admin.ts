// lib/supabase/admin.ts
// 관리자 권한이 필요한 작업을 위한 Supabase Admin 클라이언트
// 서버 사이드 전용 (서비스 롤 키 사용)
// 관련 파일: app/(auth)/actions.ts, lib/supabase/server.ts

import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables for admin client')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

