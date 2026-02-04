import { describe, it, expect } from 'vitest'
import { normalizeProducts, extractJsonFromToolContent } from './commerce'

describe('normalizeProducts', () => {
  it('returns empty array for null/undefined', () => {
    expect(normalizeProducts(null)).toEqual([])
    expect(normalizeProducts(undefined)).toEqual([])
  })

  it('extracts products from results array', () => {
    const data = {
      results: [
        { id: '1', name: { en: 'Test Product' }, masterVariant: { sku: 'SKU1' } }
      ]
    }
    const result = normalizeProducts(data)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Test Product')
    expect(result[0].sku).toBe('SKU1')
  })

  it('formats price correctly', () => {
    const data = {
      results: [{
        id: '1',
        name: 'Product',
        masterVariant: {
          prices: [{ value: { centAmount: 1999, currencyCode: 'USD' } }]
        }
      }]
    }
    const result = normalizeProducts(data)
    expect(result[0].price).toBe('$19.99')
  })
})

describe('extractJsonFromToolContent', () => {
  it('extracts JSON from MCP tool content', () => {
    const content = [{ type: 'text', text: '{"foo":"bar"}' }]
    expect(extractJsonFromToolContent(content)).toEqual({ foo: 'bar' })
  })

  it('returns null for non-array', () => {
    expect(extractJsonFromToolContent('not array' as any)).toBeNull()
  })
})
