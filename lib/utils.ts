import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 텍스트를 지정된 길이로 자르고 말줄임표를 추가합니다.
 * @param text - 자를 텍스트
 * @param maxLength - 최대 길이 (기본값: 150)
 * @returns 잘린 텍스트 (필요 시 말줄임표 추가)
 */
export function truncateText(text: string, maxLength: number = 150): string {
  if (!text) return ''
  
  // 줄바꿈을 공백으로 변환
  const normalized = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim()
  
  if (normalized.length <= maxLength) {
    return normalized
  }
  
  return normalized.slice(0, maxLength).trim() + '...'
}
