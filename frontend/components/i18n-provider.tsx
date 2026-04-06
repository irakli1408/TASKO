"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  Locale,
  defaultLocale,
  getStoredLocale,
  isSupportedLocale,
  localeStorageKey,
  supportedLocales,
  translate
} from "@/lib/i18n";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  locales: readonly Locale[];
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const nextLocale = getStoredLocale();
    setLocaleState(nextLocale);
    document.documentElement.lang = nextLocale;
  }, []);

  function setLocale(nextLocale: Locale) {
    setLocaleState(nextLocale);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(localeStorageKey, nextLocale);
    }

    document.documentElement.lang = nextLocale;
  }

  useEffect(() => {
    function syncLocale(event: StorageEvent) {
      if (event.key !== localeStorageKey) {
        return;
      }

      if (isSupportedLocale(event.newValue)) {
        setLocaleState(event.newValue);
        document.documentElement.lang = event.newValue;
      }
    }

    window.addEventListener("storage", syncLocale);
    return () => window.removeEventListener("storage", syncLocale);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key: string) => translate(locale, key),
      locales: supportedLocales
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
}
