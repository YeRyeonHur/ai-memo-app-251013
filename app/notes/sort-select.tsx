// app/notes/sort-select.tsx
// 노트 정렬 옵션 선택 컴포넌트
// 사용자가 노트 목록의 정렬 기준을 선택할 수 있는 드롭다운
// Related: app/notes/page.tsx, app/notes/actions.ts, components/ui/select.tsx

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SortOption } from './actions'

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'newest', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
  { value: 'title', label: '제목순' },
  { value: 'updated', label: '최근 수정순' },
]

export function SortSelect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = (searchParams.get('sort') as SortOption) || 'newest'

  const handleSortChange = (newSort: SortOption) => {
    const params = new URLSearchParams(searchParams)
    params.set('sort', newSort)
    params.set('page', '1') // 정렬 변경 시 1페이지로 리셋
    router.push(`/notes?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">정렬:</span>
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="정렬 선택" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

