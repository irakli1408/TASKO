"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Locale } from "@/lib/i18n";

const localeOrder: Locale[] = ["en", "ru", "ka", "uk"];

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex min-h-[42px] items-center gap-2 rounded-[12px] border border-[var(--tasko-border)] bg-white pl-3 pr-10 text-sm font-medium text-[var(--tasko-muted)] transition hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="uppercase tracking-[0.12em] text-[11px] text-[#8BA0C3]">
          {t("language.label")}
        </span>
        <span className="text-sm font-semibold text-[var(--tasko-text)]">
          {t(`language.${locale}`)}
        </span>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#64748B]">
          ▾
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-[172px] overflow-hidden rounded-[14px] border border-[#dbe4f0] bg-white p-1.5 shadow-[0_18px_38px_rgba(15,23,42,0.12)]">
          <div className="grid gap-1">
            {localeOrder.map((value) => {
              const active = value === locale;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setLocale(value);
                    setOpen(false);
                  }}
                  className={`rounded-[10px] px-3 py-2.5 text-left text-sm transition ${
                    active
                      ? "bg-[#3B82F6] font-semibold text-white"
                      : "text-[var(--tasko-text)] hover:bg-[#f4f7fb]"
                  }`}
                  role="option"
                  aria-selected={active}
                >
                  {t(`language.${value}`)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
