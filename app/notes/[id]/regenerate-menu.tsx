// app/notes/[id]/regenerate-menu.tsx
// AI 결과 재생성 옵션 메뉴 컴포넌트
// 다양한 재생성 옵션을 제공하는 드롭다운 메뉴
// Related: app/notes/[id]/ai-section.tsx, app/notes/ai-actions.ts

'use client'

import { useState } from 'react'
import { 
  RefreshCw, 
  List, 
  Hash, 
  FileText, 
  Tag, 
  Minus, 
  Plus,
  MoreHorizontal,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type SummaryStyle = 'bullet' | 'numbered' | 'paragraph' | 'keywords'
export type SummaryLength = 'short' | 'medium' | 'detailed'
export type TagCount = 3 | 6 | 9

interface RegenerateMenuProps {
  onRegenerate: (type: 'summary' | 'tags', options?: {
    style?: SummaryStyle
    length?: SummaryLength
    count?: TagCount
  }) => void
  hasSummary: boolean
  hasTags: boolean
  isLoading: boolean
}

export function RegenerateMenu({ 
  onRegenerate, 
  hasSummary, 
  hasTags, 
  isLoading 
}: RegenerateMenuProps) {
  const [selectedStyle, setSelectedStyle] = useState<SummaryStyle>('bullet')
  const [selectedLength, setSelectedLength] = useState<SummaryLength>('medium')
  const [selectedTagCount, setSelectedTagCount] = useState<TagCount>(6)

  const handleSummaryRegenerate = (style?: SummaryStyle, length?: SummaryLength) => {
    onRegenerate('summary', { 
      style: style || selectedStyle, 
      length: length || selectedLength 
    })
  }

  const handleTagsRegenerate = (count?: TagCount) => {
    onRegenerate('tags', { count: count || selectedTagCount })
  }

  const handleAllRegenerate = () => {
    onRegenerate('summary', { style: selectedStyle, length: selectedLength })
    onRegenerate('tags', { count: selectedTagCount })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
          {hasSummary || hasTags ? '재생성' : '생성'}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>AI 결과 생성/재생성</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* 전체 생성/재생성 */}
        <DropdownMenuItem onClick={handleAllRegenerate}>
          <Sparkles className="mr-2 h-4 w-4" />
          전체 {hasSummary || hasTags ? '재생성' : '생성'}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* 요약 관련 옵션 */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FileText className="mr-2 h-4 w-4" />
            요약 {hasSummary ? '재생성' : '생성'}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => handleSummaryRegenerate()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              기본 재생성
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <List className="mr-2 h-4 w-4" />
                스타일 변경
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem 
                  onClick={() => handleSummaryRegenerate('bullet')}
                  className={selectedStyle === 'bullet' ? 'bg-accent' : ''}
                >
                  <List className="mr-2 h-4 w-4" />
                  불릿 포인트
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleSummaryRegenerate('numbered')}
                  className={selectedStyle === 'numbered' ? 'bg-accent' : ''}
                >
                  <Hash className="mr-2 h-4 w-4" />
                  번호 리스트
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleSummaryRegenerate('paragraph')}
                  className={selectedStyle === 'paragraph' ? 'bg-accent' : ''}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  문단 형태
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleSummaryRegenerate('keywords')}
                  className={selectedStyle === 'keywords' ? 'bg-accent' : ''}
                >
                  <Tag className="mr-2 h-4 w-4" />
                  키워드 중심
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Minus className="mr-2 h-4 w-4" />
                길이 조절
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem 
                  onClick={() => handleSummaryRegenerate(undefined, 'short')}
                  className={selectedLength === 'short' ? 'bg-accent' : ''}
                >
                  <Minus className="mr-2 h-4 w-4" />
                  더 짧게 (2-3개)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleSummaryRegenerate(undefined, 'medium')}
                  className={selectedLength === 'medium' ? 'bg-accent' : ''}
                >
                  <List className="mr-2 h-4 w-4" />
                  기본 (3-6개)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleSummaryRegenerate(undefined, 'detailed')}
                  className={selectedLength === 'detailed' ? 'bg-accent' : ''}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  더 자세히 (6-10개)
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        {/* 태그 관련 옵션 */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Tag className="mr-2 h-4 w-4" />
            태그 {hasTags ? '재생성' : '생성'}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => handleTagsRegenerate()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              기본 재생성
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={() => handleTagsRegenerate(3)}
              className={selectedTagCount === 3 ? 'bg-accent' : ''}
            >
              <Minus className="mr-2 h-4 w-4" />
              3개 (핵심만)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleTagsRegenerate(6)}
              className={selectedTagCount === 6 ? 'bg-accent' : ''}
            >
              <Tag className="mr-2 h-4 w-4" />
              6개 (기본)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleTagsRegenerate(9)}
              className={selectedTagCount === 9 ? 'bg-accent' : ''}
            >
              <Plus className="mr-2 h-4 w-4" />
              9개 (상세)
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
