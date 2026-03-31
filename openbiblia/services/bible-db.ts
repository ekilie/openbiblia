import { File, Directory, Paths } from 'expo-file-system';
import { openDatabaseAsync } from 'expo-sqlite';
import type { Translation, Verse } from './types';

const DB_DIR = new Directory(Paths.document, 'dbs');

/** Local file for a downloaded translation DB */
function dbFile(id: string): File {
  return new File(DB_DIR, `${id}.db`);
}

/** Check if a translation DB has been downloaded */
export function isDownloaded(id: string): boolean {
  return dbFile(id).exists;
}

/** Download a translation DB file */
export async function downloadTranslation(translation: Translation): Promise<void> {
  if (!DB_DIR.exists) {
    DB_DIR.create();
  }
  const dest = dbFile(translation.id);
  await File.downloadFileAsync(translation.download_url, dest, { idempotent: true });
}

/** Delete a downloaded translation DB */
export function deleteTranslation(id: string): void {
  const f = dbFile(id);
  if (f.exists) {
    f.delete();
  }
}

/** Get the download size formatted for display */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Open a downloaded translation DB and return a helper to close it */
async function openTranslationDB(translationId: string) {
  return openDatabaseAsync(`${translationId}.db`, {
    useNewConnection: true,
  }, DB_DIR.uri);
}

/** Get distinct books in canonical order */
export async function getBooks(translationId: string): Promise<string[]> {
  const db = await openTranslationDB(translationId);
  try {
    const rows = await db.getAllAsync<{ book: string }>(
      'SELECT DISTINCT book FROM verses ORDER BY id'
    );
    const seen = new Set<string>();
    const books: string[] = [];
    for (const row of rows) {
      if (!seen.has(row.book)) {
        seen.add(row.book);
        books.push(row.book);
      }
    }
    return books;
  } finally {
    await db.closeAsync();
  }
}

/** Get chapters for a specific book */
export async function getChapters(
  translationId: string,
  book: string
): Promise<number[]> {
  const db = await openTranslationDB(translationId);
  try {
    const rows = await db.getAllAsync<{ chapter: number }>(
      'SELECT DISTINCT chapter FROM verses WHERE book = ? ORDER BY chapter',
      [book]
    );
    return rows.map((r) => r.chapter);
  } finally {
    await db.closeAsync();
  }
}

/** Get verses for a specific book and chapter */
export async function getVerses(
  translationId: string,
  book: string,
  chapter: number
): Promise<Verse[]> {
  const db = await openTranslationDB(translationId);
  try {
    const rows = await db.getAllAsync<Verse>(
      'SELECT id, book, chapter, verse, osis_id, text FROM verses WHERE book = ? AND chapter = ? ORDER BY verse',
      [book, chapter]
    );
    return rows;
  } finally {
    await db.closeAsync();
  }
}
