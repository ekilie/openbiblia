import manifest from '@/assets/bibles.json';
import type { BiblesManifest, BibleLanguage, Translation } from './types';

const data = manifest as BiblesManifest;

export function getLanguages(): BibleLanguage[] {
  return data.bibles;
}

export function getTranslations(lang: string): Translation[] {
  const entry = data.bibles.find((b) => b.lang === lang);
  return entry?.translations ?? [];
}

export function getTranslation(id: string): { lang: string; translation: Translation } | null {
  for (const bible of data.bibles) {
    const t = bible.translations.find((t) => t.id === id);
    if (t) return { lang: bible.lang, translation: t };
  }
  return null;
}
