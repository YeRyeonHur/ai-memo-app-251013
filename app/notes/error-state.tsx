// app/notes/error-state.tsx
// 노트 로딩 실패 시 표시되는 에러 상태 UI 컴포넌트
// 친절한 에러 메시지와 재시도 버튼 제공
// Related: app/notes/page.tsx, components/ui/button.tsx

'use client'

import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  error?: string
}

export function ErrorState({ error }: ErrorStateProps) {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-6 max-w-md px-4">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-semibold">노트를 불러오지 못했습니다</h2>
        <p className="text-muted-foreground leading-relaxed">
          {error || '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'}
        </p>
        <Button onClick={handleRetry} size="lg">
          다시 시도
        </Button>
        <p className="text-xs text-muted-foreground">
          문제가 계속되면 페이지를 새로고침하거나 다시 로그인해주세요.
        </p>
      </div>
    </div>
  )
}


