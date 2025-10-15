// lib/gemini/__tests__/prompts.test.ts
// Gemini 프롬프트 생성 함수 단위 테스트
// prompts.ts의 함수들이 올바른 프롬프트를 생성하는지 검증
// Related: lib/gemini/prompts.ts

import { describe, it, expect } from 'vitest'
import { createSummaryPrompt, createTagsPrompt } from '../prompts'

describe('createSummaryPrompt', () => {
  it('노트 내용을 포함한 프롬프트를 생성한다', () => {
    const content = '이것은 테스트 노트입니다.'
    const prompt = createSummaryPrompt(content)

    expect(prompt).toContain(content)
  })

  it('요약 지시사항이 포함된다', () => {
    const content = '테스트 내용'
    const prompt = createSummaryPrompt(content)

    expect(prompt).toContain('3-6개의 불릿 포인트')
    expect(prompt).toContain('한 문장으로')
    expect(prompt).toContain('핵심')
  })

  it('불릿 포인트 형식 지시사항이 포함된다', () => {
    const content = '테스트'
    const prompt = createSummaryPrompt(content)

    expect(prompt).toContain('-')
    expect(prompt).toContain('불릿')
  })

  it('빈 내용도 처리할 수 있다', () => {
    const prompt = createSummaryPrompt('')

    expect(prompt).toBeDefined()
    expect(prompt.length).toBeGreaterThan(0)
  })

  it('긴 내용도 처리할 수 있다', () => {
    const longContent = '이것은 매우 긴 내용입니다. '.repeat(1000)
    const prompt = createSummaryPrompt(longContent)

    expect(prompt).toContain(longContent)
    expect(prompt.length).toBeGreaterThan(longContent.length)
  })

  it('특수 문자가 포함된 내용을 처리할 수 있다', () => {
    const content = '특수문자: !@#$%^&*()_+-=[]{}|;:,.<>?'
    const prompt = createSummaryPrompt(content)

    expect(prompt).toContain(content)
  })

  it('줄바꿈이 포함된 내용을 처리할 수 있다', () => {
    const content = '첫 줄\n두번째 줄\n세번째 줄'
    const prompt = createSummaryPrompt(content)

    expect(prompt).toContain(content)
  })
})

describe('createTagsPrompt', () => {
  it('노트 내용을 포함한 프롬프트를 생성한다', () => {
    const content = '프로그래밍 관련 노트입니다.'
    const prompt = createTagsPrompt(content)

    expect(prompt).toContain(content)
  })

  it('태그 생성 지시사항이 포함된다', () => {
    const content = '테스트 내용'
    const prompt = createTagsPrompt(content)

    expect(prompt).toContain('태그')
    expect(prompt).toContain('최대 6개')
    expect(prompt).toContain('쉼표로 구분')
  })

  it('태그 형식 요구사항이 포함된다', () => {
    const content = '테스트'
    const prompt = createTagsPrompt(content)

    expect(prompt).toContain('1-3 단어')
    expect(prompt).toContain('간결')
    expect(prompt).toContain('소문자')
  })

  it('빈 내용도 처리할 수 있다', () => {
    const prompt = createTagsPrompt('')

    expect(prompt).toBeDefined()
    expect(prompt.length).toBeGreaterThan(0)
  })

  it('긴 내용도 처리할 수 있다', () => {
    const longContent = '긴 내용 '.repeat(500)
    const prompt = createTagsPrompt(longContent)

    expect(prompt).toContain(longContent)
  })
})

