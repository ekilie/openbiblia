import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isDownloaded } from "./bible-db";
import { getLanguages } from "./manifest";

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
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        theme: state.theme,
        defaultBible: state.defaultBible,
        downloadedIds: state.downloadedIds,
      }),
    },
  ),
);
