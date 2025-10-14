// app/notes/actions.test.ts
// 노트 관련 Server Actions 테스트
// createNote 함수의 유효성 검증, 인증 체크, DB 삽입 시나리오 테스트
// Related: app/notes/actions.ts, drizzle/schema.ts, lib/supabase/server.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createNote } from './actions'

// Supabase 클라이언트 모킹
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Drizzle DB 모킹
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(),
  },
}))

// Next.js 함수 모킹
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

describe('createNote Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('제목이 비어있으면 에러를 반환한다', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const mockCreateClient = vi.mocked(createClient)

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as any)

    const result = await createNote('', 'test content')

    expect(result.success).toBe(false)
    expect(result.error).toBe('제목을 입력해주세요.')
  })

  it('제목이 공백만 있으면 에러를 반환한다', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const mockCreateClient = vi.mocked(createClient)

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as any)

    const result = await createNote('   ', 'test content')

    expect(result.success).toBe(false)
    expect(result.error).toBe('제목을 입력해주세요.')
  })

  it('제목이 200자를 초과하면 에러를 반환한다', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const mockCreateClient = vi.mocked(createClient)

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as any)

    const longTitle = 'a'.repeat(201)
    const result = await createNote(longTitle, 'test content')

    expect(result.success).toBe(false)
    expect(result.error).toBe('제목은 200자 이하로 입력해주세요.')
  })

  it('본문이 비어있으면 에러를 반환한다', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const mockCreateClient = vi.mocked(createClient)

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as any)

    const result = await createNote('test title', '')

    expect(result.success).toBe(false)
    expect(result.error).toBe('본문을 입력해주세요.')
  })

  it('본문이 공백만 있으면 에러를 반환한다', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const mockCreateClient = vi.mocked(createClient)

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as any)

    const result = await createNote('test title', '   ')

    expect(result.success).toBe(false)
    expect(result.error).toBe('본문을 입력해주세요.')
  })

  it('비인증 사용자는 노트를 생성할 수 없다', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const mockCreateClient = vi.mocked(createClient)

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' },
        }),
      },
    } as any)

    const result = await createNote('test title', 'test content')

    expect(result.success).toBe(false)
    expect(result.error).toBe('인증되지 않은 사용자입니다. 다시 로그인해주세요.')
  })

  it('유효한 입력으로 노트를 생성하면 성공을 반환한다', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const { db } = await import('@/lib/db')
    const mockCreateClient = vi.mocked(createClient)
    const mockDb = vi.mocked(db)

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as any)

    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'new-note-id' }]),
      }),
    })

    mockDb.insert = mockInsert

    const result = await createNote('test title', 'test content')

    expect(result.success).toBe(true)
    expect(result.noteId).toBe('new-note-id')
    expect(mockInsert).toHaveBeenCalled()
  })

  it('DB 삽입 실패 시 에러를 반환한다', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const { db } = await import('@/lib/db')
    const mockCreateClient = vi.mocked(createClient)
    const mockDb = vi.mocked(db)

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as any)

    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockRejectedValue(new Error('DB Error')),
      }),
    })

    mockDb.insert = mockInsert

    const result = await createNote('test title', 'test content')

    expect(result.success).toBe(false)
    expect(result.error).toBe('노트 저장에 실패했습니다. 잠시 후 다시 시도해주세요.')
  })
})

