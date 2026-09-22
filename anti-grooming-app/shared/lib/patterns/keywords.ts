import { GroomingKeyword } from '../../types';

export const GROOMING_KEYWORDS: GroomingKeyword[] = [
  // Isolation patterns
  {
    term: 'nadie te creería',
    category: 'isolation',
    severity: 'high',
    languages: ['es'],
  },
  {
    term: 'no le digas a nadie',
    category: 'isolation',
    severity: 'high',
    languages: ['es'],
  },
  {
    term: 'es nuestro secreto',
    category: 'isolation',
    severity: 'high',
    languages: ['es'],
  },
  {
    term: 'no puedo decirle a tus padres',
    category: 'isolation',
    severity: 'high',
    languages: ['es'],
  },
  {
    term: 'tus papás no van a entender',
    category: 'isolation',
    severity: 'high',
    languages: ['es'],
  },

  // Grooming / relationship building
  {
    term: 'eres especial',
    category: 'grooming',
    severity: 'medium',
    languages: ['es'],
  },
  {
    term: 'te entiendo como nadie',
    category: 'grooming',
    severity: 'medium',
    languages: ['es'],
  },
  {
    term: 'somos almas gemelas',
    category: 'grooming',
    severity: 'medium',
    languages: ['es'],
  },
  {
    term: 'nadie te entiende como yo',
    category: 'grooming',
    severity: 'medium',
    languages: ['es'],
  },
  {
    term: 'eres muy maduro para tu edad',
    category: 'grooming',
    severity: 'medium',
    languages: ['es'],
  },
  {
    term: 'pareces mayor',
    category: 'grooming',
    severity: 'medium',
    languages: ['es'],
  },

  // Sexual content solicitation
  {
    term: 'envíame una foto sin ropa',
    category: 'sexual',
    severity: 'critical',
    languages: ['es'],
  },
  {
    term: 'foto desnuda',
    category: 'sexual',
    severity: 'critical',
    languages: ['es'],
  },
  {
    term: 'nude',
    category: 'sexual',
    severity: 'critical',
    languages: ['en'],
  },
  {
    term: 'pics sin ropa',
    category: 'sexual',
    severity: 'critical',
    languages: ['es'],
  },
  {
    term: 'muéstrame el cuerpo',
    category: 'sexual',
    severity: 'critical',
    languages: ['es'],
  },
  {
    term: 'eres sexy',
    category: 'sexual',
    severity: 'medium',
    languages: ['es'],
  },
  {
    term: 'me excitas',
    category: 'sexual',
    severity: 'high',
    languages: ['es'],
  },

  // Exploitation / control
  {
    term: 'te necesito dinero',
    category: 'exploitation',
    severity: 'high',
    languages: ['es'],
  },
  {
    term: 'préstame dinero',
    category: 'exploitation',
    severity: 'high',
    languages: ['es'],
  },
  {
    term: 'manda dinero',
    category: 'exploitation',
    severity: 'high',
    languages: ['es'],
  },
  {
    term: 'transfer dinero',
    category: 'exploitation',
    severity: 'high',
    languages: ['es'],
  },
  {
    term: 'si me amas me das',
    category: 'exploitation',
    severity: 'critical',
    languages: ['es'],
  },
  {
    term: 'hazlo para mí',
    category: 'exploitation',
    severity: 'high',
    languages: ['es'],
  },

  // Meeting arrangements
  {
    term: 'nos vemos',
    category: 'meeting',
    severity: 'medium',
    languages: ['es'],
  },
  {
    term: 'encuentro',
    category: 'meeting',
    severity: 'medium',
    languages: ['es'],
  },
  {
    term: 'te recojo',
    category: 'meeting',
    severity: 'high',
    languages: ['es'],
  },
  {
    term: 'dirección',
    category: 'meeting',
    severity: 'medium',
    languages: ['es'],
  },
  {
    term: 'a qué hora te dejo libre',
    category: 'meeting',
    severity: 'high',
    languages: ['es'],
  },
  {
    term: 'en un lugar discreto',
    category: 'meeting',
    severity: 'high',
    languages: ['es'],
  },

  // Adult impersonation
  {
    term: 'tengo 15',
    category: 'grooming',
    severity: 'high',
    languages: ['es'],
  },
  {
    term: 'tengo 16',
    category: 'grooming',
    severity: 'high',
    languages: ['es'],
  },
];

export function searchKeywords(text: string, language: string = 'es'): GroomingKeyword[] {
  const lowerText = text.toLowerCase();
  return GROOMING_KEYWORDS.filter(
    (kw) =>
      lowerText.includes(kw.term.toLowerCase()) &&
      (!kw.languages || kw.languages.includes(language))
  );
}

export function getRiskScore(keywords: GroomingKeyword[]): number {
  const severityScores = {
    low: 1,
    medium: 3,
    high: 7,
    critical: 10,
  };

  return keywords.reduce((score, kw) => score + severityScores[kw.severity], 0);
}

export function getHighestSeverity(keywords: GroomingKeyword[]): string {
  if (keywords.length === 0) return 'none';

  const severities = ['critical', 'high', 'medium', 'low'];
  for (const severity of severities) {
    if (keywords.some((kw) => kw.severity === severity)) {
      return severity;
    }
  }

  return 'none';
}
