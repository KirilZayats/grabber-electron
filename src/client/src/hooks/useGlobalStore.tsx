import { create } from "zustand";
import { createLocaleSlice, type LocaleStore } from "./zustand/localeSlice";

export const useGlobalStore = create<LocaleStore>((...a) => ({
  ...createLocaleSlice(...a),
}));
