import { homeCopy as copy } from '../data/homeCopy.ts'
import type { Language } from '../data/types.ts'
import { Notebook } from './Notebook.tsx'
import { Page } from './Page.tsx'

interface HomePageProps {
  languages: Language[]
  onChoose: (language: Language) => void
}

/**
 * The entry point, in English: what the notebook is, why it works the way it
 * does, what it is not, and the choice of a language.
 */
export function HomePage({ languages, onChoose }: HomePageProps) {
  return (
    <Page>
      <header>
        <h1>{copy.title}</h1>
        <p className="mt-2.5 max-w-[62ch] text-muted">{copy.tagline}</p>
      </header>
      <Notebook>
        <p className="max-w-[62ch] text-[1.05rem]">{copy.intro}</p>
        <section className="flex flex-col gap-2">
          <h2>{copy.how.title}</h2>
          <ul className="flex max-w-[62ch] list-disc flex-col gap-1.5 pl-5">
            {copy.how.points.map((point) => (
              <li key={point.lead}>
                <strong>{point.lead}</strong>
                {point.rest}
              </li>
            ))}
          </ul>
        </section>
        <section className="flex flex-col gap-2">
          <h2>{copy.isnt.title}</h2>
          <p className="max-w-[62ch]">{copy.isnt.body}</p>
        </section>
        <section className="flex flex-col gap-2">
          <h2>{copy.expect.title}</h2>
          <p className="max-w-[62ch]">{copy.expect.body}</p>
        </section>
        <section className="flex flex-col gap-3">
          <h2>{copy.choose.title}</h2>
          <ul className="flex flex-col gap-2.5">
            {languages.map((language) => (
              <li key={language.code}>
                <LanguageChoice language={language} onChoose={onChoose} />
              </li>
            ))}
          </ul>
        </section>
      </Notebook>
    </Page>
  )
}

function LanguageChoice({
  language,
  onChoose,
}: {
  language: Language
  onChoose: (language: Language) => void
}) {
  const themes = language.path.themes.flatMap(
    (id) => language.themes.find((t) => t.id === id) ?? [],
  )
  const levels = [...new Set(themes.map((t) => t.level))]
  return (
    <button
      type="button"
      onClick={() => onChoose(language)}
      className="flex w-full max-w-[34rem] cursor-pointer flex-col items-start rounded-lg border-[1.5px] border-ink px-4 py-2.5 text-left hover:brightness-108"
    >
      <span lang={language.code} className="font-bold text-ink">
        {language.name}
      </span>
      <span className="text-[0.85rem] text-muted">
        {copy.summary(themes.length, levels, language.exam)}
      </span>
      {language.awaitingReview && (
        <span className="text-[0.85rem] text-muted">{copy.awaitingReview}</span>
      )}
    </button>
  )
}
