// app/notes/__tests__/ai-actions.test.ts
// AI Actions 단위 테스트
// 요약 생성 및 조회 Server Actions 테스트
// Related: app/notes/ai-actions.ts, lib/gemini/client.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateSummary, getSummary } from '../ai-actions'

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
  })),
}))

// Mock DB
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([])),
      })),
    })),
  },
}))

// Mock Gemini Client
vi.mock('@/lib/gemini/client', () => ({
  generateText: vi.fn(() =>
    Promise.resolve({
      text: '- 첫번째 요약 포인트\n- 두번째 요약 포인트\n- 세번째 요약 포인트',
    })
  ),
}))

// Mock Next.js
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { generateText } from '@/lib/gemini/client'

describe('generateSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('인증되지 않은 사용자는 실패한다', async () => {
    const mockCreateClient = createClient as any
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: { user: null },
            error: new Error('Not authenticated'),
          })
        ),
      },
    })

    const result = await generateSummary('test-note-id')

    expect(result.success).toBe(false)
    expect(result.error).toContain('인증')
  })

  it('유효하지 않은 noteId는 실패한다', async () => {
    const mockCreateClient = createClient as any
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: { user: { id: 'user-id' } },
            error: null,
          })
        ),
      },
    })

    const result = await generateSummary('')

    expect(result.success).toBe(false)
    expect(result.error).toContain('유효하지 않습니다')
  })

  it('존재하지 않는 노트는 실패한다', async () => {
    const mockCreateClient = createClient as any
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: { user: { id: 'user-id' } },
            error: null,
          })
        ),
      },
    })

    const mockDb = db as any
    mockDb.select.mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })

    const result = await generateSummary('non-existent-note-id')

    expect(result.success).toBe(false)
    expect(result.error).toContain('찾을 수 없거나')
  })

  it('요약 생성 성공 시 요약을 반환한다', async () => {
    const mockCreateClient = createClient as any
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: { user: { id: 'user-id' } },
            error: null,
          })
        ),
      },
    })

    const mockDb = db as any
    
    // 노트 조회 성공
    let selectCallCount = 0
    mockDb.select.mockImplementation(() => {
      selectCallCount++
      if (selectCallCount === 1) {
        // 첫 번째 호출: 노트 조회
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn(() =>
                Promise.resolve([
                  {
                    id: 'note-id',
                    userId: 'user-id',
                    content: '테스트 노트 내용',
                  },
                ])
              ),
            })),
          })),
        }
      } else {
        // 두 번째 호출: 기존 요약 조회 (없음)
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve([])),
              })),
            })),
          })),
        }
      }
    })

    // 요약 저장 성공
    mockDb.insert.mockReturnValue({
      values: vi.fn(() => ({
        returning: vi.fn(() =>
          Promise.resolve([
            {
              id: 'summary-id',
              noteId: 'note-id',
              userId: 'user-id',
              summary: '- 첫번째 요약 포인트\n- 두번째 요약 포인트\n- 세번째 요약 포인트',
              model: 'gemini-2.0-flash',
            },
          ])
        ),
      })),
    })

    const result = await generateSummary('note-id')

    expect(result.success).toBe(true)
    expect(result.summary).toBeDefined()
    expect(result.cached).toBe(false)
  })

  it('5분 이내 요약이 있으면 캐시된 요약을 반환한다', async () => {
    const mockCreateClient = createClient as any
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: { user: { id: 'user-id' } },
            error: null,
          })
        ),
      },
    })

    const mockDb = db as any
    
    let selectCallCount = 0
    mockDb.select.mockImplementation(() => {
      selectCallCount++
      if (selectCallCount === 1) {
        // 노트 조회
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn(() =>
                Promise.resolve([
                  {
                    id: 'note-id',
                    userId: 'user-id',
                    content: '테스트 노트 내용',
                  },
                ])
              ),
            })),
          })),
        }
      } else {
        // 기존 요약 조회 (최근 생성됨)
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => ({
                limit: vi.fn(() =>
                  Promise.resolve([
                    {
                      id: 'summary-id',
                      noteId: 'note-id',
                      userId: 'user-id',
                      summary: '- 캐시된 요약',
                      createdAt: new Date(), // 방금 생성됨
                    },
                  ])
                ),
              })),
            })),
          })),
        }
      }
    })

    const result = await generateSummary('note-id')

    expect(result.success).toBe(true)
    expect(result.summary).toBe('- 캐시된 요약')
    expect(result.cached).toBe(true)
  })
})

describe('getSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('인증되지 않은 사용자는 실패한다', async () => {
    const mockCreateClient = createClient as any
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: { user: null },
            error: new Error('Not authenticated'),
          })
        ),
      },
    })

    const result = await getSummary('test-note-id')

    expect(result.success).toBe(false)
    expect(result.error).toContain('인증')
  })

  it('유효하지 않은 noteId는 실패한다', async () => {
    const mockCreateClient = createClient as any
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: { user: { id: 'user-id' } },
            error: null,
          })
        ),
      },
    })

    const result = await getSummary('')

    expect(result.success).toBe(false)
    expect(result.error).toContain('유효하지 않습니다')
  })

  it('존재하지 않는 노트는 실패한다', async () => {
    const mockCreateClient = createClient as any
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: { user: { id: 'user-id' } },
            error: null,
          })
        ),
      },
    })

    const mockDb = db as any
    mockDb.select.mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })

    const result = await getSummary('non-existent-note-id')

    expect(result.success).toBe(false)
    expect(result.error).toContain('찾을 수 없거나')
  })

  it('요약이 없으면 null을 반환한다', async () => {
    const mockCreateClient = createClient as any
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: { user: { id: 'user-id' } },
            error: null,
          })
        ),
      },
    })

    const mockDb = db as any
    
    let selectCallCount = 0
    mockDb.select.mockImplementation(() => {
      selectCallCount++
      if (selectCallCount === 1) {
        // 노트 조회 성공
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn(() =>
                Promise.resolve([
                  {
                    id: 'note-id',
                    userId: 'user-id',
                    content: '테스트 노트',
                  },
                ])
              ),
            })),
          })),
        }
      } else {
        // 요약 조회 (없음)
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve([])),
              })),
            })),
          })),
        }
      }
    })

    const result = await getSummary('note-id')

    expect(result.success).toBe(true)
    expect(result.summary).toBeNull()
  })

  it('요약이 있으면 최신 요약을 반환한다', async () => {
    const mockCreateClient = createClient as any
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: { user: { id: 'user-id' } },
            error: null,
          })
        ),
      },
    })

    const mockDb = db as any
    
    let selectCallCount = 0
    mockDb.select.mockImplementation(() => {
      selectCallCount++
      if (selectCallCount === 1) {
        // 노트 조회
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn(() =>
                Promise.resolve([
                  {
                    id: 'note-id',
                    userId: 'user-id',
                    content: '테스트 노트',
                  },
                ])
              ),
            })),
          })),
        }
      } else {
        // 요약 조회
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => ({
                limit: vi.fn(() =>
                  Promise.resolve([
                    {
                      id: 'summary-id',
                      noteId: 'note-id',
                      userId: 'user-id',
                      summary: '- 요약 포인트 1\n- 요약 포인트 2',
                      model: 'gemini-2.0-flash',
                      createdAt: new Date(),
                    },
                  ])
                ),
              })),
            })),
          })),
        }
      }
    })

    const result = await getSummary('note-id')

    expect(result.success).toBe(true)
    expect(result.summary).toBeDefined()
    expect(result.summary?.summary).toContain('요약 포인트')
  })
})

