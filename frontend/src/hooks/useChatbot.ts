import { useActionState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface ChatMessage {
  id: string
  question: string
  answer: string
  sources: string[]
  timestamp: number
  processingTime?: number
}

export interface ChatbotResponse {
  question: string
  answer: string
  sources: string[]
  processing_time: number
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

  // Get current chat history from cache
  const { data: messages = [] } = useQuery({
    queryKey: chatKeys.history(),
    queryFn: () => [] as ChatMessage[],
    initialData: [],
  })

  // Mutation for sending message
  const mutation = useMutation({
    mutationFn: (question: string) =>
      api.post<ChatbotResponse>('/api/ai/chatbot/query', { question }),
    onMutate: async (question) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: chatKeys.history() })

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData<ChatMessage[]>(chatKeys.history()) || []

      // Optimistically add user message
      const tempMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        question,
        answer: 'Thinking...',
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

  const submitAction = async (
    _prevState: { error?: string } | undefined,
    formData: FormData
  ): Promise<{ error?: string }> => {
    const question = formData.get('question') as string

    if (!question?.trim()) {
      return { error: 'Please enter a question' }
    }

    try {
      sendMessage(question)
      return {}
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to send message',
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
