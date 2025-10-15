// app/notes/trash/permanent-delete-dialog.tsx
// 영구 삭제 확인 다이얼로그 컴포넌트
// 노트를 영구 삭제하기 전 사용자에게 확인을 받는 UI
// Related: app/notes/trash/trash-note-card.tsx, app/notes/actions.ts, components/ui/alert-dialog.tsx

'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Note } from '@/drizzle/schema'
import { permanentlyDeleteNote } from '../actions'

interface PermanentDeleteDialogProps {
  note: Note
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PermanentDeleteDialog({
  note,
  open,
  onOpenChange,
}: PermanentDeleteDialogProps) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      const result = await permanentlyDeleteNote(note.id)

      if (result.success) {
        toast.success('노트가 영구 삭제되었습니다.')
        onOpenChange(false)
      } else {
        toast.error(result.error || '노트 삭제에 실패했습니다.')
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>정말로 영구 삭제하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            이 작업은 되돌릴 수 없습니다. 노트 &quot;{note.title}&quot;이(가) 완전히 삭제됩니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? '삭제 중...' : '영구 삭제'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

