export interface EventCategory {
  id: string;
  name: string;
  segment: 'sports' | 'music' | 'arts';
}

export const EVENT_CATEGORIES: EventCategory[] = [
  // Sports (26 genres)
  { id: 'KnvZfZ7vAeI', name: 'Aquatique', segment: 'sports' },
  { id: 'KnvZfZ7vAet', name: 'Courses athlétiques', segment: 'sports' },
  { id: 'KnvZfZ7vAen', name: 'Badminton', segment: 'sports' },
  { id: 'KnvZfZ7vAdv', name: 'Baseball', segment: 'sports' },
  { id: 'KnvZfZ7vAde', name: 'Basketball', segment: 'sports' },
  { id: 'KnvZfZ7vAdA', name: 'Boxe', segment: 'sports' },
  { id: 'KnvZfZ7vAdk', name: 'Cricket', segment: 'sports' },
  { id: 'KnvZfZ7vAda', name: 'Cyclisme', segment: 'sports' },
  { id: 'KnvZfZ7vAd1', name: 'Équestre', segment: 'sports' },
  { id: 'KnvZfZ7vAJF', name: 'eSports', segment: 'sports' },
  { id: 'KnvZfZ7vAdJ', name: 'Sports extrêmes', segment: 'sports' },
  { id: 'KnvZfZ7vAdE', name: 'Football américain', segment: 'sports' },
  { id: 'KnvZfZ7vAdt', name: 'Golf', segment: 'sports' },
  { id: 'KnvZfZ7vAdn', name: 'Gymnastique', segment: 'sports' },
  { id: 'KnvZfZ7vAdl', name: 'Handball', segment: 'sports' },
  { id: 'KnvZfZ7vAdI', name: 'Hockey', segment: 'sports' },
  { id: 'KnvZfZ7vA7d', name: 'Arts Martiaux', segment: 'sports' },
  { id: 'KnvZfZ7vA7k', name: 'Sports motorisés', segment: 'sports' },
  { id: 'KnvZfZ7vA71', name: 'Rugby', segment: 'sports' },
  { id: 'KnvZfZ7vAd6', name: 'Ski', segment: 'sports' },
  { id: 'KnvZfZ7vA7E', name: 'Football', segment: 'sports' },
  { id: 'KnvZfZ7vA7t', name: 'Surf', segment: 'sports' },
  { id: 'KnvZfZ7vA7n', name: 'Natation', segment: 'sports' },
  { id: 'KnvZfZ7vAAv', name: 'Tennis', segment: 'sports' },
  { id: 'KnvZfZ7vAAd', name: 'Athlétisme', segment: 'sports' },
  { id: 'KnvZfZ7vAA7', name: 'Volleyball', segment: 'sports' },

  // Musique (24 genres)
  { id: 'KnvZfZ7vAvv', name: 'Alternative', segment: 'music' },
  { id: 'KnvZfZ7vAve', name: 'Ballades/Romantique', segment: 'music' },
  { id: 'KnvZfZ7vAvd', name: 'Blues', segment: 'music' },
  { id: 'KnvZfZ7vAvA', name: 'Chanson française', segment: 'music' },
  { id: 'KnvZfZ7vAvk', name: 'Chanson enfants', segment: 'music' },
  { id: 'KnvZfZ7vAeJ', name: 'Classique', segment: 'music' },
  { id: 'KnvZfZ7vAv6', name: 'Country', segment: 'music' },
  { id: 'KnvZfZ7vAvF', name: 'Dance/Électronique', segment: 'music' },
  { id: 'KnvZfZ7vAva', name: 'Folk', segment: 'music' },
  { id: 'KnvZfZ7vAv1', name: 'Hip-Hop/Rap', segment: 'music' },
  { id: 'KnvZfZ7vAvJ', name: 'Fêtes', segment: 'music' },
  { id: 'KnvZfZ7vAvE', name: 'Jazz', segment: 'music' },
  { id: 'KnvZfZ7vAJ6', name: 'Latin', segment: 'music' },
  { id: 'KnvZfZ7vAvI', name: 'Médiévale/Renaissance', segment: 'music' },
  { id: 'KnvZfZ7vAvt', name: 'Metal', segment: 'music' },
  { id: 'KnvZfZ7vAvn', name: 'New Age', segment: 'music' },
  { id: 'KnvZfZ7vAev', name: 'Pop', segment: 'music' },
  { id: 'KnvZfZ7vAee', name: 'R&B', segment: 'music' },
  { id: 'KnvZfZ7vAed', name: 'Reggae', segment: 'music' },
  { id: 'KnvZfZ7vAe7', name: 'Religieux', segment: 'music' },
  { id: 'KnvZfZ7vAeA', name: 'Rock', segment: 'music' },
  { id: 'KnvZfZ7vAeF', name: 'Musique du monde', segment: 'music' },
  { id: 'KnvZfZ7vAe6', name: 'Festival', segment: 'music' },

  // Arts & Théâtre (16 genres)
  { id: 'KnvZfZ7v7na', name: 'Théâtre pour enfants', segment: 'arts' },
  { id: 'KnvZfZ7v7n1', name: 'Cirque et Numéros spéciaux', segment: 'arts' },
  { id: 'KnvZfZ7v7nE', name: 'Culturel', segment: 'arts' },
  { id: 'KnvZfZ7v7nI', name: 'Danse', segment: 'arts' },
  { id: 'KnvZfZ7v7nn', name: 'Mode', segment: 'arts' },
  { id: 'KnvZfZ7v7nl', name: 'Beaux-Arts', segment: 'arts' },
  { id: 'KnvZfZ7v7lF', name: 'Marionnettes', segment: 'arts' },
  { id: 'KnvZfZ7v7lJ', name: 'Variété', segment: 'arts' },
  { id: 'KnvZfZ7v7l6', name: 'Performance', segment: 'arts' },
  { id: 'KnvZfZ7v7lk', name: 'Opéra', segment: 'arts' },
  { id: 'KnvZfZ7v7la', name: 'Spectacle', segment: 'arts' },
  { id: 'KnvZfZ7vAe1', name: 'Humour', segment: 'arts' },
  { id: 'KnvZfZ7v7l7', name: 'Multimédia', segment: 'arts' },
  { id: 'KnvZfZ7v7lv', name: 'Magie et illusion', segment: 'arts' },
  { id: 'KnvZfZ7v7lA', name: 'Musique', segment: 'arts' },
  { id: 'KnvZfZ7v7l1', name: 'Théâtre', segment: 'arts' },
];

export const getCategoriesBySegment = (segment: 'sports' | 'music' | 'arts'): EventCategory[] => {
  return EVENT_CATEGORIES.filter(cat => cat.segment === segment);
};

export const getCategoryById = (id: string): EventCategory | undefined => {
  return EVENT_CATEGORIES.find(cat => cat.id === id);
};

export const getCategoryByName = (name: string): EventCategory | undefined => {
  return EVENT_CATEGORIES.find(cat => cat.name === name);
};

export const getAllCategoryNames = (): string[] => {
  return EVENT_CATEGORIES.map(cat => cat.name);
};

export const getSegments = (): Array<{segment: string, title: string}> => [
  { segment: 'music', title: 'Musique' },
  { segment: 'sports', title: 'Sports' },
  { segment: 'arts', title: 'Arts & Théâtre' }
];