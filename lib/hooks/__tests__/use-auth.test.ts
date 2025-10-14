// lib/hooks/__tests__/use-auth.test.ts
// useAuth 훅 단위 테스트
// 세션 상태 관리 및 로그아웃 기능 테스트
// 관련 파일: lib/hooks/use-auth.ts, lib/supabase/client.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from '../use-auth'
import type { User, Session } from '@supabase/supabase-js'

// Mock functions
const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockSignOut = vi.fn()
const mockPush = vi.fn()
const mockRefresh = vi.fn()

// Supabase 클라이언트 모킹
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signOut: mockSignOut,
    },
  }),
}))

// Next.js router 모킹
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

describe('useAuth', () => {
  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    created_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
  } as User

  const mockSession: Session = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    token_type: 'bearer',
    user: mockUser,
  } as Session

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('초기 로딩 상태를 true로 설정해야 한다', () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isLoading).toBe(true)
  })

  it('세션이 있으면 user와 session을 설정해야 한다', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.session).toEqual(mockSession)
  })

  it('세션이 없으면 user와 session을 null로 설정해야 한다', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
  })

  it('signOut 호출 시 로그아웃하고 로그인 페이지로 이동해야 한다', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
    mockSignOut.mockResolvedValue({ error: null })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await result.current.signOut()

    expect(mockSignOut).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('세션 변경 시 라우터를 새로고침해야 한다', async () => {
    let authStateChangeCallback: ((event: string, session: Session | null) => void) | null = null
    
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    mockOnAuthStateChange.mockImplementation((callback) => {
      authStateChangeCallback = callback
      return {
        data: { subscription: { unsubscribe: vi.fn() } },
      }
    })

    renderHook(() => useAuth())

    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalled()
    })

    // 세션 변경 이벤트 트리거
    if (authStateChangeCallback) {
      authStateChangeCallback('SIGNED_IN', mockSession)
    }

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('언마운트 시 구독을 해제해야 한다', async () => {
    const mockUnsubscribe = vi.fn()
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    })

    const { unmount } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalled()
    })

    unmount()

    // 구독 해제가 최소 1번 이상 호출되었는지 확인
    expect(mockUnsubscribe).toHaveBeenCalled()
  })
})
