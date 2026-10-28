import type { Answer, Gender, Theme } from '../domain/types.ts'

/** Builds an answer; pass a gender only when the article hides it (l', les). */
export const a = (text: string, gender?: Gender): Answer =>
  gender ? { text, gender } : { text }

export const chezSoi: Theme = {
  id: 'chez-soi',
  name: 'Chez soi',
  level: 'A1',
  desc: 'Les pièces, les meubles, dire où tu habites.',
  items: [
    { en: 'the living room', fr: [a('le salon'), a('le séjour')] },
    { en: 'the bedroom', fr: [a('la chambre'), a('la chambre à coucher')] },
    { en: 'the kitchen', fr: [a('la cuisine')] },
    {
      en: 'the bathroom',
      fr: [a('la salle de bains'), a('la salle de bain')],
      note: 'Les toilettes, toujours au pluriel, ce sont seulement les WC.',
    },
    { en: 'the stairs', fr: [a("l'escalier", 'm'), a('les escaliers', 'm')] },
    { en: 'the wardrobe', fr: [a("l'armoire", 'f')] },
    { en: 'the shelf', fr: [a("l'étagère", 'f')] },
    { en: 'the bedside table', fr: [a('la table de chevet')] },
    {
      en: 'the washing machine',
      fr: [a('le lave-linge'), a('la machine à laver')],
    },
    { en: 'the ground floor', fr: [a('le rez-de-chaussée')] },
    { en: 'the sofa', fr: [a('le canapé')] },
    { en: 'the ceiling', fr: [a('le plafond')] },
    { en: 'the bathtub', fr: [a('la baignoire')] },
    { en: 'the armchair', fr: [a('le fauteuil')] },
    {
      en: 'I live on the third floor.',
      fr: [a("J'habite au troisième étage.")],
    },
    {
      en: 'My flat is small but very bright.',
      fr: [
        a('Mon appartement est petit mais très lumineux.'),
        a('Mon appartement est petit mais très clair.'),
      ],
    },
  ],
}

export const routine: Theme = {
  id: 'routine',
  name: 'Routine quotidienne',
  level: 'A1',
  desc: 'Les actions de tous les jours, surtout avec des verbes pronominaux.',
  items: [
    { en: 'to wake up', fr: [a('se réveiller')] },
    { en: 'to get up', fr: [a('se lever')] },
    { en: 'to have a shower', fr: [a('se doucher'), a('prendre une douche')] },
    { en: "to brush one's teeth", fr: [a('se brosser les dents')] },
    { en: 'to get dressed', fr: [a("s'habiller")] },
    {
      en: "to do one's hair",
      fr: [a('se coiffer')],
      note: "« Faire ses cheveux » est un calque de l'anglais.",
    },
    { en: 'to go to bed', fr: [a('se coucher')] },
    { en: 'to fall asleep', fr: [a("s'endormir")] },
    { en: 'to hurry', fr: [a('se dépêcher'), a('se presser')] },
    { en: 'to have a lie-in', fr: [a('faire la grasse matinée')] },
    {
      en: 'to have breakfast',
      fr: [a('prendre le petit-déjeuner'), a('prendre son petit-déjeuner')],
    },
    { en: 'the alarm clock', fr: [a('le réveil')] },
    {
      en: 'I usually go to bed around midnight.',
      fr: [
        a("D'habitude, je me couche vers minuit."),
        a('En général, je me couche vers minuit.'),
      ],
    },
    {
      en: 'After work, I relax in front of the TV.',
      fr: [
        a('Après le travail, je me détends devant la télé.'),
        a('Après le travail, je me détends devant la télévision.'),
      ],
    },
  ],
}

export const courses: Theme = {
  id: 'courses',
  name: 'Nourriture et courses',
  level: 'A1',
  desc: 'Acheter à manger, les quantités, commander au café.',
  items: [
    {
      en: 'a loaf of bread',
      fr: [a('un pain'), a('une miche de pain'), a('une baguette')],
    },
    { en: 'a kilo of apples', fr: [a('un kilo de pommes')] },
    {
      en: 'a bottle of sparkling water',
      fr: [a("une bouteille d'eau gazeuse")],
    },
    {
      en: "the butcher's",
      fr: [a('la boucherie')],
      note: "La charcuterie, c'est pour le jambon, le saucisson et les pâtés.",
    },
    { en: 'the bakery', fr: [a('la boulangerie')] },
    { en: 'the receipt', fr: [a('le ticket de caisse'), a('le reçu')] },
    { en: 'the shopping trolley', fr: [a('le chariot'), a('le caddie')] },
    { en: 'the bill (at a restaurant)', fr: [a("l'addition", 'f')] },
    {
      en: 'the oil',
      fr: [a("l'huile", 'f')],
      note: 'Féminin, contrairement à beaucoup de langues.',
    },
    {
      en: 'to pay in cash',
      fr: [a('payer en espèces'), a('payer en liquide')],
    },
    {
      en: 'Can I pay by card?',
      fr: [
        a('Je peux payer par carte ?'),
        a('Est-ce que je peux payer par carte ?'),
      ],
    },
    {
      en: "I'd like a coffee and a croissant, please.",
      fr: [
        a("Je voudrais un café et un croissant, s'il vous plaît."),
        a("Je vais prendre un café et un croissant, s'il vous plaît."),
      ],
    },
    {
      en: 'How much is it?',
      fr: [
        a('Ça fait combien ?'),
        a("C'est combien ?"),
        a('Combien ça coûte ?'),
      ],
    },
    { en: "That's all, thank you.", fr: [a("C'est tout, merci.")] },
  ],
}

