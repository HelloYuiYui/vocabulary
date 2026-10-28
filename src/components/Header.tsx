import { Eyebrow } from './Eyebrow.tsx'

export function Header() {
  return (
    <header>
      <Eyebrow>DELF · A1 → B1</Eyebrow>
      <h1>Cahier de vocabulaire</h1>
      <p className="mt-2.5 max-w-[62ch] text-muted">
        On te donne le mot en anglais, tu l'écris en français. Les accents et
        les articles comptent. Quand l'article cache le genre, comme dans{' '}
        <em>l'escalier</em> ou <em>les charges</em>, choisis masculin ou féminin
        à côté de ta réponse. Les mots ratés vont dans ta liste « à revoir ».
      </p>
    </header>
  )
}
