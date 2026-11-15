/** Hands the viewer a text file to save, without leaving the page. */
export function downloadText(name: string, text: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

/** Saves cards as a CSV file in the [[word:hint]] format. */
export const downloadCsv = (name: string, csv: string): void =>
  downloadText(name, csv, 'text/csv;charset=utf-8')
