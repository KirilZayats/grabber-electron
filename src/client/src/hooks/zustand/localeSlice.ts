import { locales, type Locale } from "@/i18n";
import type { StateCreator } from "zustand";

export interface LocaleStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const createLocaleSlice: StateCreator<LocaleStore> = (set) => ({
  locale: locales.Ru,
  setLocale: (locale: Locale) => set({ locale }),
});
