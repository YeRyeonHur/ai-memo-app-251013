// app/onboarding/__tests__/onboarding.test.tsx
// 온보딩 페이지 테스트
// 테스트 항목: 렌더링, 스텝 전환, 스킵 기능

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import OnboardingPage from '../page'
import { completeOnboarding } from '@/app/(auth)/actions'

// Router mock
const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

// completeOnboarding mock
vi.mock('@/app/(auth)/actions', () => ({
  completeOnboarding: vi.fn(),
}))

// sonner mock
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render step 1 by default', () => {
    render(<OnboardingPage />)
    
    expect(screen.getByText(/AI 메모장에 오신 것을 환영합니다!/i)).toBeInTheDocument()
    expect(screen.getByText(/간편하게 메모하고, AI가 자동으로 정리해드립니다/i)).toBeInTheDocument()
  })

  it('should show skip button', () => {
    render(<OnboardingPage />)
    
    const skipButton = screen.getByText(/건너뛰기/i)
    expect(skipButton).toBeInTheDocument()
  })

  it('should navigate to next step when clicking next button', () => {
    render(<OnboardingPage />)
    
    const nextButton = screen.getByText(/다음/i)
    fireEvent.click(nextButton)
    
    expect(screen.getByText(/주요 기능 소개/i)).toBeInTheDocument()
  })

  it('should navigate to previous step when clicking previous button', () => {
    render(<OnboardingPage />)
    
    // Go to step 2
    const nextButton = screen.getByText(/다음/i)
    fireEvent.click(nextButton)
    
    // Go back to step 1
    const prevButton = screen.getByText(/이전/i)
    fireEvent.click(prevButton)
    
    expect(screen.getByText(/AI 메모장에 오신 것을 환영합니다!/i)).toBeInTheDocument()
  })

  it('should disable previous button on first step', () => {
    render(<OnboardingPage />)
    
    // Previous button should not exist or be disabled on step 1
    const prevButton = screen.queryByText(/이전/i)
    if (prevButton) {
      expect(prevButton).toBeDisabled()
    }
  })

  it('should show "시작하기" button on last step', () => {
    render(<OnboardingPage />)
    
    // Navigate to step 3
    const nextButton = screen.getByText(/다음/i)
    fireEvent.click(nextButton)
    fireEvent.click(screen.getByText(/다음/i))
    
    expect(screen.getByText(/🌸 시작하기/i)).toBeInTheDocument()
  })

  it('should call completeOnboarding and redirect when completing onboarding', async () => {
    vi.mocked(completeOnboarding).mockResolvedValue({ success: true })
    
    render(<OnboardingPage />)
    
    // Navigate to last step
    const nextButton = screen.getByText(/다음/i)
    fireEvent.click(nextButton)
    fireEvent.click(screen.getByText(/다음/i))
    
    // Click complete button
    const completeButton = screen.getByText(/🌸 시작하기/i)
    fireEvent.click(completeButton)
    
    await waitFor(() => {
      expect(completeOnboarding).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/notes')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('should call completeOnboarding and redirect when skipping', async () => {
    vi.mocked(completeOnboarding).mockResolvedValue({ success: true })
    
    render(<OnboardingPage />)
    
    // Click skip button
    const skipButton = screen.getByText(/건너뛰기/i)
    fireEvent.click(skipButton)
    
    await waitFor(() => {
      expect(completeOnboarding).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/notes')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('should display all three progress indicators', () => {
    const { container } = render(<OnboardingPage />)
    
    // Check for progress indicators (3 divs)
    const progressBars = container.querySelectorAll('[class*="h-2 rounded-full"]')
    expect(progressBars.length).toBe(3)
  })

  it('should highlight current step in progress indicator', () => {
    const { container } = render(<OnboardingPage />)
    
    const progressBars = container.querySelectorAll('[class*="h-2 rounded-full"]')
    
    // First indicator should have primary color
    expect(progressBars[0].className).toContain('bg-primary')
    
    // Others should have muted color
    expect(progressBars[1].className).toContain('bg-muted')
    expect(progressBars[2].className).toContain('bg-muted')
  })
})

