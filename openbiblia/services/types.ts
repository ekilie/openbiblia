export interface Translation {
  id: string;
  name: string;
  download_url: string;
  size: number;
  version: number;
  checksum: string;
}

export interface BibleLanguage {
  lang: string;
  translations: Translation[];
}

export interface BiblesManifest {
  bibles: BibleLanguage[];
}

export type Testament = 'old' | 'new' | 'additional';

export interface Commentary {
  name: string;
  title?: string;
  testament?: Testament;
  size?: number;
  download_url: string;
}

export interface CommentariesManifest {
  commentaries: Commentary[];
}

export interface Verse {
  id: number;
  book: string;
  chapter: number;
  verse: number;
  osis_id: string;
  text: string;
}
