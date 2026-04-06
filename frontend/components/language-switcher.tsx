"use client";

import { useI18n } from "@/components/i18n-provider";
import { Locale } from "@/lib/i18n";

const localeOrder: Locale[] = ["en", "ru", "ka", "uk"];

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-[#dfe7f3] bg-white px-3 py-2 text-xs font-semibold text-[#607392]">
      <span className="uppercase tracking-[0.16em]">{t("language.label")}</span>
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        className="bg-transparent text-xs font-semibold text-[#1e3d8f] outline-none"
      >
        {localeOrder.map((value) => (
          <option key={value} value={value}>
            {t(`language.${value}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
