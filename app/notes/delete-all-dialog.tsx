// app/notes/delete-all-dialog.tsx
// 모든 노트 삭제 확인 다이얼로그 컴포넌트
// 사용자가 모든 노트를 삭제하기 전 확인하는 UI 제공
// Related: app/notes/page.tsx, app/notes/actions.ts, components/ui/alert-dialog.tsx

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
import { deleteAllNotes } from './actions'

export function DeleteAllDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDeleteAll = () => {
    startTransition(async () => {
      const result = await deleteAllNotes()

      if (result.success) {
        toast.success(
          `모든 노트를 삭제했습니다! (${result.deletedCount}개)`
        )
        setOpen(false)
      } else {
        toast.error(result.error || '노트 삭제에 실패했습니다.')
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="default">
          🗑️ 모두 삭제
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>정말로 모든 노트를 삭제하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            이 작업은 되돌릴 수 없습니다. 모든 노트가 영구적으로 삭제됩니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAll}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? '삭제 중...' : '모두 삭제'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