describe('getNotes Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('비인증 사용자는 노트 목록을 조회할 수 없다', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const mockCreateClient = vi.mocked(createClient)

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' },
        }),
      },
    } as any)

    const { getNotes } = await import('./actions')
    const result = await getNotes(1)

    expect(result.success).toBe(false)
    expect(result.error).toBe('인증되지 않은 사용자입니다. 다시 로그인해주세요.')
  })

  it('인증된 사용자의 노트만 조회한다', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const { db } = await import('@/lib/db')
    const mockCreateClient = vi.mocked(createClient)
    const mockDb = vi.mocked(db)

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as any)

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ value: 5 }]),
      }),
    })

    const mockSelectNotes = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockResolvedValue([
                {
                  id: '1',
                  userId: 'test-user-id',
                  title: 'Test Note',
                  content: 'Test Content',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              ]),
            }),
          }),
        }),
      }),
    })

    mockDb.select = vi
      .fn()
      .mockImplementationOnce(mockSelect)
      .mockImplementationOnce(mockSelectNotes)

    const { getNotes } = await import('./actions')
    const result = await getNotes(1)

    expect(result.success).toBe(true)
    expect(result.notes).toHaveLength(1)
    expect(result.notes?.[0].userId).toBe('test-user-id')
  })

  it('페이지네이션이 올바르게 동작한다', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const { db } = await import('@/lib/db')
    const mockCreateClient = vi.mocked(createClient)
    const mockDb = vi.mocked(db)

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as any)

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ value: 45 }]),
      }),
    })

    const mockSelectNotes = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    })

    mockDb.select = vi
      .fn()
      .mockImplementationOnce(mockSelect)
      .mockImplementationOnce(mockSelectNotes)

    const { getNotes } = await import('./actions')
    const result = await getNotes(1)

    expect(result.success).toBe(true)
    expect(result.pagination).toBeDefined()
    expect(result.pagination?.currentPage).toBe(1)
    expect(result.pagination?.totalPages).toBe(3) // 45 / 20 = 3
    expect(result.pagination?.totalNotes).toBe(45)
    expect(result.pagination?.pageSize).toBe(20)
  })

  it('페이지 번호가 음수이면 1로 처리한다', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const { db } = await import('@/lib/db')
    const mockCreateClient = vi.mocked(createClient)
    const mockDb = vi.mocked(db)

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as any)

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ value: 10 }]),
      }),
    })

    const mockSelectNotes = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    })

    mockDb.select = vi
      .fn()
      .mockImplementationOnce(mockSelect)
      .mockImplementationOnce(mockSelectNotes)

    const { getNotes } = await import('./actions')
    const result = await getNotes(-5)

    expect(result.success).toBe(true)
    expect(result.pagination?.currentPage).toBe(1)
  })
})

describe('getNoteById Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('비인증 사용자는 노트를 조회할 수 없다', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const mockCreateClient = vi.mocked(createClient)

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' },
        }),
      },
    } as any)

    const { getNoteById } = await import('./actions')
    const result = await getNoteById('test-note-id')

    expect(result.success).toBe(false)
    expect(result.error).toBe('인증되지 않은 사용자입니다. 다시 로그인해주세요.')
  })

  it('인증된 사용자는 자신의 노트를 조회할 수 있다', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const { db } = await import('@/lib/db')
    const mockCreateClient = vi.mocked(createClient)
    const mockDb = vi.mocked(db)

    const testNote = {
      id: 'test-note-id',
      userId: 'test-user-id',
      title: 'Test Note',
      content: 'Test Content',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as any)

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([testNote]),
        }),
      }),
    })

    mockDb.select = mockSelect

    const { getNoteById } = await import('./actions')
    const result = await getNoteById('test-note-id')

    expect(result.success).toBe(true)
    expect(result.note).toEqual(testNote)
    expect(result.note?.id).toBe('test-note-id')
  })

  it('다른 사용자의 노트는 조회할 수 없다 (null 반환)', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const { db } = await import('@/lib/db')
    const mockCreateClient = vi.mocked(createClient)
    const mockDb = vi.mocked(db)

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as any)

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    })

    mockDb.select = mockSelect

    const { getNoteById } = await import('./actions')
    const result = await getNoteById('other-user-note-id')

    expect(result.success).toBe(true)
    expect(result.note).toBeNull()
  })

  it('존재하지 않는 노트는 null을 반환한다', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const { db } = await import('@/lib/db')
    const mockCreateClient = vi.mocked(createClient)
    const mockDb = vi.mocked(db)

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as any)

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    })

    mockDb.select = mockSelect

    const { getNoteById } = await import('./actions')
    const result = await getNoteById('non-existent-note-id')

    expect(result.success).toBe(true)
    expect(result.note).toBeNull()
  })

  it('DB 조회 실패 시 에러를 반환한다', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const { db } = await import('@/lib/db')
    const mockCreateClient = vi.mocked(createClient)
    const mockDb = vi.mocked(db)

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as any)

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockRejectedValue(new Error('DB Error')),
        }),
      }),
    })

    mockDb.select = mockSelect

    const { getNoteById } = await import('./actions')
    const result = await getNoteById('test-note-id')

    expect(result.success).toBe(false)
    expect(result.error).toBe('노트를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.')
  })
})

