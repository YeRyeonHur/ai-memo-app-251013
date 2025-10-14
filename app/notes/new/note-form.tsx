// app/notes/new/note-form.tsx
// 노트 생성 폼 컴포넌트 (Client Component)
// 제목과 본문 입력 폼을 제공하고, 유효성 검증 및 Server Action 호출
// Related: app/notes/actions.ts, app/notes/new/page.tsx, components/ui/input.tsx

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createNote } from '../actions'

export function NoteForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [errors, setErrors] = useState<{
    title?: string
    content?: string
  }>({})

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

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>새 노트 작성 ✍️</CardTitle>
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
  )
}

