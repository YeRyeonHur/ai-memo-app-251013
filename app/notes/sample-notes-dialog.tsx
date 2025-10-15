// app/notes/sample-notes-dialog.tsx
// 샘플 노트 생성 확인 다이얼로그 컴포넌트
// 사용자에게 샘플 노트 생성 여부를 확인하고 생성 처리
// Related: app/notes/empty-state.tsx, app/notes/actions.ts, components/ui/alert-dialog.tsx

'use client'

import { useState, useTransition } from 'react'
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
} from '@/components/ui/alert-dialog'
import { createSampleNotes } from './actions'
import { toast } from 'sonner'

interface SampleNotesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SampleNotesDialog({ open, onOpenChange }: SampleNotesDialogProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleCreate = async () => {
    startTransition(async () => {
      const result = await createSampleNotes()
      
      if (result.success) {
        toast.success(`샘플 노트 ${result.count}개가 생성되었습니다! 🌟`)
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.error || '샘플 노트 생성에 실패했습니다.')
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>샘플 노트를 생성하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p>
              AI 메모장 사용법을 안내하는 샘플 노트 3개가 생성됩니다.
            </p>
            <div className="bg-muted/50 rounded-md p-3 text-sm">
              <p className="font-medium mb-2">생성될 샘플 노트:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 🌟 AI 메모장 사용 가이드</li>
                <li>• 📝 텍스트 메모 작성하기</li>
                <li>• 🎙️ 음성 메모 활용법 (향후 제공)</li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">
              샘플 노트는 일반 노트와 동일하게 언제든지 수정하거나 삭제할 수 있습니다.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCreate}
            disabled={isPending}
          >
            {isPending ? '생성 중...' : '생성'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}


