// app/onboarding/page.tsx
// 신규 사용자 온보딩 페이지 - 서비스 소개 및 기능 안내
// 3단계 온보딩 플로우 (환영, 기능 소개, 첫 메모 유도)
// 관련 파일: app/(auth)/actions.ts, app/notes/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { completeOnboarding } from '@/app/(auth)/actions'
import { toast } from 'sonner'

const TOTAL_STEPS = 3

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isCompleting, setIsCompleting] = useState(false)
  const router = useRouter()

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setIsCompleting(true)

    try {
      const result = await completeOnboarding()

      if (result?.error) {
        toast.error(result.error.message)
      } else {
        toast.success('환영합니다! AI 메모장을 시작해보세요 🌸')
        router.push('/notes')
        router.refresh()
      }
    } catch (error) {
      toast.error('오류가 발생했습니다')
      console.error('Onboarding completion error:', error)
    } finally {
      setIsCompleting(false)
    }
  }

  const handleSkip = async () => {
    setIsCompleting(true)

    try {
      const result = await completeOnboarding()

      if (result?.error) {
        toast.error(result.error.message)
      } else {
        toast.info('언제든 ℹ️ 버튼으로 다시 볼 수 있어요!')
        router.push('/notes')
        router.refresh()
      }
    } catch (error) {
      toast.error('오류가 발생했습니다')
      console.error('Onboarding skip error:', error)
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        {/* 스킵 버튼 */}
        <div className="px-6 pt-6 pb-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            disabled={isCompleting}
          >
            건너뛰기 →
          </Button>
        </div>

        <CardHeader className="space-y-1 text-center pb-4">
          {/* Progress indicator */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-2 rounded-full transition-all ${
                  step === currentStep
                    ? 'w-8 bg-primary'
                    : step < currentStep
                    ? 'w-8 bg-primary/50'
                    : 'w-8 bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          {currentStep === 1 && (
            <>
              <div className="text-6xl mb-4">🌸💛✨</div>
              <CardTitle className="text-3xl font-bold">
                AI 메모장에 오신 것을 환영합니다!
              </CardTitle>
              <CardDescription className="text-lg">
                간편하게 메모하고, AI가 자동으로 정리해드립니다 🌼
              </CardDescription>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="text-6xl mb-4">✨🎀🌻</div>
              <CardTitle className="text-3xl font-bold">
                주요 기능 소개
              </CardTitle>
              <CardDescription className="text-lg">
                AI 메모장이 제공하는 핵심 기능들을 알아보세요
              </CardDescription>
            </>
          )}

          {currentStep === 3 && (
            <>
              <div className="text-6xl mb-4">💖🦋✨</div>
              <CardTitle className="text-3xl font-bold">
                첫 메모를 작성해보세요!
              </CardTitle>
              <CardDescription className="text-lg">
                이제 모든 준비가 완료되었습니다 🌸
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: 환영 메시지 */}
          {currentStep === 1 && (
            <div className="space-y-6 text-center">
              <p className="text-lg text-muted-foreground">
                AI 메모장은 여러분의 생각과 아이디어를<br />
                쉽고 빠르게 기록하고 관리할 수 있도록 도와드립니다.
              </p>
              <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border/50">
                <p className="text-sm text-muted-foreground">
                  ✨ <strong>간단하게</strong> 텍스트나 음성으로 메모하세요<br />
                  🤖 <strong>자동으로</strong> AI가 요약하고 태그를 달아줍니다<br />
                  🔍 <strong>빠르게</strong> 원하는 메모를 검색하고 찾으세요
                </p>
              </div>
            </div>
          )}

          {/* Step 2: 기능 안내 */}
          {currentStep === 2 && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border/50 text-center space-y-2">
                <div className="text-4xl mb-2">📝</div>
                <h3 className="font-semibold">텍스트 메모</h3>
                <p className="text-sm text-muted-foreground">
                  빠르게 생각을 기록하고 정리하세요
                </p>
              </div>

              <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border/50 text-center space-y-2">
                <div className="text-4xl mb-2">🎙️</div>
                <h3 className="font-semibold">음성 메모</h3>
                <p className="text-sm text-muted-foreground">
                  음성으로 말하면 자동으로 텍스트로 변환
                </p>
              </div>

              <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border/50 text-center space-y-2">
                <div className="text-4xl mb-2">🤖</div>
                <h3 className="font-semibold">AI 요약</h3>
                <p className="text-sm text-muted-foreground">
                  긴 메모도 핵심만 간추려 정리
                </p>
              </div>

              <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border/50 text-center space-y-2">
                <div className="text-4xl mb-2">🏷️</div>
                <h3 className="font-semibold">자동 태깅</h3>
                <p className="text-sm text-muted-foreground">
                  AI가 자동으로 관련 태그를 추천
                </p>
              </div>

              <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border/50 text-center space-y-2">
                <div className="text-4xl mb-2">🔍</div>
                <h3 className="font-semibold">스마트 검색</h3>
                <p className="text-sm text-muted-foreground">
                  태그와 내용으로 빠르게 검색
                </p>
              </div>

              <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border/50 text-center space-y-2">
                <div className="text-4xl mb-2">📤</div>
                <h3 className="font-semibold">데이터 내보내기</h3>
                <p className="text-sm text-muted-foreground">
                  언제든 내 데이터를 다운로드
                </p>
              </div>
            </div>
          )}

          {/* Step 3: 첫 메모 작성 유도 */}
          {currentStep === 3 && (
            <div className="space-y-6 text-center">
              <p className="text-lg text-muted-foreground">
                이제 첫 메모를 작성할 준비가 되었습니다!<br />
                간단한 일상 메모부터 시작해보세요.
              </p>

              <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border/50 space-y-4">
                <h3 className="font-semibold text-lg">💡 메모 작성 팁</h3>
                <ul className="text-sm text-muted-foreground space-y-2 text-left">
                  <li>✅ 오늘 할 일을 간단히 적어보세요</li>
                  <li>✅ 떠오른 아이디어를 바로 기록하세요</li>
                  <li>✅ 회의 내용이나 공부한 내용을 정리하세요</li>
                  <li>✅ 음성 메모로 빠르게 생각을 캡처하세요</li>
                </ul>
              </div>

              <div className="text-4xl">
                🌻 🦋 🍯 💖
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || isCompleting}
            >
              ← 이전
            </Button>

            <Button
              onClick={handleNext}
              disabled={isCompleting}
            >
              {isCompleting ? (
                <>
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2" />
                  처리 중...
                </>
              ) : currentStep === TOTAL_STEPS ? (
                '🌸 시작하기'
              ) : (
                '다음 →'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

