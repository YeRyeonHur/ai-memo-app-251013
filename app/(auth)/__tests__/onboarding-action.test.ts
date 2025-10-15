// app/(auth)/__tests__/onboarding-action.test.ts
// completeOnboarding Server Action 테스트

import { describe, it, expect, vi } from 'vitest'
import { completeOnboarding } from '../actions'

// Supabase mock
const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockFrom = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}))

describe('completeOnboarding Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default setup
    mockEq.mockReturnValue(Promise.resolve({ error: null }))
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ update: mockUpdate })
  })

  it('should return error if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    })

    const result = await completeOnboarding()

    expect(result).toEqual({
      error: { message: '인증이 필요합니다' },
    })
  })

  it('should update user_profiles when user is authenticated', async () => {
    const mockUser = { id: 'test-user-id' }
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockEq.mockResolvedValue({ error: null })

    const result = await completeOnboarding()

    expect(mockFrom).toHaveBeenCalledWith('user_profiles')
    expect(mockUpdate).toHaveBeenCalledWith({
      onboarding_completed: true,
      onboarding_completed_at: expect.any(String),
    })
    expect(mockEq).toHaveBeenCalledWith('user_id', mockUser.id)
    expect(result).toEqual({ success: true })
  })

  it('should return error if database update fails', async () => {
    const mockUser = { id: 'test-user-id' }
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const dbError = new Error('Database error')
    mockEq.mockResolvedValue({ error: dbError })

    const result = await completeOnboarding()

    expect(result).toEqual({
      error: { message: '온보딩 완료 처리에 실패했습니다' },
    })
  })
})