describe('updateNote Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('비인증 사용자는 노트를 수정할 수 없다', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const mockCreateClient = vi.mocked(createClient)

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' },
        }),
      },
    } as any)

    const { updateNote } = await import('./actions')
    const result = await updateNote('test-note-id', 'Updated Title', 'Updated Content')

    expect(result.success).toBe(false)
    expect(result.error).toBe('인증되지 않은 사용자입니다. 다시 로그인해주세요.')
  })

  it('제목이 비어있으면 에러를 반환한다', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const mockCreateClient = vi.mocked(createClient)

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as any)

    const { updateNote } = await import('./actions')
    const result = await updateNote('test-note-id', '', 'Updated Content')

    expect(result.success).toBe(false)
    expect(result.error).toBe('제목을 입력해주세요.')
  })

  it('제목이 200자를 초과하면 에러를 반환한다', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const mockCreateClient = vi.mocked(createClient)

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as any)

    const { updateNote } = await import('./actions')
    const longTitle = 'a'.repeat(201)
    const result = await updateNote('test-note-id', longTitle, 'Updated Content')

    expect(result.success).toBe(false)
    expect(result.error).toBe('제목은 200자 이하로 입력해주세요.')
  })

  it('본문이 비어있으면 에러를 반환한다', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const mockCreateClient = vi.mocked(createClient)

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as any)

    const { updateNote } = await import('./actions')
    const result = await updateNote('test-note-id', 'Updated Title', '')

    expect(result.success).toBe(false)
    expect(result.error).toBe('본문을 입력해주세요.')
  })

  it('인증된 사용자는 자신의 노트를 수정할 수 있다', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const { db } = await import('@/lib/db')
    const mockCreateClient = vi.mocked(createClient)
    const mockDb = vi.mocked(db)

    const updatedNote = {
      id: 'test-note-id',
      userId: 'test-user-id',
      title: 'Updated Title',
      content: 'Updated Content',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as any)

    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updatedNote]),
        }),
      }),
    })

    mockDb.update = mockUpdate

    const { updateNote } = await import('./actions')
    const result = await updateNote('test-note-id', 'Updated Title', 'Updated Content')

    expect(result.success).toBe(true)
    expect(result.note).toEqual(updatedNote)
    expect(mockUpdate).toHaveBeenCalled()
  })

  it('다른 사용자의 노트는 수정할 수 없다', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const { db } = await import('@/lib/db')
    const mockCreateClient = vi.mocked(createClient)
    const mockDb = vi.mocked(db)

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as any)

    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    })

    mockDb.update = mockUpdate

    const { updateNote } = await import('./actions')
    const result = await updateNote('other-user-note-id', 'Updated Title', 'Updated Content')

    expect(result.success).toBe(false)
    expect(result.error).toBe('노트를 찾을 수 없거나 수정 권한이 없습니다.')
  })

  it('DB 업데이트 실패 시 에러를 반환한다', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const { db } = await import('@/lib/db')
    const mockCreateClient = vi.mocked(createClient)
    const mockDb = vi.mocked(db)

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as any)

    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue(new Error('DB Error')),
        }),
      }),
    })

    mockDb.update = mockUpdate

    const { updateNote } = await import('./actions')
    const result = await updateNote('test-note-id', 'Updated Title', 'Updated Content')

    expect(result.success).toBe(false)
    expect(result.error).toBe('노트 수정에 실패했습니다. 잠시 후 다시 시도해주세요.')
  })
})

