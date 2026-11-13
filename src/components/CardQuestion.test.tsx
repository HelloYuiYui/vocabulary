import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { fr } from '../data/fr/index.ts'
import { pathCopy } from '../data/fr/pathCopy.ts'
import { a, cloze, word } from '../data/helpers.ts'
import type { GradeResult } from '../domain/grade.ts'
import type { Draft, Response } from '../domain/session.ts'
import type { Item } from '../domain/types.ts'
import { CardQuestion } from './CardQuestion.tsx'
import { LanguageContext } from './languageContext.ts'

const TRANSLATION = 'She is a wonderful mother.'
const mere = cloze(
  'mere',
  'the mother',
  [a('la mère')],
  "C'est {une mère} formidable.",
  TRANSLATION,
  { audio: 'mere.mp3' },
)
const silent = cloze('pere', 'the father', [a('le père')], '{Le père}.', 'x')
const salon = word('the living room', [a('le salon')])

const answered = (item: Item, result: GradeResult): Response => ({
  entry: { themeId: 't', item },
  input: 'x',
  gender: null,
  result,
  overridden: false,
})

const show = (
  item: Item,
  response?: Response,
  withPath = true,
  onAnswer: (draft: Draft) => void = () => {},
) =>
  render(
    <LanguageContext value={fr}>
      <CardQuestion
        entry={{ themeId: 't', item }}
        response={response}
        onAnswer={onAnswer}
        onDunno={() => {}}
        onNext={() => {}}
        onOverride={() => {}}
        pathCopy={withPath ? pathCopy : undefined}
      />
    </LanguageContext>,
  )

const listen = () => screen.queryByRole('button', { name: 'Écouter la phrase' })
const sentence = () => screen.getByTestId('cloze-sentence').textContent

describe('a cloze card', () => {
  it('shows the sentence with the hint in the blank, and nothing that gives it away', () => {
    show(mere)
    expect(screen.getByText('Complète la phrase')).toBeInTheDocument()
    expect(sentence()).toBe("C'est the mother formidable.")
    expect(screen.queryByText(/une mère/)).toBeNull()
    expect(screen.queryByText(TRANSLATION)).toBeNull()
    expect(listen()).toBeNull()
  })

  it('labels and focuses the answer box', () => {
    show(mere)
    expect(screen.getByLabelText("Ta réponse, avec l'article")).toHaveFocus()
  })

  it('shows the full sentence, the translation and the audio button once answered', () => {
    show(mere, answered(mere, { verdict: 'ok', answer: { text: 'une mère' } }))
    expect(sentence()).toBe("C'est une mère formidable.")
    expect(screen.getByText(TRANSLATION)).toBeInTheDocument()
    expect(listen()).toBeInTheDocument()
  })

  it('reveals the same things after "je ne sais pas"', () => {
    const result: GradeResult = { verdict: 'dunno', answer: mere.answers[0] }
    show(mere, answered(mere, result))
    expect(sentence()).toBe("C'est une mère formidable.")
    expect(screen.getByText(TRANSLATION)).toBeInTheDocument()
  })

  it('shows no audio button when the sentence has no file', () => {
    show(
      silent,
      answered(silent, { verdict: 'ok', answer: { text: 'Le père' } }),
    )
    expect(listen()).toBeNull()
  })

  it('shows the form the sentence needed when another form was accepted', () => {
    const result: GradeResult = {
      verdict: 'ok',
      answer: { text: 'la mère' },
      form: { text: 'une mère' },
    }
    show(mere, answered(mere, result))
    expect(screen.getByText('Dans la phrase :')).toBeInTheDocument()
    expect(screen.getByTestId('needed-form')).toHaveTextContent('une mère')
  })

  it('does not list the sentence form again among the other accepted answers', () => {
    const nom = cloze(
      'nom',
      'the surname',
      [a('le nom'), a('le nom de famille'), a('le patronyme')],
      'Martin est {le nom de famille} de Paul.',
      "Martin is Paul's surname.",
    )
    const result: GradeResult = {
      verdict: 'ok',
      answer: { text: 'le nom' },
      form: { text: 'le nom de famille' },
    }
    show(nom, answered(nom, result))
    expect(screen.getByTestId('needed-form')).toHaveTextContent(
      'le nom de famille',
    )
    const also = screen.getByText(/Aussi accepté/)
    expect(also).toHaveTextContent('le patronyme')
    expect(also).not.toHaveTextContent('le nom de famille')
  })

  it('does not mention the form when the sentence form was typed', () => {
    show(mere, answered(mere, { verdict: 'ok', answer: { text: 'une mère' } }))
    expect(screen.queryByText('Dans la phrase :')).toBeNull()
  })
})

