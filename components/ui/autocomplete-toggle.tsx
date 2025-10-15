// components/ui/autocomplete-toggle.tsx
// 자동완성 기능 on/off 토글 버튼 컴포넌트
// 사용자가 자동완성 기능을 활성화/비활성화할 수 있는 토글 버튼
// Related: components/ui/autocomplete.tsx, lib/hooks/use-autocomplete.ts

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Sparkles, ZapOff } from 'lucide-react'

export interface AutocompleteToggleProps {
  isEnabled: boolean
  onToggle: (enabled: boolean) => void
  className?: string
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
}

export function AutocompleteToggle({
  isEnabled,
  onToggle,
  className,
  size = 'sm',
  variant = 'ghost'
}: AutocompleteToggleProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleToggle = () => {
    onToggle(!isEnabled)
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleToggle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
              'transition-all duration-200',
              isEnabled && 'text-primary',
              className
            )}
            aria-label={isEnabled ? '자동완성 비활성화' : '자동완성 활성화'}
          >
            {isEnabled ? (
              <Sparkles className="h-4 w-4" />
            ) : (
              <ZapOff className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isEnabled 
              ? 'AI 자동완성 비활성화' 
              : 'AI 자동완성 활성화'
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
