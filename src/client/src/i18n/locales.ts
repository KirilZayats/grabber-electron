export const locales = {
  Ru: "ru-RU",
  En: "en-US",
} as const;

export type Locale = (typeof locales)[keyof typeof locales];