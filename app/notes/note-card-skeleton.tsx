// app/notes/note-card-skeleton.tsx
// 노트 카드 스켈레톤 컴포넌트 - 노트 목록 로딩 중 표시
// 노트 카드와 동일한 모양의 스켈레톤을 표시하여 로딩 상태를 시각화
// Related: app/notes/page.tsx, app/notes/note-card.tsx, components/ui/skeleton.tsx

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function NoteCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  )
}

export function NoteListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <NoteCardSkeleton key={i} />
      ))}
    </div>
  )
}

