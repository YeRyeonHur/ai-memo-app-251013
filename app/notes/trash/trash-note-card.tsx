// app/notes/trash/trash-note-card.tsx
// 휴지통 노트 카드 컴포넌트
// 삭제된 노트를 표시하고 복원/영구삭제 기능 제공
// Related: app/notes/trash/page.tsx, app/notes/actions.ts, app/notes/trash/permanent-delete-dialog.tsx

'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { format, formatDistanceToNow, differenceInMinutes } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Note } from '@/drizzle/schema'
import { restoreNote } from '../actions'
import { PermanentDeleteDialog } from './permanent-delete-dialog'

interface TrashNoteCardProps {
  note: Note
}

export function TrashNoteCard({ note }: TrashNoteCardProps) {
  const [isPending, startTransition] = useTransition()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleRestore = () => {
    startTransition(async () => {
      const result = await restoreNote(note.id)

      if (result.success) {
        toast.success('노트가 복원되었습니다!')
      } else {
        toast.error(result.error || '노트 복원에 실패했습니다.')
      }
    })
  }

  const getDeletedTime = () => {
    if (!note.deletedAt) return ''
    
    const deletedDate = new Date(note.deletedAt)
    const minutesAgo = differenceInMinutes(new Date(), deletedDate)

    if (minutesAgo < 10) {
      // 10분 이내: 상대 시간
      return formatDistanceToNow(deletedDate, {
        addSuffix: true,
        locale: ko,
      })
    } else {
      // 10분 이후: 절대 시간 (초 단위까지)
      return format(deletedDate, 'yyyy-MM-dd HH:mm:ss', {
        locale: ko,
      })
    }
  }

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow duration-200 flex flex-col h-full opacity-75">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-lg font-semibold line-clamp-2 flex-1">
              {note.title}
            </CardTitle>
          </div>
          {note.deletedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              삭제: {getDeletedTime()}
            </p>
          )}
        </CardHeader>

        <CardContent className="flex-1 pb-3">
          <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
            {truncateContent(note.content)}
          </p>
        </CardContent>

        <CardFooter className="pt-3 flex gap-2">
          <Button
            onClick={handleRestore}
            disabled={isPending}
            className="flex-1"
            size="sm"
          >
            {isPending ? '복원 중...' : '♻️ 복원'}
          </Button>
          <Button
            onClick={() => setShowDeleteDialog(true)}
            disabled={isPending}
            variant="destructive"
            className="flex-1"
            size="sm"
          >
            🗑️ 영구 삭제
          </Button>
        </CardFooter>
      </Card>

      <PermanentDeleteDialog
        note={note}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </>
  )
}

