// app/notes/new/draft-restore-dialog.tsx
// 임시 저장된 노트 복원 확인 다이얼로그 컴포넌트
// 사용자가 작성 중이던 노트를 복원할지 새로 작성할지 선택하는 UI 제공
// Related: app/notes/new/note-form.tsx, lib/utils/draft-storage.ts, components/ui/alert-dialog.tsx

'use client'

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
import type { DraftNote } from '@/lib/utils/draft-storage'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface DraftRestoreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  draftData: DraftNote
  onRestore: () => void
  onDiscard: () => void
}

export function DraftRestoreDialog({
  open,
  onOpenChange,
  draftData,
  onRestore,
  onDiscard,
}: DraftRestoreDialogProps) {
  const savedTime = formatDistanceToNow(new Date(draftData.savedAt), {
    addSuffix: true,
    locale: ko,
  })

  const handleRestore = () => {
    onRestore()
    onOpenChange(false)
  }

  const handleDiscard = () => {
    onDiscard()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>작성 중이던 노트가 있습니다</AlertDialogTitle>
          <AlertDialogDescription>
            {savedTime} 임시 저장된 노트를 복원하시겠습니까?
          </AlertDialogDescription>
          <div className="space-y-3 pt-2">
            <div className="bg-muted/50 rounded-md p-3 text-sm space-y-2">
              <div>
                <div className="font-medium text-foreground">제목</div>
                <div className="text-muted-foreground truncate">
                  {draftData.title || '(제목 없음)'}
                </div>
              </div>
              <div>
                <div className="font-medium text-foreground">본문 미리보기</div>
                <div className="text-muted-foreground line-clamp-2">
                  {draftData.content || '(내용 없음)'}
                </div>
              </div>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDiscard}>새로 작성</AlertDialogCancel>
          <AlertDialogAction onClick={handleRestore}>복원</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

