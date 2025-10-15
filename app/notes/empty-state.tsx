// app/notes/empty-state.tsx
// 노트가 없을 때 표시되는 향상된 빈 상태 UI 컴포넌트
// 환영 메시지, 행동 유도 버튼, 주요 기능 소개 카드 제공
// Related: app/notes/page.tsx, app/notes/sample-notes-dialog.tsx

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SampleNotesDialog } from './sample-notes-dialog'

const FEATURES = [
  { icon: '📝', title: '텍스트 메모', description: '빠르게 생각을 기록하고 정리하세요' },
  { icon: '🎙️', title: '음성 메모', description: '음성으로 말하면 자동으로 텍스트로 변환' },
  { icon: '🤖', title: 'AI 요약', description: '긴 메모도 핵심만 간추려 정리' },
  { icon: '🏷️', title: '자동 태깅', description: 'AI가 자동으로 관련 태그를 추천' },
  { icon: '🔍', title: '스마트 검색', description: '태그와 내용으로 빠르게 검색' },
  { icon: '📤', title: '데이터 내보내기', description: '언제든 내 데이터를 다운로드' },
]

export function EmptyState() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <div className="flex items-center justify-center min-h-[600px] py-12">
      <div className="text-center space-y-12 max-w-5xl px-4">
        {/* 환영 메시지 섹션 */}
        <div className="space-y-6 animate-fade-in">
          <div className="text-8xl mb-6">🌸💛✨</div>
          <h2 className="text-4xl font-bold mb-4">
            AI 메모장에 오신 것을 환영합니다!
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            여러분의 생각과 아이디어를 쉽고 빠르게 기록하고,
            <br />
            AI가 자동으로 정리해주는 스마트한 메모 도구입니다.
          </p>
        </div>

        {/* 행동 유도 버튼 섹션 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/notes/new">
            <Button size="lg" className="w-full sm:w-auto">
              ✍️ 첫 노트 작성하기
            </Button>
          </Link>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => setIsDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            📚 샘플 노트 보기
          </Button>
        </div>

        {/* 시작 가이드 링크 */}
        <div>
          <Link
            href="/onboarding"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            처음 사용하시나요? 시작 가이드 보기 →
          </Link>
        </div>

        {/* 주요 기능 소개 카드 그리드 */}
        <div className="pt-8">
          <h3 className="text-2xl font-semibold mb-8">주요 기능</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {FEATURES.map((feature, index) => (
              <Card
                key={index}
                className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg"
              >
                <CardContent className="p-6 text-center space-y-3">
                  <div className="text-5xl mb-3">{feature.icon}</div>
                  <h4 className="font-semibold text-lg">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 샘플 노트 생성 다이얼로그 */}
        <SampleNotesDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      </div>
    </div>
  )
}


