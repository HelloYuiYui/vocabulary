import type { Copy } from '../types.ts'

export const copy: Copy = {
  header: {
    eyebrow: 'DELF · A1 → B1',
    title: 'Cahier de vocabulaire',
    intro: (
      <>
        On te donne le mot en anglais, tu l'écris en français. Les accents et
        les articles comptent. Quand l'article cache le genre, comme dans{' '}
        <em>l'escalier</em> ou <em>les charges</em>, choisis masculin ou féminin
        à côté de ta réponse. Les mots ratés vont dans ta liste « à revoir ».
      </>
    ),
  },
  home: {
    chooseThemes: 'Choisis tes thèmes',
    start: 'Commencer',
    noTheme: 'Aucun thème choisi',
    selection: (themes, questions, total) =>
      `${themes} thème${themes > 1 ? 's' : ''} · ${questions}${total ? `/${total}` : ''} questions`,
    mode: { label: 'Mode', cards: 'Une par une', list: 'Liste' },
    itemFilter: {
      label: 'Questions',
      word: 'Mots',
      sentence: 'Phrases',
      all: 'Les deux',
    },
    sessionLimit: { label: 'Limite de session', all: 'Tout' },
  },
  review: {
    summary: (count) => (
      <>Tu as {count} mots à revoir de tes sessions précédentes.</>
    ),
    start: 'Réviser ces mots',
    clear: 'Vider la liste',
  },
  themeCard: {
    stats: (words, sentences) => `${words} mots · ${sentences} phrases`,
    lastScore: (right, total) => ` · dernier score ${right}/${total}`,
    show: 'Voir les mots',
    hide: 'Cacher les mots',
  },
  card: {
    prompt: 'En français :',
    answerLabel: (en) =>
      /^(the|a|an) /i.test(en) ? "Ta réponse, avec l'article" : 'Ta réponse',
    placeholder: 'écris ici…',
    check: 'Vérifier',
    dunno: 'Je ne sais pas',
    next: 'Suivant ↵',
    stop: 'Arrêter et voir le bilan',
  },
  list: {
    eyebrow: 'Exercice · traduis en français',
    help: "Entrée corrige la ligne et passe à la suivante. Tu peux aussi tout remplir puis tout corriger d'un coup.",
    progress: (answered, total, right) =>
      `${answered} / ${total} corrigées · ${right} justes`,
    checkAll: 'Tout corriger',
  },
  verdicts: {
    ok: 'Juste !',
    accent: 'Juste, mais attention aux accents.',
    elision: "Juste, et le genre est bon. Avec l'article défini, on écrit :",
    'gender-missing':
      "Presque : l'article ne montre pas le genre, choisis masculin ou féminin.",
    gender: 'Presque : le mot est bon, mais pas le genre.',
    article: "Presque : vérifie l'article ou le genre.",
    bad: 'Pas tout à fait.',
    dunno: 'Voici la réponse.',
    empty: 'Pas de réponse.',
  },
  alsoAccepted: 'Aussi accepté :',
  override: 'En fait, ma réponse était juste',
  gender: {
    label: 'Genre',
    m: { short: 'M', long: 'masculin' },
    f: { short: 'F', long: 'féminin' },
  },
  results: {
    title: 'Bilan',
    scoreLine: (right, done) => {
      if (done === 0) return 'Aucune réponse cette fois.'
      if (right === done)
        return 'Sans faute. Ce thème est acquis, passe au suivant.'
      if (right / done >= 0.7)
        return 'Bonne base. Garde les mots ci-dessous dans ta liste.'
      return 'Ce thème mérite une session de plus. Commence par les mots ci-dessous.'
    },
    yourAnswers: 'Tes réponses',
    retry: 'Refaire les mots ratés',
    copyForAnki: 'Copier pour Anki',
    copied: 'Copié : une carte par ligne, séparée par une tabulation.',
    copyBox: 'Liste à copier',
  },
  backToThemes: 'Retour aux thèmes',
  languageLabel: 'Langue',
}
