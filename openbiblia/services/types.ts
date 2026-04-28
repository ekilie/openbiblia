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

export interface Verse {
  id: number;
  book: string;
  chapter: number;
  verse: number;
  osis_id: string;
  text: string;
}
