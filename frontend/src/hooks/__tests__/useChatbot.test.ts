import { describe, it, expect } from 'vitest'
import { chatKeys } from '../useChatbot'

describe('chatKeys', () => {
  it('all returns base key', () => {
    expect(chatKeys.all).toEqual(['chat'])
  })

  it('history returns history key', () => {
    expect(chatKeys.history()).toEqual(['chat', 'history'])
  })
})

describe('useChatbot hook exports', () => {
  it('exports useChatbot', async () => {
    const mod = await import('../useChatbot')
    expect(typeof mod.useChatbot).toBe('function')
  })

  it('exports useChatForm', async () => {
    const mod = await import('../useChatbot')
    expect(typeof mod.useChatForm).toBe('function')
  })

  it('exports useChatHistory', async () => {
    const mod = await import('../useChatbot')
    expect(typeof mod.useChatHistory).toBe('function')
  })
})
