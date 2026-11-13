import type { PathCopy } from '../data/types.ts'
import type { GrammarNote } from '../domain/types.ts'
import { Actions } from './Actions.tsx'
import { Button } from './Button.tsx'
import { Eyebrow } from './Eyebrow.tsx'
import { Notebook } from './Notebook.tsx'

interface GrammarNoteCardProps {
  note: GrammarNote
  copy: PathCopy
  onContinue: () => void
}

/** A theme's grammar note as a reference card: rule, table, exceptions. */
export function GrammarNoteCard({
  note,
  copy,
  onContinue,
}: GrammarNoteCardProps) {
  return (
    <section>
      <Notebook>
        <div>
          <Eyebrow>{copy.note}</Eyebrow>
          <h2>{note.title}</h2>
        </div>
        <p lang="en" className="max-w-[62ch] text-text">
          {note.rule}
        </p>
        {note.table && (
          <div className="overflow-x-auto">
            <table className="border-collapse text-[0.95rem]">
              <thead>
                <tr>
                  {note.table.head.map((cell, i) => (
                    <th
                      key={i}
                      scope="col"
                      className="border-[1.5px] border-line px-3 py-1 text-left text-[0.85rem] text-muted"
                    >
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {note.table.rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) =>
                      c === 0 ? (
                        <th
                          key={c}
                          scope="row"
                          className="border-[1.5px] border-line px-3 py-1 text-left font-normal text-muted"
                        >
                          {cell}
                        </th>
                      ) : (
                        <td
                          key={c}
                          className="border-[1.5px] border-line px-3 py-1 font-hand text-[1.15rem] text-ink"
                        >
                          {cell}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {note.exceptions && note.exceptions.length > 0 && (
          <ul lang="en" className="max-w-[62ch] list-disc pl-5 text-text">
            {note.exceptions.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        )}
        <Actions>
          <Button variant="primary" autoFocus onClick={onContinue}>
            {copy.noteContinue}
          </Button>
        </Actions>
      </Notebook>
    </section>
  )
}
