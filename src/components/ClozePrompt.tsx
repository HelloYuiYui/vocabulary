import type { PathCopy } from '../data/types.ts'
import { parseSentence } from '../domain/sentence.ts'
import type { Sentence } from '../domain/types.ts'
import { AudioButton } from './AudioButton.tsx'

interface ClozePromptProps {
  sentence: Sentence
  hint: string // the English word shown in the blank
  revealed: boolean
  copy: PathCopy
}

/**
 * A cloze card's sentence. Before the answer the blank holds the English
 * hint; afterwards it holds the word, and the translation and the audio
 * button appear.
 */
export function ClozePrompt({
  sentence,
  hint,
  revealed,
  copy,
}: ClozePromptProps) {
  const parts = parseSentence(sentence.text)
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[0.8rem] tracking-[0.08em] text-muted uppercase">
        {copy.sentencePrompt}
      </p>
      <p
        data-testid="cloze-sentence"
        className="font-display text-[clamp(1.25rem,3.6vw,1.75rem)] leading-[1.35] font-bold text-text"
      >
        {parts?.before}
        {revealed ? (
          <span className="font-hand font-normal text-ink">{parts?.blank}</span>
        ) : (
          <span className="rounded-md border-[1.5px] border-dashed border-ink px-2 py-0.5 text-[0.8em] font-normal text-muted">
            {hint}
          </span>
        )}
        {parts?.after}
      </p>
      {revealed && (
        <p className="flex flex-wrap items-center gap-2 text-[0.95rem] text-muted">
          <span>{sentence.en}</span>
          {sentence.audio && (
            <AudioButton file={sentence.audio} label={copy.listen} />
          )}
        </p>
      )}
    </div>
  )
}
