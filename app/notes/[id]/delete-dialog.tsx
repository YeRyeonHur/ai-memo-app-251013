// app/notes/[id]/delete-dialog.tsx
// 노트 삭제 확인 다이얼로그
// 사용자가 노트를 삭제하기 전에 확인을 요청하는 다이얼로그
// Related: app/notes/[id]/page.tsx, app/notes/actions.ts, components/ui/alert-dialog.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { toast } from 'sonner'
import { deleteNote } from '../actions'

interface DeleteDialogProps {
  noteId: string
  noteTitle: string
}

export function DeleteDialog({ noteId, noteTitle }: DeleteDialogProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [open, setOpen] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const result = await deleteNote(noteId)

      if (result.success) {
        toast.success('노트가 휴지통으로 이동되었습니다')
        router.push('/notes')
        router.refresh()
      } else {
        toast.error(result.error || '노트 삭제에 실패했습니다')
        setOpen(false)
      }
    } catch (error) {
      toast.error('노트 삭제 중 오류가 발생했습니다')
      setOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">삭제</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>이 노트를 휴지통으로 이동하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            "{noteTitle}" 노트가 휴지통으로 이동됩니다. 휴지통에서 복원하거나 영구 삭제할 수 있습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={isDeleting}
            className="bg-destructive text-white hover:bg-destructive/80"
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

