import { useActionState } from 'react'
// Note: useActionState is used in useChatForm below
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'

export interface ChatMessage {
  readonly id: string
  readonly question: string
  readonly answer: string
  readonly sources: string[]
  readonly timestamp: number
  readonly processingTime?: number
}

export interface ChatbotResponse {
  readonly question: string
  readonly answer: string
  readonly sources: string[]
  readonly processing_time: number
}

const STATIC_DOCUMENTS_KEY = 'businessai.static.documents'

interface StoredDocument {
  readonly id: number
  readonly filename: string
  readonly extractedText?: string
  readonly fileType?: string
}

/** Read localStorage documents so the live backend can also receive their text as context */
function getLocalDocumentContext(): string {
  try {
    const raw = globalThis.localStorage?.getItem(STATIC_DOCUMENTS_KEY)
    if (!raw) return ''
    const docs = JSON.parse(raw) as StoredDocument[]
    const withText = docs.filter((d) => d.extractedText?.trim())
    if (withText.length === 0) return ''
    return withText
      .map((d) => `[${d.filename}]: ${d.extractedText?.slice(0, 500)}`)
      .join('\n---\n')
  } catch {
    return ''
  }
}

// Query keys
export const chatKeys = {
  all: ['chat'] as const,
  history: () => [...chatKeys.all, 'history'] as const,
}

/**
 * Hook to send chatbot query
 */
export function useChatbot() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  // Get current chat history from cache
  const { data: messages = [] } = useQuery({
    queryKey: chatKeys.history(),
    queryFn: () => [] as ChatMessage[],
    initialData: [],
  })

  // Mutation for sending message
  const mutation = useMutation({
    mutationFn: (question: string) => {
      const documentContext = getLocalDocumentContext()
      return api.post<ChatbotResponse>('/api/ai/chatbot/query', {
        question,
        // Pass document context to live backend when documents have been uploaded
        ...(documentContext ? { documentContext } : {}),
      })
    },
    onMutate: async (question) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: chatKeys.history() })

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData<ChatMessage[]>(chatKeys.history()) || []

      // Optimistically add user message
      const tempMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        question,
        answer: t('chatbot.thinking'),
        sources: [],
        timestamp: Date.now(),
      }

      queryClient.setQueryData<ChatMessage[]>(chatKeys.history(), [...previousMessages, tempMessage])

      return { previousMessages }
    },
    onSuccess: (data, _question, context) => {
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        question: data.question,
        answer: data.answer,
        sources: data.sources,
        timestamp: Date.now(),
        processingTime: data.processing_time,
      }

      // Replace temp message with real data
      const previousMessages = context?.previousMessages || []
      queryClient.setQueryData<ChatMessage[]>(chatKeys.history(), [...previousMessages, newMessage])
    },
    onError: (_error, _question, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(chatKeys.history(), context.previousMessages)
      }
    },
  })

  const sendMessage = (question: string) => {
    mutation.mutate(question)
  }

  return {
    messages,
    sendMessage,
    isLoading: mutation.isPending,
    error: mutation.error,
  }
}

/**
 * Hook using useActionState for form handling (React 19)
 */
export function useChatForm() {
  const { sendMessage } = useChatbot()
  const { t } = useTranslation()

  const submitAction = async (
    _prevState: { error?: string } | undefined,
    formData: FormData
  ): Promise<{ error?: string }> => {
    const question = formData.get('question') as string

    if (!question?.trim()) {
      return { error: t('chatbot.validation.required') }
    }

    try {
      sendMessage(question)
      return {}
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : t('chatbot.validation.failed'),
      }
    }
  }

  const [state, formAction] = useActionState(submitAction, { error: undefined })

  return {
    formAction,
    error: state?.error,
  }
}

/**
 * Hook to get chat history
 */
export function useChatHistory() {
  return useQuery({
    queryKey: chatKeys.history(),
    queryFn: () => {
      // In a real app, this would fetch from backend
      // For now, return empty array as we're using client-side state
      return [] as ChatMessage[]
    },
    initialData: [],
  })
}