export const ville: Theme = {
  id: 'ville',
  name: 'La ville et les itinéraires',
  level: 'A1–A2',
  desc: 'Les lieux en ville, demander et donner son chemin.',
  items: [
    { en: 'the town hall', fr: [a('la mairie'), a("l'hôtel de ville", 'm')] },
    { en: 'the post office', fr: [a('la poste'), a('le bureau de poste')] },
    { en: 'the bus stop', fr: [a("l'arrêt de bus", 'm')] },
    { en: 'the traffic lights', fr: [a('le feu'), a('les feux', 'm')] },
    { en: 'the pavement', fr: [a('le trottoir')] },
    { en: 'the crossroads', fr: [a('le carrefour')] },
    { en: 'the roundabout', fr: [a('le rond-point')] },
    { en: 'the hospital', fr: [a("l'hôpital", 'm')] },
    { en: 'the church', fr: [a("l'église", 'f')] },
    {
      en: 'Go straight on.',
      fr: [
        a('Allez tout droit.'),
        a('Continuez tout droit.'),
        a('Va tout droit.'),
      ],
    },
    {
      en: 'Take the second street on the left.',
      fr: [
        a('Prenez la deuxième rue à gauche.'),
        a('Prends la deuxième rue à gauche.'),
      ],
    },
    { en: "It's opposite the bank.", fr: [a("C'est en face de la banque.")] },
    {
      en: 'Is it far from here?',
      fr: [a("C'est loin d'ici ?"), a("Est-ce que c'est loin d'ici ?")],
    },
    {
      en: 'Where is the nearest station?',
      fr: [a('Où est la gare la plus proche ?')],
    },
  ],
}

export const sante: Theme = {
  id: 'sante',
  name: 'Santé',
  level: 'A2',
  desc: 'Décrire ses symptômes, chez le médecin ou à la pharmacie.',
  items: [
    { en: 'I have a headache.', fr: [a("J'ai mal à la tête.")] },
    { en: 'I have a sore throat.', fr: [a("J'ai mal à la gorge.")] },
    {
      en: 'I have a cold.',
      fr: [a('Je suis enrhumé.'), a('Je suis enrhumée.'), a("J'ai un rhume.")],
    },
    { en: 'I have a fever.', fr: [a("J'ai de la fièvre.")] },
    { en: 'to cough', fr: [a('tousser')] },
    { en: 'a prescription', fr: [a('une ordonnance')] },
    {
      en: 'a sick note',
      fr: [a('un arrêt de travail'), a('un arrêt maladie')],
    },
    {
      en: 'the GP',
      fr: [
        a('le médecin généraliste'),
        a('le généraliste'),
        a('le médecin traitant'),
      ],
    },
    { en: 'the shoulder', fr: [a("l'épaule", 'f')] },
    { en: 'the ankle', fr: [a('la cheville')] },
    {
      en: "I'd like to make an appointment.",
      fr: [
        a('Je voudrais prendre rendez-vous.'),
        a('Je voudrais prendre un rendez-vous.'),
      ],
    },
    {
      en: 'I feel dizzy.',
      fr: [a("J'ai la tête qui tourne."), a("J'ai des vertiges.")],
    },
    {
      en: "I've hurt my ankle.",
      fr: [a('Je me suis fait mal à la cheville.')],
      note: "Pas d'accord : « fait » reste invariable ici.",
    },
    {
      en: "I'm allergic to penicillin.",
      fr: [a('Je suis allergique à la pénicilline.')],
    },
  ],
}

export const logement: Theme = {
  id: 'logement',
  name: 'Logement',
  level: 'A2',
  desc: 'Lire une annonce, parler au propriétaire, déménager.',
  items: [
    { en: 'the landlord', fr: [a('le propriétaire'), a('la propriétaire')] },
    { en: 'the rent', fr: [a('le loyer')] },
    { en: 'the deposit', fr: [a('la caution'), a('le dépôt de garantie')] },
    { en: 'the service charges', fr: [a('les charges', 'f')] },
    { en: 'the advert (for a flat)', fr: [a("l'annonce", 'f')] },
    { en: 'the lift', fr: [a("l'ascenseur", 'm')] },
    { en: 'furnished', fr: [a('meublé')] },
    { en: 'a flat share', fr: [a('une colocation'), a('une coloc')] },
    {
      en: 'a one-bedroom flat',
      fr: [a('un deux-pièces')],
      note: 'On compte le salon : une chambre + un salon = un deux-pièces.',
    },
    { en: 'the lease', fr: [a('le bail')] },
    { en: 'to move house', fr: [a('déménager')] },
    { en: 'the neighbour', fr: [a('le voisin'), a('la voisine')] },
    {
      en: "The heating doesn't work.",
      fr: [
        a('Le chauffage ne marche pas.'),
        a('Le chauffage ne fonctionne pas.'),
      ],
    },
    {
      en: 'Is the flat still available?',
      fr: [
        a("L'appartement est toujours disponible ?"),
        a("Est-ce que l'appartement est toujours disponible ?"),
        a("L'appartement est-il toujours disponible ?"),
      ],
    },
  ],
}

export const THEMES: Theme[] = [
  chezSoi,
  routine,
  courses,
  ville,
  sante,
  logement,
]

export const THEME_BY_ID: ReadonlyMap<string, Theme> = new Map(
  THEMES.map((t) => [t.id, t]),
)
