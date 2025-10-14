// app/notes/logout-button.tsx
// 로그아웃 버튼 컴포넌트
// Server Action을 통한 로그아웃 처리
// 관련 파일: app/(auth)/actions.ts, app/notes/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/(auth)/actions'
import { toast } from 'sonner'

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoading(true)

    try {
      const result = await signOut()

      if (result?.error) {
        toast.error(result.error.message)
      } else {
        toast.success('로그아웃되었습니다')
        router.push('/login')
        router.refresh()
      }
    } catch (error) {
      toast.error('로그아웃 중 오류가 발생했습니다')
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleLogout} disabled={isLoading} variant="outline">
      {isLoading ? '로그아웃 중...' : '로그아웃'}
    </Button>
  )
}