describe('a card without a sentence', () => {
  it('renders as before', () => {
    show(salon)
    expect(screen.getByText('the living room')).toBeInTheDocument()
    expect(screen.queryByText('Complète la phrase')).toBeNull()
    expect(screen.queryByTestId('cloze-sentence')).toBeNull()
  })
})

describe('a cloze item on the old picker', () => {
  it('is asked from its English prompt, without its sentence', () => {
    show(mere, undefined, false)
    expect(screen.getByText('the mother')).toBeInTheDocument()
    expect(screen.queryByTestId('cloze-sentence')).toBeNull()
  })
})

describe('an answer whose article hides the gender', () => {
  const oncle = cloze(
    'oncle',
    'the uncle',
    [a("l'oncle", 'm')],
    "{L'oncle} de Marie habite en Italie.",
    "Marie's uncle lives in Italy.",
    { gender: 'm' },
  )
  const PICK = 'Choisis masculin ou féminin avant de vérifier.'

  it('is not submitted until a gender is picked', async () => {
    const onAnswer = vi.fn()
    const user = userEvent.setup()
    show(oncle, undefined, true, onAnswer)
    await user.type(screen.getByRole('textbox'), "l'oncle{Enter}")
    expect(onAnswer).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(PICK)

    await user.click(screen.getByRole('button', { name: 'Vérifier' }))
    expect(onAnswer).not.toHaveBeenCalled()
  })

  it('is submitted with the gender once one is picked', async () => {
    const onAnswer = vi.fn()
    const user = userEvent.setup()
    show(oncle, undefined, true, onAnswer)
    await user.type(screen.getByRole('textbox'), "l'oncle{Enter}")
    await user.click(screen.getByRole('radio', { name: 'M' }))
    expect(screen.queryByRole('alert')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Vérifier' }))
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith({
      input: "l'oncle",
      gender: 'm',
    })
  })

  it('does not ask for a gender the answer does not hide', async () => {
    const onAnswer = vi.fn()
    const user = userEvent.setup()
    show(mere, undefined, true, onAnswer)
    await user.type(screen.getByRole('textbox'), 'une mère{Enter}')
    expect(onAnswer).toHaveBeenCalledOnce()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('drops the reminder when the article is typed away', async () => {
    const user = userEvent.setup()
    show(oncle)
    const box = screen.getByRole('textbox')
    await user.type(box, "l'oncle{Enter}")
    expect(screen.getByRole('alert')).toBeInTheDocument()
    await user.clear(box)
    await user.type(box, 'un oncle')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('still lets the learner say they do not know', async () => {
    const onDunno = vi.fn()
    const user = userEvent.setup()
    render(
      <LanguageContext value={fr}>
        <CardQuestion
          entry={{ themeId: 't', item: oncle }}
          response={undefined}
          onAnswer={() => {}}
          onDunno={onDunno}
          onNext={() => {}}
          onOverride={() => {}}
          pathCopy={pathCopy}
        />
      </LanguageContext>,
    )
    await user.type(screen.getByRole('textbox'), "l'")
    await user.click(screen.getByRole('button', { name: 'Je ne sais pas' }))
    expect(onDunno).toHaveBeenCalledOnce()
  })

  it('is submitted as before on the old picker, and graded "presque"', async () => {
    const onAnswer = vi.fn()
    const user = userEvent.setup()
    show(oncle, undefined, false, onAnswer)
    await user.type(screen.getByRole('textbox'), "l'oncle{Enter}")
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith({
      input: "l'oncle",
      gender: null,
    })
  })
})
