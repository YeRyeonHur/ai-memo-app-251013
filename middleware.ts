// middleware.ts
// Next.js 미들웨어 - 서버 사이드 세션 검증 및 보호된 라우트 접근 제어
// 모든 요청에서 Supabase 세션을 검증하고, 인증되지 않은 사용자를 로그인 페이지로 리디렉션
// 관련 파일: lib/supabase/server.ts, app/(auth)/actions.ts, lib/hooks/use-auth.ts

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 세션 검증 - getUser()는 JWT를 검증하고 사용자 정보를 반환
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 보호된 경로 정의
  const protectedPaths = ['/notes', '/onboarding']
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  // 인증 페이지 정의 (로그인된 사용자는 접근 불가)
  const authPaths = ['/login', '/signup', '/forgot-password']
  const isAuthPath = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  // 보호된 경로에 인증되지 않은 사용자 접근 시 로그인 페이지로 리디렉션
  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // 인증 페이지에 이미 로그인된 사용자 접근 시 노트 페이지로 리디렉션
  if (isAuthPath && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/notes'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

