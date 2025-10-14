// app/notes/page.tsx
// 노트 목록 및 관리 페이지
// 회원가입/로그인 후 리디렉션되는 메인 페이지, 노트 목록 조회 및 페이지네이션
// 관련 파일: app/notes/actions.ts, app/notes/note-card.tsx, app/notes/pagination.tsx

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { LogoutButton } from './logout-button'
import { getNotes, type SortOption } from './actions'
import { NoteCard } from './note-card'
import { Pagination } from './pagination'
import { NoteListSkeleton } from './note-card-skeleton'
import { SortSelect } from './sort-select'

interface PageProps {
  searchParams: Promise<{ page?: string; sort?: string }>
}

async function NotesList({
  page,
  sortBy,
}: {
  page: number
  sortBy: SortOption
}) {
  const result = await getNotes(page, sortBy)

  if (!result.success || !result.notes || !result.pagination) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold">노트를 불러오지 못했습니다</h2>
          <p className="text-muted-foreground">{result.error}</p>
          <Button onClick={() => window.location.reload()}>다시 시도</Button>
        </div>
      </div>
    )
  }

  const { notes, pagination } = result

  if (notes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-semibold">아직 노트가 없습니다</h2>
          <p className="text-muted-foreground">
            새 노트를 작성하여 생각을 기록해보세요!
          </p>
          <Link href="/notes/new">
            <Button className="mt-4">첫 노트 작성하기</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} />
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

export default async function NotesPage({ searchParams }: PageProps) {
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

  // 온보딩 상태 확인
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .single()

  // 프로필이 없거나 온보딩 미완료 시 온보딩 페이지로 리디렉션
  if (!profileError && profile && !profile.onboarding_completed) {
    redirect('/onboarding')
  }

  // URL 쿼리 파라미터에서 페이지 번호와 정렬 옵션 읽기
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10))
  const sortBy = (params.sort as SortOption) || 'newest'

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 영역 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">내 노트 📝</h1>
            <p className="text-muted-foreground">환영합니다, {user.email}님!</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/notes/new">
              <Button>✍️ 새 노트 작성</Button>
            </Link>
            <LogoutButton />
          </div>
        </div>

        {/* 정렬 옵션 */}
        <div className="flex justify-end mb-6">
          <SortSelect />
        </div>

        {/* 노트 목록 영역 */}
        <Suspense fallback={<NoteListSkeleton />}>
          <NotesList page={page} sortBy={sortBy} />
        </Suspense>

        {/* 하단 링크 */}
        <div className="mt-8 text-center">
          <Link
            href="/onboarding"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            온보딩 페이지 다시 보기
          </Link>
        </div>
      </div>
    </div>
  )
}


