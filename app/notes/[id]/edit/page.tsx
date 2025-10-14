// app/notes/[id]/edit/page.tsx
// 노트 수정 페이지
// 기존 노트를 불러와 수정하고 실시간으로 저장하는 기능 제공
// Related: app/notes/actions.ts, app/notes/[id]/edit/edit-form.tsx, app/notes/[id]/page.tsx

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getNoteById } from '../../actions'
import { EditForm } from './edit-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditNotePage({ params }: PageProps) {
  // 서버 사이드 인증 확인
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // 동적 라우트 파라미터 읽기
  const { id } = await params

  // 노트 조회
  const result = await getNoteById(id)

  if (!result.success || !result.note) {
    notFound()
  }

  const { note } = result

  return <EditForm initialNote={note} />
}

