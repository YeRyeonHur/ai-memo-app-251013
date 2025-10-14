// app/notes/trash/page.tsx
// 휴지통 페이지 - 삭제된 노트 목록 조회 및 관리
// 삭제된 노트를 복원하거나 영구 삭제할 수 있는 페이지
// Related: app/notes/actions.ts, app/notes/trash/trash-note-card.tsx, app/notes/page.tsx

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getDeletedNotes } from '../actions'
import { TrashNoteCard } from './trash-note-card'
import { Pagination } from '../pagination'
import { NoteListSkeleton } from '../note-card-skeleton'
import { EmptyTrashButton } from './empty-trash-button'
import { Button } from '@/components/ui/button'

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

async function TrashNotesList({ page }: { page: number }) {
  const result = await getDeletedNotes(page)

  if (!result.success || !result.notes || !result.pagination) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{result.error || '휴지통을 불러올 수 없습니다.'}</p>
      </div>
    )
  }

  const { notes, pagination } = result

  if (notes.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🗑️</div>
        <h2 className="text-2xl font-bold mb-2">휴지통이 비어있습니다</h2>
        <p className="text-muted-foreground mb-6">
          삭제된 노트가 없습니다.
        </p>
        <Link href="/notes">
          <Button>노트 목록으로 돌아가기</Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.map((note) => (
          <TrashNoteCard key={note.id} note={note} />
        ))}
      </div>

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalNotes={pagination.totalNotes}
      />
    </>
  )
}

export default async function TrashPage({ searchParams }: PageProps) {
  // 서버 사이드에서 인증 확인
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  if (error || !user) {
    redirect('/login')
  }

  // URL 쿼리 파라미터에서 페이지 번호 읽기
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10))

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 영역 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">휴지통 🗑️</h1>
            <p className="text-muted-foreground">
              삭제된 노트를 복원하거나 영구 삭제할 수 있습니다.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/notes">
              <Button variant="outline">← 노트 목록</Button>
            </Link>
            <EmptyTrashButton />
          </div>
        </div>

        {/* 휴지통 목록 영역 */}
        <Suspense fallback={<NoteListSkeleton />}>
          <TrashNotesList page={page} />
        </Suspense>
      </div>
    </div>
  )
}

