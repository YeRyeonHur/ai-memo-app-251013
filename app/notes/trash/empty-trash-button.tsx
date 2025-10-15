// app/notes/trash/empty-trash-button.tsx
// 휴지통 비우기 버튼 컴포넌트
// 휴지통의 모든 노트를 영구 삭제하는 기능 제공
// Related: app/notes/trash/page.tsx, app/notes/actions.ts, components/ui/alert-dialog.tsx

'use client'

import { useState, useTransition } from 'react'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { emptyTrash } from '../actions'

export function EmptyTrashButton() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleEmptyTrash = () => {
    startTransition(async () => {
      const result = await emptyTrash()

      if (result.success) {
        toast.success(
          `휴지통을 비웠습니다. (${result.deletedCount}개 삭제됨)`
        )
        setOpen(false)
      } else {
        toast.error(result.error || '휴지통 비우기에 실패했습니다.')
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="default">
          🗑️ 휴지통 비우기
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>휴지통의 모든 노트를 영구 삭제하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            이 작업은 되돌릴 수 없습니다. 휴지통의 모든 노트가 완전히 삭제됩니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleEmptyTrash}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? '삭제 중...' : '모두 영구 삭제'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

