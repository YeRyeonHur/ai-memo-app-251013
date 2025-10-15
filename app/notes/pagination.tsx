// app/notes/pagination.tsx
// 페이지네이션 컴포넌트 - 노트 목록 페이지네이션
// 이전/다음 버튼과 페이지 번호를 표시하고 URL 쿼리 파라미터로 페이지 변경
// Related: app/notes/page.tsx, app/notes/actions.ts

'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalNotes: number
}

export function Pagination({ currentPage, totalPages, totalNotes }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        ← 이전
      </Button>

      <div className="flex items-center gap-2">
        {/* 첫 페이지 */}
        {currentPage > 3 && (
          <>
            <Button
              variant={currentPage === 1 ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePageChange(1)}
            >
              1
            </Button>
            {currentPage > 4 && (
              <span className="text-muted-foreground">...</span>
            )}
          </>
        )}

        {/* 현재 페이지 주변 */}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((page) => {
            return (
              page === currentPage ||
              page === currentPage - 1 ||
              page === currentPage + 1 ||
              (page === currentPage - 2 && currentPage <= 3) ||
              (page === currentPage + 2 && currentPage >= totalPages - 2)
            )
          })
          .map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePageChange(page)}
            >
              {page}
            </Button>
          ))}

        {/* 마지막 페이지 */}
        {currentPage < totalPages - 2 && (
          <>
            {currentPage < totalPages - 3 && (
              <span className="text-muted-foreground">...</span>
            )}
            <Button
              variant={currentPage === totalPages ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePageChange(totalPages)}
            >
              {totalPages}
            </Button>
          </>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        다음 →
      </Button>

      <div className="ml-4 text-sm text-muted-foreground">
        전체 {totalNotes}개 ({currentPage}/{totalPages} 페이지)
      </div>
    </div>
  )
}

