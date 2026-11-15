import type { PathCopy } from '../types.ts'

export const pathCopy: PathCopy = {
  intro:
    "Suis le parcours, thème par thème. Dans chaque phrase, écris en français le mot qui manque. Les accents et les articles comptent. Quand l'article cache le genre, comme dans « l'escalier » ou « les charges », choisis masculin ou féminin à côté de ta réponse. Les cartes apprises reviennent plus tard, pour les revoir.",
  sentencePrompt: 'Complète la phrase',
  formNeeded: 'Dans la phrase :',
  pickGender: 'Choisis masculin ou féminin avant de vérifier.',
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
  backToPath: 'Retour au parcours',
  exportSitting: 'Exporter ces cartes (CSV)',
  exportLearnt: 'Exporter les cartes apprises (CSV)',
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
