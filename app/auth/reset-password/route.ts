// app/auth/reset-password/route.ts
// 비밀번호 재설정 이메일 링크 콜백 핸들러
// 토큰 검증 및 비밀번호 변경 페이지로 리디렉션
// 관련 파일: app/(auth)/reset-password/page.tsx, app/(auth)/actions.ts

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    
    // 코드를 사용하여 세션 교환
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Password reset callback error:', error)
      // 에러 발생 시 로그인 페이지로 리디렉션 (에러 메시지 포함)
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent('재설정 링크가 만료되었거나 유효하지 않습니다')}`
      )
    }

    // 성공 시 비밀번호 변경 페이지로 리디렉션
    return NextResponse.redirect(`${requestUrl.origin}/reset-password`)
  }

  // 코드가 없는 경우 로그인 페이지로 리디렉션
  return NextResponse.redirect(
    `${requestUrl.origin}/login?error=${encodeURIComponent('유효하지 않은 재설정 링크입니다')}`
  )
}

