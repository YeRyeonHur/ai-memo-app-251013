// lib/gemini/__tests__/utils.test.ts
// Gemini 유틸리티 함수 단위 테스트
// 프롬프트 검증 및 토큰 추정 테스트
// Related: lib/gemini/utils.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  isEmptyPrompt,
  estimateTokenCount,
  exceedsTokenLimit,
  validatePrompt,
  truncateToTokenLimit,
  getTimeout,
  parseTagsFromText,
} from '../utils'

describe('Gemini Utils', () => {
  describe('isEmptyPrompt', () => {
    it('빈 문자열은 true를 반환한다', () => {
      expect(isEmptyPrompt('')).toBe(true)
    })

    it('공백만 있는 문자열은 true를 반환한다', () => {
      expect(isEmptyPrompt('   ')).toBe(true)
      expect(isEmptyPrompt('\n\t ')).toBe(true)
    })

    it('내용이 있는 문자열은 false를 반환한다', () => {
      expect(isEmptyPrompt('Hello')).toBe(false)
      expect(isEmptyPrompt(' Hello ')).toBe(false)
    })
  })

  describe('estimateTokenCount', () => {
    it('빈 문자열은 0을 반환한다', () => {
      expect(estimateTokenCount('')).toBe(0)
    })

    it('영어 텍스트의 토큰을 추정한다 (4자당 1토큰)', () => {
      const text = 'Hello World' // 11자 (공백 포함)
      const estimated = estimateTokenCount(text)
      expect(estimated).toBeGreaterThan(0)
      expect(estimated).toBeLessThanOrEqual(Math.ceil(11 / 4))
    })

    it('한글 텍스트의 토큰을 추정한다 (2자당 1토큰)', () => {
      const text = '안녕하세요' // 5자
      const estimated = estimateTokenCount(text)
      expect(estimated).toBeGreaterThanOrEqual(Math.ceil(5 / 2))
    })

    it('영어와 한글 혼합 텍스트의 토큰을 추정한다', () => {
      const text = 'Hello 안녕하세요 World' // 영어 11자, 한글 5자
      const estimated = estimateTokenCount(text)
      expect(estimated).toBeGreaterThan(0)
    })

    it('긴 텍스트의 토큰을 추정한다', () => {
      const longText = 'Hello '.repeat(1000) // 6000자
      const estimated = estimateTokenCount(longText)
      expect(estimated).toBeGreaterThan(1000)
    })
  })

  describe('exceedsTokenLimit', () => {
    it('제한보다 짧은 텍스트는 false를 반환한다', () => {
      const text = 'Short text'
      expect(exceedsTokenLimit(text, 100)).toBe(false)
    })

    it('제한보다 긴 텍스트는 true를 반환한다', () => {
      const longText = 'Hello '.repeat(5000) // 매우 긴 텍스트
      expect(exceedsTokenLimit(longText, 100)).toBe(true)
    })

    it('기본값은 8000 토큰이다', () => {
      const text = 'Hello'
      expect(exceedsTokenLimit(text)).toBe(false)
    })
  })

  describe('validatePrompt', () => {
    it('유효한 프롬프트는 valid: true를 반환한다', () => {
      const result = validatePrompt('Hello, Gemini!')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('빈 프롬프트는 에러를 반환한다', () => {
      const result = validatePrompt('')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('비어있습니다')
    })

    it('공백만 있는 프롬프트는 에러를 반환한다', () => {
      const result = validatePrompt('   ')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('비어있습니다')
    })

    it('너무 긴 프롬프트는 에러를 반환한다', () => {
      const longText = 'Hello '.repeat(5000)
      const result = validatePrompt(longText, 100)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('너무 깁니다')
      expect(result.error).toContain('토큰')
    })

    it('커스텀 토큰 제한을 사용할 수 있다', () => {
      const text = 'Hello World'
      const result = validatePrompt(text, 1)
      expect(result.valid).toBe(false)
    })
  })

  describe('truncateToTokenLimit', () => {
    it('제한 이하의 텍스트는 그대로 반환한다', () => {
      const text = 'Hello World'
      const result = truncateToTokenLimit(text, 1000)
      expect(result).toBe(text)
    })

    it('제한을 초과하는 텍스트는 잘라낸다', () => {
      const longText = 'Hello '.repeat(1000)
      const result = truncateToTokenLimit(longText, 100)
      expect(result.length).toBeLessThan(longText.length)
      expect(result).toContain('...')
    })

    it('한글 텍스트도 올바르게 자른다', () => {
      const longText = '안녕하세요 '.repeat(1000)
      const result = truncateToTokenLimit(longText, 100)
      expect(result.length).toBeLessThan(longText.length)
      expect(result).toContain('...')
    })
  })

  describe('getTimeout', () => {
    const originalEnv = process.env

    beforeEach(() => {
      process.env = { ...originalEnv }
    })

    afterEach(() => {
      process.env = originalEnv
    })

    it('GEMINI_TIMEOUT_MS 환경변수가 있으면 해당 값을 반환한다', () => {
      process.env.GEMINI_TIMEOUT_MS = '5000'
      expect(getTimeout()).toBe(5000)
    })

    it('환경변수가 없으면 기본값 10000을 반환한다', () => {
      delete process.env.GEMINI_TIMEOUT_MS
      expect(getTimeout()).toBe(10000)
    })

    it('환경변수가 유효하지 않으면 기본값을 반환한다', () => {
      process.env.GEMINI_TIMEOUT_MS = 'invalid'
      expect(getTimeout()).toBe(10000)
    })

    it('음수 값이면 기본값을 반환한다', () => {
      process.env.GEMINI_TIMEOUT_MS = '-1000'
      expect(getTimeout()).toBe(10000)
    })
  })

  describe('parseTagsFromText', () => {
    it('쉼표로 구분된 태그를 파싱한다', () => {
      const text = '개발, JavaScript, React'
      const tags = parseTagsFromText(text)
      expect(tags).toEqual(['개발', 'javascript', 'react'])
    })

    it('공백을 제거하고 소문자로 변환한다', () => {
      const text = ' Frontend ,  BACKEND  , DevOps '
      const tags = parseTagsFromText(text)
      expect(tags).toEqual(['frontend', 'backend', 'devops'])
    })

    it('빈 태그를 제거한다', () => {
      const text = 'tag1, , tag2, ,, tag3'
      const tags = parseTagsFromText(text)
      expect(tags).toEqual(['tag1', 'tag2', 'tag3'])
    })

    it('중복 태그를 제거한다', () => {
      const text = 'react, React, REACT, vue, React'
      const tags = parseTagsFromText(text)
      expect(tags).toEqual(['react', 'vue'])
    })

    it('최대 6개의 태그만 반환한다', () => {
      const text = '태그1, 태그2, 태그3, 태그4, 태그5, 태그6, 태그7, 태그8'
      const tags = parseTagsFromText(text)
      expect(tags.length).toBe(6)
      expect(tags).toEqual(['태그1', '태그2', '태그3', '태그4', '태그5', '태그6'])
    })

    it('빈 문자열은 빈 배열을 반환한다', () => {
      expect(parseTagsFromText('')).toEqual([])
      expect(parseTagsFromText('   ')).toEqual([])
    })

    it('쉼표만 있는 문자열은 빈 배열을 반환한다', () => {
      expect(parseTagsFromText(',')).toEqual([])
      expect(parseTagsFromText(',,,')).toEqual([])
      expect(parseTagsFromText(' , , , ')).toEqual([])
    })

    it('특수문자를 포함한 태그를 파싱한다', () => {
      const text = 'c++, node.js, vue.js'
      const tags = parseTagsFromText(text)
      expect(tags).toEqual(['c++', 'node.js', 'vue.js'])
    })

    it('한글과 영어가 섞인 태그를 파싱한다', () => {
      const text = '웹개발, JavaScript, 프론트엔드'
      const tags = parseTagsFromText(text)
      expect(tags).toEqual(['웹개발', 'javascript', '프론트엔드'])
    })
  })
})

