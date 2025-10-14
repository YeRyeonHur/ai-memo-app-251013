// app/notes/page.tsx
// 노트 목록 및 관리 페이지 (임시)
// 회원가입/로그인 후 리디렉션되는 메인 페이지
// 관련 파일: app/(auth)/actions.ts, lib/supabase/server.ts

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from './logout-button'

export default async function NotesPage() {
  // 서버 사이드에서 인증 확인 (보안 강화)
  const supabase = await createClient()
  
  // getUser()를 사용하여 Supabase Auth 서버에서 실제로 인증 확인
  // getSession()은 쿠키만 읽어서 조작 가능하므로 보안에 취약
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // 로그인하지 않은 사용자는 로그인 페이지로 리디렉션
  if (error || !user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">AI 메모장</h1>
        <p className="text-muted-foreground mb-4">
          환영합니다, {user.email}님!
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          노트 기능은 추후 구현될 예정입니다.
        </p>
        <LogoutButton />
      </div>
    </div>
  )
}


