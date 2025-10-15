// app/notes/note-card.tsx
// 노트 카드 컴포넌트 - 노트 목록에서 개별 노트를 표시
// 제목, 본문 미리보기, 작성일시를 카드 형식으로 보여주고 클릭 시 상세 페이지로 이동
// Related: app/notes/page.tsx, app/notes/[id]/page.tsx, lib/utils.ts

'use client'

import { useRouter } from 'next/navigation'
import { format, formatDistanceToNow, differenceInMinutes } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { truncateText } from '@/lib/utils'
import type { Note } from '@/drizzle/schema'

interface NoteCardProps {
  note: Note
}

export function NoteCard({ note }: NoteCardProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/notes/${note.id}`)
  }

  // 작성일시 표시: 10분 이내는 상대 시간, 그 이후는 절대 시간
  const getDisplayDate = () => {
    const createdDate = new Date(note.createdAt)
    const minutesAgo = differenceInMinutes(new Date(), createdDate)

    if (minutesAgo < 10) {
      // 10분 이내: 상대 시간
      return formatDistanceToNow(createdDate, {
        addSuffix: true,
        locale: ko,
      })
    } else {
      // 10분 이후: 절대 시간 (초 단위까지)
      return format(createdDate, 'yyyy-MM-dd HH:mm:ss', {
        locale: ko,
      })
    }
  }

  const displayDate = getDisplayDate()

  // 본문 미리보기
  const preview = truncateText(note.content)

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
      onClick={handleClick}
    >
      <CardHeader>
        <CardTitle className="text-lg font-semibold line-clamp-2">
          {note.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{displayDate}</p>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">{preview}</p>
      </CardContent>
    </Card>
  )
}

