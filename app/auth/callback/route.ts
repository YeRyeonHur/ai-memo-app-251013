// app/auth/callback/route.ts
// 이메일 확인 링크 클릭 시 처리하는 콜백 라우트
// Supabase Auth 코드를 세션으로 교환하고 사용자를 리디렉션
// 관련 파일: app/(auth)/actions.ts, lib/supabase/server.ts

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  // 에러가 있는 경우
  if (error) {
    return NextResponse.redirect(
      `${requestUrl.origin}/signup?error=${encodeURIComponent(error_description || error)}`
    )
  }

  // 코드가 있는 경우 세션으로 교환
  if (code) {
    const supabase = await createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      return NextResponse.redirect(
        `${requestUrl.origin}/signup?error=${encodeURIComponent('이메일 확인 링크가 만료되었거나 이미 사용되었습니다. 다시 회원가입해주세요.')}`
      )
    }
    
    // 성공: notes 페이지로 리디렉션
    return NextResponse.redirect(`${requestUrl.origin}/notes`)
  }

  // 코드도 에러도 없는 경우
  return NextResponse.redirect(`${requestUrl.origin}/signup`)
}

