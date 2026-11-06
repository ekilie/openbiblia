import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import manifest from '@/assets/commentaries.json';
import type { Commentary, CommentariesManifest } from './types';

const data = manifest as CommentariesManifest;
const COMMENTARY_DIR = new Directory(Paths.document, 'commentaries');

/** All commentaries included in the bundled manifest. */
export function getCommentaries(): Commentary[] {
  return data.commentaries;
}

/** Find a commentary by its PDF filename. */
export function getCommentary(name: string): Commentary | null {
  return data.commentaries.find((c) => c.name === name) ?? null;
}

/** Human-readable title for a commentary. */
export function getCommentaryTitle(name: string): string {
  const commentary = getCommentary(name);
  if (commentary?.title) return commentary.title;

  return name
    .replace(/^BC_/, '')
    .replace(/\.pdf$/i, '')
    .replace(/[_-]/g, ' ');
}

/** Local file for a downloaded commentary. */
export function commentaryFile(name: string): File {
  return new File(COMMENTARY_DIR, name);
}

/** Check if a commentary PDF has been downloaded. */
export function isCommentaryDownloaded(name: string): boolean {
  return commentaryFile(name).exists;
}

/** Download a commentary PDF into the app's document directory. */
export async function downloadCommentary(
  commentary: Commentary,
): Promise<File> {
  if (!COMMENTARY_DIR.exists) {
    COMMENTARY_DIR.create({ idempotent: true, intermediates: true });
  }

  const destination = commentaryFile(commentary.name);
  if (destination.exists) {
    return destination;
  }

  try {
    return await File.downloadFileAsync(commentary.download_url, destination, {
      idempotent: true,
    });
  } catch (error) {
    // Android can leave a partial file behind when a download fails.
    if (destination.exists) {
      destination.delete();
    }
    throw error;
  }
}

/** Delete a downloaded commentary PDF. */
export function deleteCommentary(name: string): void {
  const file = commentaryFile(name);
  if (file.exists) {
    file.delete();
  }
}

/** Open a downloaded commentary in the platform PDF viewer. */
export async function readCommentary(name: string): Promise<void> {
  const file = commentaryFile(name);
  if (!file.exists) {
    throw new Error('Download this commentary before reading it.');
  }

  const title = getCommentaryTitle(name);

  if (await File.canPreview(file)) {
    await File.preview(file, { title, mimeType: 'application/pdf' });
    return;
  }

  // Fall back to the share sheet when no PDF viewer is available.
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      dialogTitle: `Open ${title}`,
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
    });
    return;
  }

  throw new Error('No app is available to open this PDF.');
}

/** Share a downloaded commentary PDF. */
export async function shareCommentary(name: string): Promise<void> {
  const file = commentaryFile(name);
  if (!file.exists) {
    throw new Error('Download this commentary before sharing it.');
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(file.uri, {
    dialogTitle: `Share ${getCommentaryTitle(name)}`,
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
  });
}

/** Format a byte count for display. */
export function formatCommentarySize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
