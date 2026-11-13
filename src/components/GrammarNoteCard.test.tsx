import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { pathCopy } from '../data/fr/pathCopy.ts'
import type { GrammarNote } from '../domain/types.ts'
import { GrammarNoteCard } from './GrammarNoteCard.tsx'

const note: GrammarNote = {
  title: 'Être et avoir',
  rule: 'The two most common verbs.',
  table: {
    head: ['', 'être', 'avoir'],
    rows: [
      ['je', 'suis', "j'ai"],
      ['tu', 'es', 'as'],
    ],
  },
  exceptions: ['Age uses avoir: j’ai vingt ans.'],
}

describe('GrammarNoteCard', () => {
  it('shows the title, the rule, the table and the exceptions', () => {
    render(<GrammarNoteCard note={note} copy={pathCopy} onContinue={vi.fn()} />)
    expect(
      screen.getByRole('heading', { name: 'Être et avoir' }),
    ).toBeInTheDocument()
    expect(screen.getByText('The two most common verbs.')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(3)
    expect(screen.getByRole('cell', { name: 'suis' })).toBeInTheDocument()
    expect(screen.getByRole('listitem')).toHaveTextContent('Age uses avoir')
  })

  // The first column is not always English: here it holds French pronouns.
  it('does not mark the row headers as English', () => {
    render(<GrammarNoteCard note={note} copy={pathCopy} onContinue={vi.fn()} />)
    expect(screen.getByRole('rowheader', { name: 'je' })).not.toHaveAttribute(
      'lang',
    )
  })

  it('leaves out the table and the list when the note has none', () => {
    const bare = { title: 'T', rule: 'R' }
    render(<GrammarNoteCard note={bare} copy={pathCopy} onContinue={vi.fn()} />)
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('continues when asked', async () => {
    const onContinue = vi.fn()
    render(
      <GrammarNoteCard note={note} copy={pathCopy} onContinue={onContinue} />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Continuer' }))
    expect(onContinue).toHaveBeenCalledOnce()
  })
})
