// app/notes/[id]/ai-section.tsx
// AI 요약 및 태그 섹션 컴포넌트
// 노트 요약과 태그를 표시하고 AI 생성 기능 제공
// Related: app/notes/ai-actions.ts, app/notes/[id]/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { Loader2, Sparkles, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { generateSummary, getSummary, generateTags, getTags } from '../ai-actions'
import type { Summary, Tag } from '@/drizzle/schema'

interface AiSectionProps {
  noteId: string
}

export function AiSection({ noteId }: AiSectionProps) {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const [isLoadingTags, setIsLoadingTags] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  // 초기 데이터 로드
  useEffect(() => {
    async function loadData() {
      setIsInitialLoading(true)
      try {
        // 요약 및 태그 조회
        const [summaryResult, tagsResult] = await Promise.all([
          getSummary(noteId),
          getTags(noteId),
        ])

        if (summaryResult.success) {
          setSummary(summaryResult.summary || null)
        }

        if (tagsResult.success) {
          setTags(tagsResult.tags || [])
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error)
      } finally {
        setIsInitialLoading(false)
      }
    }

    loadData()
  }, [noteId])

  // 요약 생성
  const handleGenerateSummary = async () => {
    setIsLoadingSummary(true)
    try {
      const result = await generateSummary(noteId)
      
      if (result.success) {
        toast.success(result.cached ? '기존 요약을 불러왔습니다' : '요약이 생성되었습니다')
        // 요약 다시 로드
        const summaryResult = await getSummary(noteId)
        if (summaryResult.success) {
          setSummary(summaryResult.summary || null)
        }
      } else {
        toast.error(result.error || '요약 생성 중 오류가 발생했습니다')
      }
    } catch (error) {
      toast.error('요약 생성 중 오류가 발생했습니다')
    } finally {
      setIsLoadingSummary(false)
    }
  }

  // 태그 생성
  const handleGenerateTags = async () => {
    setIsLoadingTags(true)
    try {
      const result = await generateTags(noteId)
      
      if (result.success) {
        toast.success('태그가 생성되었습니다')
        // 태그 다시 로드
        const tagsResult = await getTags(noteId)
        if (tagsResult.success) {
          setTags(tagsResult.tags || [])
        }
      } else {
        toast.error(result.error || '태그 생성 중 오류가 발생했습니다')
      }
    } catch (error) {
      toast.error('태그 생성 중 오류가 발생했습니다')
    } finally {
      setIsLoadingTags(false)
    }
  }

  // 전체 AI 생성
  const handleGenerateAll = async () => {
    setIsLoadingSummary(true)
    setIsLoadingTags(true)
    
    try {
      const [summaryResult, tagsResult] = await Promise.all([
        generateSummary(noteId),
        generateTags(noteId),
      ])

      if (summaryResult.success && tagsResult.success) {
        toast.success('AI 요약 및 태그가 생성되었습니다')
        
        // 데이터 다시 로드
        const [newSummary, newTags] = await Promise.all([
          getSummary(noteId),
          getTags(noteId),
        ])
        
        if (newSummary.success) setSummary(newSummary.summary || null)
        if (newTags.success) setTags(newTags.tags || [])
      } else {
        if (!summaryResult.success) toast.error(summaryResult.error || '요약 생성 실패')
        if (!tagsResult.success) toast.error(tagsResult.error || '태그 생성 실패')
      }
    } catch (error) {
      toast.error('AI 생성 중 오류가 발생했습니다')
    } finally {
      setIsLoadingSummary(false)
      setIsLoadingTags(false)
    }
  }

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Separator />
      
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">AI 요약 및 태그</h2>
        </div>
        <Button
          onClick={handleGenerateAll}
          disabled={isLoadingSummary || isLoadingTags}
          size="sm"
          variant="default"
        >
          {(isLoadingSummary || isLoadingTags) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {summary || tags.length > 0 ? '전체 재생성' : '전체 생성'}
        </Button>
      </div>

      {/* 요약 및 태그 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 요약 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>요약</span>
              {summary && (
                <Button
                  onClick={handleGenerateSummary}
                  disabled={isLoadingSummary}
                  size="sm"
                  variant="outline"
                >
                  {isLoadingSummary ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary ? (
              <div className="space-y-3">
                <ul className="list-none space-y-2">
                  {summary.summary.split('\n').map((line, index) => {
                    const trimmed = line.trim()
                    if (trimmed.startsWith('-')) {
                      return (
                        <li key={index} className="flex gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span className="flex-1">{trimmed.substring(1).trim()}</span>
                        </li>
                      )
                    }
                    return null
                  })}
                </ul>
                <p className="text-xs text-muted-foreground mt-4">
                  생성일: {new Date(summary.createdAt).toLocaleString('ko-KR')}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground mb-4">아직 요약이 생성되지 않았습니다</p>
                <Button
                  onClick={handleGenerateSummary}
                  disabled={isLoadingSummary}
                  size="sm"
                >
                  {isLoadingSummary && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  요약 생성
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 태그 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>태그</span>
              {tags.length > 0 && (
                <Button
                  onClick={handleGenerateTags}
                  disabled={isLoadingTags}
                  size="sm"
                  variant="outline"
                >
                  {isLoadingTags ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary">
                    {tag.tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground mb-4">아직 태그가 생성되지 않았습니다</p>
                <Button
                  onClick={handleGenerateTags}
                  disabled={isLoadingTags}
                  size="sm"
                >
                  {isLoadingTags && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  태그 생성
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

