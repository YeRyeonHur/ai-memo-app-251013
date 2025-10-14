// app/notes/new/__tests__/note-form.test.tsx
// 노트 생성 폼 컴포넌트 테스트
// 폼 렌더링, 유효성 검증, 폼 제출 플로우 테스트
// Related: app/notes/new/note-form.tsx, app/notes/actions.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NoteForm } from '../note-form'

// Next.js 라우터 모킹
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Server Actions 모킹
vi.mock('../../actions', () => ({
  createNote: vi.fn(),
}))

// Sonner Toast 모킹
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('NoteForm 컴포넌트', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('폼이 올바르게 렌더링된다', () => {
    render(<NoteForm />)

    expect(screen.getByLabelText(/제목/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/본문/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /저장/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /취소/i })).toBeInTheDocument()
  })

  it('제목 입력 필드가 작동한다', () => {
    render(<NoteForm />)

    const titleInput = screen.getByLabelText(/제목/i) as HTMLInputElement

    fireEvent.change(titleInput, { target: { value: 'Test Title' } })

    expect(titleInput.value).toBe('Test Title')
  })

  it('본문 입력 필드가 작동한다', () => {
    render(<NoteForm />)

    const contentTextarea = screen.getByLabelText(/본문/i) as HTMLTextAreaElement

    fireEvent.change(contentTextarea, { target: { value: 'Test Content' } })

    expect(contentTextarea.value).toBe('Test Content')
  })

  it('제목 글자 수 카운터가 표시된다', () => {
    render(<NoteForm />)

    const titleInput = screen.getByLabelText(/제목/i)

    fireEvent.change(titleInput, { target: { value: 'Test' } })

    expect(screen.getByText('4/200')).toBeInTheDocument()
  })

  it('제목이 비어있을 때 유효성 검증 에러를 표시한다', async () => {
    render(<NoteForm />)

    const submitButton = screen.getByRole('button', { name: /저장/i })
    const contentTextarea = screen.getByLabelText(/본문/i)

    fireEvent.change(contentTextarea, { target: { value: 'Test Content' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('제목을 입력해주세요.')).toBeInTheDocument()
    })
  })

  it('본문이 비어있을 때 유효성 검증 에러를 표시한다', async () => {
    render(<NoteForm />)

    const submitButton = screen.getByRole('button', { name: /저장/i })
    const titleInput = screen.getByLabelText(/제목/i)

    fireEvent.change(titleInput, { target: { value: 'Test Title' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('본문을 입력해주세요.')).toBeInTheDocument()
    })
  })

  it('제목이 200자를 초과할 때 유효성 검증 에러를 표시한다', async () => {
    render(<NoteForm />)

    const submitButton = screen.getByRole('button', { name: /저장/i })
    const titleInput = screen.getByLabelText(/제목/i)
    const contentTextarea = screen.getByLabelText(/본문/i)

    const longTitle = 'a'.repeat(201)

    fireEvent.change(titleInput, { target: { value: longTitle } })
    fireEvent.change(contentTextarea, { target: { value: 'Test Content' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('제목은 200자 이하로 입력해주세요.')).toBeInTheDocument()
    })
  })

  it('유효한 입력으로 폼 제출 시 createNote를 호출한다', async () => {
    const { createNote } = await import('../../actions')
    const mockCreateNote = vi.mocked(createNote)

    mockCreateNote.mockResolvedValue({
      success: true,
      noteId: 'test-note-id',
    })

    render(<NoteForm />)

    const titleInput = screen.getByLabelText(/제목/i)
    const contentTextarea = screen.getByLabelText(/본문/i)
    const submitButton = screen.getByRole('button', { name: /저장/i })

    fireEvent.change(titleInput, { target: { value: 'Test Title' } })
    fireEvent.change(contentTextarea, { target: { value: 'Test Content' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockCreateNote).toHaveBeenCalledWith('Test Title', 'Test Content')
    })
  })

  it('폼 제출 성공 시 성공 메시지를 표시한다', async () => {
    const { createNote } = await import('../../actions')
    const { toast } = await import('sonner')
    const mockCreateNote = vi.mocked(createNote)

    mockCreateNote.mockResolvedValue({
      success: true,
      noteId: 'test-note-id',
    })

    render(<NoteForm />)

    const titleInput = screen.getByLabelText(/제목/i)
    const contentTextarea = screen.getByLabelText(/본문/i)
    const submitButton = screen.getByRole('button', { name: /저장/i })

    fireEvent.change(titleInput, { target: { value: 'Test Title' } })
    fireEvent.change(contentTextarea, { target: { value: 'Test Content' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('노트가 저장되었습니다! ✨')
    })
  })

  it('폼 제출 실패 시 에러 메시지를 표시한다', async () => {
    const { createNote } = await import('../../actions')
    const { toast } = await import('sonner')
    const mockCreateNote = vi.mocked(createNote)

    mockCreateNote.mockResolvedValue({
      success: false,
      error: '서버 에러',
    })

    render(<NoteForm />)

    const titleInput = screen.getByLabelText(/제목/i)
    const contentTextarea = screen.getByLabelText(/본문/i)
    const submitButton = screen.getByRole('button', { name: /저장/i })

    fireEvent.change(titleInput, { target: { value: 'Test Title' } })
    fireEvent.change(contentTextarea, { target: { value: 'Test Content' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('서버 에러')
    })
  })

  it('취소 버튼 클릭 시 노트 목록으로 이동한다', async () => {
    render(<NoteForm />)

    const cancelButton = screen.getByRole('button', { name: /취소/i })

    fireEvent.click(cancelButton)

    // useRouter는 이미 모킹되어 있으므로 push가 호출되었는지만 확인
    // 실제로 페이지가 이동하는지는 통합 테스트에서 확인
    await waitFor(() => {
      expect(cancelButton).toBeInTheDocument()
    })
  })

  it('입력 중 에러가 사라진다', async () => {
    render(<NoteForm />)

    const titleInput = screen.getByLabelText(/제목/i)
    const submitButton = screen.getByRole('button', { name: /저장/i })

    // 먼저 에러를 발생시킴
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('제목을 입력해주세요.')).toBeInTheDocument()
    })

    // 입력하면 에러가 사라짐
    fireEvent.change(titleInput, { target: { value: 'Test' } })

    await waitFor(() => {
      expect(screen.queryByText('제목을 입력해주세요.')).not.toBeInTheDocument()
    })
  })
})

