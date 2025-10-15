// app/notes/new/page.tsx
// 노트 생성 페이지 (Server Component)
// 인증된 사용자가 새 노트를 작성할 수 있는 페이지
// Related: app/notes/new/note-form.tsx, app/notes/actions.ts, middleware.ts

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NoteForm } from './note-form'

export default async function NewNotePage() {
  // 서버 사이드 인증 확인 (이중 보안)
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // 비인증 사용자는 로그인 페이지로 리다이렉트
  if (error || !user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 영역 */}
        <div className="mb-8">
          <Link
            href="/notes"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            ← 노트 목록으로 돌아가기
          </Link>
        </div>

        {/* 폼 영역 */}
        <div className="flex justify-center">
          <NoteForm />
        </div>
      </div>
    </div>
  )
}

