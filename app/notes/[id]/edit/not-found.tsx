// app/notes/[id]/edit/not-found.tsx
// 노트를 찾을 수 없을 때 표시되는 404 페이지 (편집 페이지)
// 노트가 존재하지 않거나 권한이 없을 때 표시
// Related: app/notes/[id]/edit/page.tsx, app/notes/page.tsx

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="text-6xl text-center mb-4">📝</div>
          <CardTitle className="text-2xl text-center">
            노트를 찾을 수 없습니다
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            요청하신 노트가 존재하지 않거나 수정 권한이 없습니다.
          </p>
          <div className="flex justify-center">
            <Link href="/notes">
              <Button>← 목록으로 돌아가기</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

