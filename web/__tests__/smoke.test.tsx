import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

// Trivial smoke test — verifies vitest + jsdom + @testing-library/react wire up correctly.
// Does NOT import any Next.js App Router components to avoid server-component constraints.
function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}</h1>
}

describe('smoke', () => {
  it('renders a greeting', () => {
    render(<Greeting name="Artifact Atlas" />)
    expect(screen.getByRole('heading', { name: /hello, artifact atlas/i })).toBeInTheDocument()
  })

  it('vitest globals are available', () => {
    expect(1 + 1).toBe(2)
  })
})
