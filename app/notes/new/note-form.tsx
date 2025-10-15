// app/notes/new/note-form.tsx
// 노트 생성 폼 컴포넌트 (Client Component)
// 제목과 본문 입력 폼을 제공하고, 유효성 검증, 임시 저장, Server Action 호출
// Related: app/notes/actions.ts, app/notes/new/page.tsx, lib/utils/draft-storage.ts

'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createNote } from '../actions'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { saveDraft, loadDraft, clearDraft } from '@/lib/utils/draft-storage'
import { DraftRestoreDialog } from './draft-restore-dialog'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'

export function NoteForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [errors, setErrors] = useState<{
    title?: string
    content?: string
  }>({})
  const [userId, setUserId] = useState<string | null>(null)
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [savedDraft, setSavedDraft] = useState<ReturnType<typeof loadDraft>>(null)
  const [isNoteSaved, setIsNoteSaved] = useState(false) // 노트 저장 성공 플래그

  // 디바운스된 제목과 본문 (1초)
  const debouncedTitle = useDebounce(title, 1000)
  const debouncedContent = useDebounce(content, 1000)

  // 사용자 ID 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    fetchUser()
  }, [])

  // 페이지 진입 시 임시 저장 데이터 확인
  useEffect(() => {
    if (!userId) return

    const draft = loadDraft(userId)
    if (draft) {
      setSavedDraft(draft)
      setShowRestoreDialog(true)
    }
  }, [userId])

  // 자동 임시 저장
  useEffect(() => {
    if (!userId) return
    
    // 제목과 본문이 모두 비어있으면 저장하지 않음
    if (!debouncedTitle.trim() && !debouncedContent.trim()) {
      return
    }

    // 임시 저장 실행
    const success = saveDraft(userId, debouncedTitle, debouncedContent)
    if (success) {
      setDraftSavedAt(new Date())
    }
  }, [debouncedTitle, debouncedContent, userId])

  // 페이지를 떠날 때 임시 저장
  useEffect(() => {
    if (!userId) return

    const handleBeforeUnload = () => {
      // 노트가 이미 저장되었으면 임시 저장하지 않음
      if (isNoteSaved) return
      // 제목이나 본문이 하나라도 있으면 저장
      if (title.trim() || content.trim()) {
        saveDraft(userId, title, content)
      }
    }

    // 브라우저 창을 닫거나 새로고침할 때
    window.addEventListener('beforeunload', handleBeforeUnload)

    // 컴포넌트가 언마운트될 때 (페이지 이동 시)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // 노트가 이미 저장되었으면 임시 저장하지 않음
      if (isNoteSaved) return
      // 제목이나 본문이 하나라도 있으면 저장
      if (title.trim() || content.trim()) {
        saveDraft(userId, title, content)
      }
    }
  }, [userId, title, content, isNoteSaved])

  const validateForm = (): boolean => {
    const newErrors: { title?: string; content?: string } = {}

    if (!title.trim()) {
      newErrors.title = '제목을 입력해주세요.'
    } else if (title.length > 200) {
      newErrors.title = '제목은 200자 이하로 입력해주세요.'
    }

    if (!content.trim()) {
      newErrors.content = '본문을 입력해주세요.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 클라이언트 사이드 유효성 검증
    if (!validateForm()) {
      return
    }

    // Server Action 호출
    startTransition(async () => {
      const result = await createNote(title, content)

      if (result.success) {
        // 노트 저장 성공 플래그 설정
        setIsNoteSaved(true)
        // 임시 저장 데이터 삭제
        if (userId) {
          clearDraft(userId)
        }
        toast.success('노트가 저장되었습니다! ✨')
        router.push('/notes')
      } else {
        toast.error(result.error || '노트 저장에 실패했습니다.')
      }
    })
  }

  const handleCancel = () => {
    router.push('/notes')
  }

  const handleRestore = () => {
    if (!savedDraft) return
    setTitle(savedDraft.title)
    setContent(savedDraft.content)
    setDraftSavedAt(new Date(savedDraft.savedAt))
    toast.success('작성 중이던 노트를 복원했습니다.')
  }

  const handleDiscard = () => {
    if (userId) {
      clearDraft(userId)
      setSavedDraft(null)
      toast.info('임시 저장된 노트를 삭제했습니다.')
    }
  }

  const getSaveStatusText = () => {
    if (!draftSavedAt) return ''
    return formatDistanceToNow(draftSavedAt, { addSuffix: true, locale: ko })
  }

  return (
    <>
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>새 노트 작성 ✍️</CardTitle>
            {draftSavedAt && (
              <span className="text-xs text-muted-foreground">
                임시 저장됨 ✓ {getSaveStatusText()}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 제목 입력 */}
          <div className="space-y-2">
            <Label htmlFor="title">
              제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="노트 제목을 입력하세요"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (errors.title) {
                  setErrors((prev) => ({ ...prev, title: undefined }))
                }
              }}
              maxLength={200}
              disabled={isPending}
              className={errors.title ? 'border-destructive' : ''}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            <div className="flex justify-between items-center">
              {errors.title && (
                <p id="title-error" className="text-sm text-destructive">
                  {errors.title}
                </p>
              )}
              <p
                className={`text-sm ${
                  title.length > 180 ? 'text-destructive' : 'text-muted-foreground'
                } ml-auto`}
              >
                {title.length}/200
              </p>
            </div>
          </div>

          {/* 본문 입력 */}
          <div className="space-y-2">
            <Label htmlFor="content">
              본문 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="content"
              placeholder="노트 내용을 입력하세요"
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                if (errors.content) {
                  setErrors((prev) => ({ ...prev, content: undefined }))
                }
              }}
              disabled={isPending}
              className={`min-h-[240px] ${errors.content ? 'border-destructive' : ''}`}
              aria-invalid={!!errors.content}
              aria-describedby={errors.content ? 'content-error' : undefined}
            />
            {errors.content && (
              <p id="content-error" className="text-sm text-destructive">
                {errors.content}
              </p>
            )}
          </div>

          {/* 버튼 영역 */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? '저장 중...' : '저장'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

      {/* 임시 저장 복원 다이얼로그 */}
      {savedDraft && (
        <DraftRestoreDialog
          open={showRestoreDialog}
          onOpenChange={setShowRestoreDialog}
          draftData={savedDraft}
          onRestore={handleRestore}
          onDiscard={handleDiscard}
        />
      )}
    </>
  )
}

