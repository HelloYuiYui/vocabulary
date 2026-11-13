import type { PathCopy } from '../types.ts'

export const pathCopy: PathCopy = {
  sentencePrompt: 'Complète la phrase',
  formNeeded: 'Dans la phrase :',
  listen: 'Écouter la phrase',
  review: (count) =>
    count === 1 ? '1 carte à revoir' : `${count} cartes à revoir`,
  cards: (count) => (count === 1 ? '1 carte' : `${count} cartes`),
  left: (count) => (count === 1 ? 'reste 1 carte' : `restent ${count} cartes`),
  leave: 'Arrêter',
  subThemeDone: 'fait',
  locked: 'À venir',
  quiz: 'Je connais déjà ce thème',
  quizHelp:
    'Un test de 20 cartes au plus, sans second essai. 80 % ouvre le thème suivant.',
  note: 'Note de grammaire',
  noteContinue: 'Continuer',
  legacy: 'Autres thèmes',
  backToPath: 'Retour au parcours',
  end: {
    title: 'Séance terminée',
    allFirstTry: 'Toutes les cartes du premier coup.',
    retried: (count) =>
      count === 1
        ? '1 carte a demandé plus d’un essai.'
        : `${count} cartes ont demandé plus d’un essai.`,
    quizPassed: (right, total) => `${right}/${total} : thème passé.`,
    quizFailed: (right, total) => `${right}/${total} : le thème reste à faire.`,
  },
}
