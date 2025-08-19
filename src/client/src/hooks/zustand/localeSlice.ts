import { locales } from "@/i18n";
import type { StateCreator } from "zustand";

export interface LocaleStore {
  locale: (typeof locales)[keyof typeof locales];
  setLocale: (locale: keyof typeof locales) => void;
}

export const createLocaleSlice: StateCreator<LocaleStore> = (set) => ({
  locale: locales.Ru,
  setLocale: (locale: keyof typeof locales) => set({ locale }),
});
