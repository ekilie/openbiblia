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

interface AppState {
  /** User's theme preference */
  theme: ThemePreference;
  /** Default Bible translation ID to open on launch */
  defaultBible: string | null;
  /** Set of downloaded translation IDs (cached for fast reads) */
  downloadedIds: string[];

  setTheme: (theme: ThemePreference) => void;
  setDefaultBible: (id: string | null) => void;
  addDownloaded: (id: string) => void;
  removeDownloaded: (id: string) => void;
  refreshDownloaded: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: "system",
      defaultBible: null,
      downloadedIds: [],

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
    }),
    {
      name: "openbiblia-settings",
      storage: createJSONStorage(() => fileStorage),
      partialize: (state) => ({
        theme: state.theme,
        defaultBible: state.defaultBible,
        downloadedIds: state.downloadedIds,
      }),
    },
  ),
);
