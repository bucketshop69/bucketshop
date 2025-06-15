/**
 * Simple test to verify basic Jest setup
 */

import { describe, it, expect } from '@jest/globals'

describe('Basic Jest Setup', () => {
  it('should run a simple test', () => {
    expect(2 + 2).toBe(4)
  })

  it('should support TypeScript', () => {
    const greeting = (name: string): string => `Hello, ${name}!`
    expect(greeting('Jest')).toBe('Hello, Jest!')
  })
})