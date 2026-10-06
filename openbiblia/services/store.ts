import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { File, Paths } from "expo-file-system";
import { isDownloaded } from "./bible-db";
import { getLanguages } from "./manifest";

const settingsFile = new File(Paths.document, "openbiblia-settings.json");

const fileStorage: StateStorage = {
  getItem: async (name) => {
    try {
      if (settingsFile.exists) {
        const raw = await settingsFile.text();
        const parsed = JSON.parse(raw);
        return JSON.stringify(parsed[name] ?? null);
      }
    } catch {}
    return null;
  },
  setItem: async (name, value) => {
    try {
      let store: Record<string, unknown> = {};
      if (settingsFile.exists) {
        store = JSON.parse(await settingsFile.text());
      }
      store[name] = JSON.parse(value);
      settingsFile.write(JSON.stringify(store));
    } catch {}
  },
  removeItem: async (name) => {
    try {
      if (settingsFile.exists) {
        const store = JSON.parse(await settingsFile.text());
        delete store[name];
        settingsFile.write(JSON.stringify(store));
      }
    } catch {}
  },
};

export type ThemePreference = "system" | "light" | "dark";

export interface ReadingPosition {
  translationId: string;
  book: string;
  chapter: number;
  timestamp: number;
}

export interface Bookmark {
  translationId: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  timestamp: number;
}

interface AppState {
  /** User's theme preference */
  theme: ThemePreference;
  /** Default Bible translation ID to open on launch */
  defaultBible: string | null;
  /** Set of downloaded translation IDs (cached for fast reads) */
  downloadedIds: string[];
  /** Reader font size (1-based scale: 1=small, 2=default, 3=large, 4=xlarge) */
  fontSize: number;
  /** Reader body font family preference */
  readerFontFamily: "serif" | "sans";
  /** Last reading position per translation */
  readingHistory: ReadingPosition[];
  /** Saved verses */
  bookmarks: Bookmark[];

  setTheme: (theme: ThemePreference) => void;
  setDefaultBible: (id: string | null) => void;
  addDownloaded: (id: string) => void;
  removeDownloaded: (id: string) => void;
  refreshDownloaded: () => void;
  setFontSize: (size: number) => void;
  setReaderFontFamily: (family: "serif" | "sans") => void;
  saveReadingPosition: (pos: Omit<ReadingPosition, "timestamp">) => void;
  toggleBookmark: (b: Omit<Bookmark, "timestamp">) => void;
  removeBookmark: (
    translationId: string,
    book: string,
    chapter: number,
    verse: number,
  ) => void;
  clearBookmarks: () => void;
}

const MAX_HISTORY = 20;

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: "system",
      defaultBible: null,
      downloadedIds: [],
      fontSize: 2,
      readerFontFamily: "serif",
      readingHistory: [],
      bookmarks: [],

      setTheme: (theme) => set({ theme }),

      setDefaultBible: (id) => set({ defaultBible: id }),

      addDownloaded: (id) =>
        set((state) => ({
          downloadedIds: state.downloadedIds.includes(id)
            ? state.downloadedIds
            : [...state.downloadedIds, id],
        })),

      removeDownloaded: (id) =>
        set((state) => ({
          downloadedIds: state.downloadedIds.filter((d) => d !== id),
          defaultBible: state.defaultBible === id ? null : state.defaultBible,
          readingHistory: state.readingHistory.filter(
            (r) => r.translationId !== id,
          ),
        })),

      refreshDownloaded: () => {
        const ids: string[] = [];
        for (const lang of getLanguages()) {
          for (const t of lang.translations) {
            if (isDownloaded(t.id)) {
              ids.push(t.id);
            }
          }
        }
        set({ downloadedIds: ids });
      },

      setFontSize: (fontSize) => set({ fontSize }),

      setReaderFontFamily: (readerFontFamily) => set({ readerFontFamily }),

      saveReadingPosition: (pos) =>
        set((state) => {
          const entry: ReadingPosition = { ...pos, timestamp: Date.now() };
          const filtered = state.readingHistory.filter(
            (r) => r.translationId !== pos.translationId,
          );
          return {
            readingHistory: [entry, ...filtered].slice(0, MAX_HISTORY),
          };
        }),

      toggleBookmark: (b) =>
        set((state) => {
          const exists = state.bookmarks.some(
            (x) =>
              x.translationId === b.translationId &&
              x.book === b.book &&
              x.chapter === b.chapter &&
              x.verse === b.verse,
          );
          if (exists) {
            return {
              bookmarks: state.bookmarks.filter(
                (x) =>
                  !(
                    x.translationId === b.translationId &&
                    x.book === b.book &&
                    x.chapter === b.chapter &&
                    x.verse === b.verse
                  ),
              ),
            };
          }
          const entry: Bookmark = { ...b, timestamp: Date.now() };
          return { bookmarks: [entry, ...state.bookmarks].slice(0, 500) };
        }),

      removeBookmark: (translationId, book, chapter, verse) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter(
            (x) =>
              !(
                x.translationId === translationId &&
                x.book === book &&
                x.chapter === chapter &&
                x.verse === verse
              ),
          ),
        })),

      clearBookmarks: () => set({ bookmarks: [] }),
    }),
    {
      name: "openbiblia-settings",
      storage: createJSONStorage(() => fileStorage),
      partialize: (state) => ({
        theme: state.theme,
        defaultBible: state.defaultBible,
        downloadedIds: state.downloadedIds,
        fontSize: state.fontSize,
        readerFontFamily: state.readerFontFamily,
        readingHistory: state.readingHistory,
        bookmarks: state.bookmarks,
      }),
    },
  ),
);
