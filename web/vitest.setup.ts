import '@testing-library/jest-dom'
import { vi } from 'vitest'

// jsdom has no layout engine, so scrolling is a no-op in component tests.
if (typeof HTMLElement.prototype.scrollIntoView !== 'function') {
  HTMLElement.prototype.scrollIntoView = vi.fn()
}
