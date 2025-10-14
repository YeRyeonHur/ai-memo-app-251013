// app/notes/[id]/edit/edit-form.tsx
// 노트 편집 폼 컴포넌트
// 노트 제목과 본문을 수정하고 실시간으로 자동 저장하는 기능 제공
// Related: app/notes/actions.ts, lib/hooks/use-debounce.ts, app/notes/[id]/edit/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { updateNote } from '../../actions'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { toast } from 'sonner'
import type { Note } from '@/drizzle/schema'

interface EditFormProps {
  initialNote: Note
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function EditForm({ initialNote }: EditFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialNote.title)
  const [content, setContent] = useState(initialNote.content)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  // 디바운스된 값 (1초 후)
  const debouncedTitle = useDebounce(title, 1000)
  const debouncedContent = useDebounce(content, 1000)

  // 자동 저장 로직
  useEffect(() => {
    // 초기 로딩 시 저장하지 않음
    if (
      debouncedTitle === initialNote.title &&
      debouncedContent === initialNote.content
    ) {
      return
    }

    // 유효성 검증: 제목과 본문이 비어있으면 저장하지 않음
    if (!debouncedTitle.trim() || !debouncedContent.trim()) {
      return
    }

    // 자동 저장 실행
    const saveNote = async () => {
      setSaveStatus('saving')

      try {
        const result = await updateNote(
          initialNote.id,
          debouncedTitle,
          debouncedContent
        )

        if (result.success) {
          setSaveStatus('saved')
          // 2초 후 상태 초기화
          setTimeout(() => {
            setSaveStatus('idle')
          }, 2000)
        } else {
          setSaveStatus('error')
          toast.error(result.error || '저장에 실패했습니다.')
        }
      } catch (error) {
        setSaveStatus('error')
        toast.error('저장 중 오류가 발생했습니다.')
      }
    }

    saveNote()
  }, [debouncedTitle, debouncedContent, initialNote.id, initialNote.title, initialNote.content])

  // 완료 버튼 클릭 핸들러
  const handleComplete = () => {
    router.push(`/notes/${initialNote.id}`)
  }

  // 취소 버튼 클릭 핸들러
  const handleCancel = () => {
    router.push(`/notes/${initialNote.id}`)
  }

  // 저장 상태 표시 텍스트
  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return '저장 중...'
      case 'saved':
        return '저장됨 ✓'
      case 'error':
        return '저장 실패'
      default:
        return ''
    }
  }

  // 저장 상태 색상
  const getSaveStatusColor = () => {
    switch (saveStatus) {
      case 'saving':
        return 'text-yellow-500'
      case 'saved':
        return 'text-green-500'
      case 'error':
        return 'text-red-500'
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">노트 수정</h1>
          <span className={`text-sm font-medium ${getSaveStatusColor()}`}>
            {getSaveStatusText()}
          </span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>노트 편집</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 제목 입력 필드 */}
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="노트 제목을 입력하세요"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right">
                {title.length}/200
              </p>
            </div>

            {/* 본문 입력 필드 */}
            <div className="space-y-2">
              <Label htmlFor="content">본문</Label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="노트 내용을 입력하세요"
                className="w-full min-h-[400px] px-3 py-2 rounded-md border border-input bg-background text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              />
            </div>

            {/* 버튼 영역 */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>
                취소
              </Button>
              <Button onClick={handleComplete}>완료</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

