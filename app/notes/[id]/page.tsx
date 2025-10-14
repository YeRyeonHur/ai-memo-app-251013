// app/notes/[id]/page.tsx
// 노트 상세 조회 페이지
// 노트의 전체 내용을 표시하고 수정/삭제 기능 제공
// Related: app/notes/actions.ts, app/notes/[id]/edit/page.tsx, app/notes/note-card.tsx

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { getNoteById } from '../actions'
import { DeleteDialog } from './delete-dialog'
import { AiSection } from './ai-section'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function NoteDetailPage({ params }: PageProps) {
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

  // 날짜 포맷팅
  const createdDate = format(new Date(note.createdAt), 'PPP p', { locale: ko })
  const updatedDate = format(new Date(note.updatedAt), 'PPP p', { locale: ko })

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 네비게이션 버튼 */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/notes">
            <Button variant="outline">← 목록으로</Button>
          </Link>
          <div className="flex gap-2">
            <Link href={`/notes/${note.id}/edit`}>
              <Button>수정</Button>
            </Link>
            <DeleteDialog noteId={note.id} noteTitle={note.title} />
          </div>
        </div>

        {/* 노트 내용 */}
        <Card>
          <CardHeader>
            <h1 className="text-3xl font-bold mb-4">{note.title}</h1>
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              <p>작성일: {createdDate}</p>
              <p>수정일: {updatedDate}</p>
            </div>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap break-words text-base leading-relaxed">
              {note.content}
            </p>
          </CardContent>
        </Card>

        {/* AI 요약 및 태그 섹션 */}
        <div className="mt-8">
          <AiSection noteId={note.id} />
        </div>
      </div>
    </div>
  )
}

