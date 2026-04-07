"use client";

import Link from "next/link";
import { LogoLink } from "@/components/logo-link";
import { useI18n } from "@/components/i18n-provider";

type ErrorStatePageProps = {
  code: "403" | "404" | "500";
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function ErrorStatePage({
  code,
  title,
  description,
  primaryHref = "/",
  primaryLabel,
  secondaryHref,
  secondaryLabel
}: ErrorStatePageProps) {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-[#F7F8FA] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-[1180px]">
        <header className="rounded-[20px] border border-[var(--tasko-border)] bg-white px-5 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.05)] sm:px-7">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="scale-[0.86] origin-left">
                <LogoLink compact />
              </div>
              <span className="text-[1.05rem] font-semibold tracking-tight text-[var(--tasko-text)] sm:text-[1.35rem]">
                Tasko
              </span>
            </div>

            <Link href="/" className="tasko-secondary-btn">
              {t("error.backHome")}
            </Link>
          </div>
        </header>

        <section className="mt-6 rounded-[26px] border border-[var(--tasko-border)] bg-white px-6 py-12 shadow-[0_18px_45px_rgba(15,23,42,0.05)] sm:px-10 sm:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-[0.6fr_0.4fr]">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                {t("error.label")}
              </p>
              <div className="mt-4 inline-flex rounded-full border border-[#d8e5ff] bg-[#f7fbff] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#2563EB]">
                {code}
              </div>
              <h1 className="mt-6 text-[2.2rem] font-semibold leading-tight tracking-[-0.03em] text-[var(--tasko-text)] sm:text-[3rem]">
                {title}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-[var(--tasko-muted)]">
                {description}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={primaryHref} className="tasko-primary-btn">
                  {primaryLabel ?? t("error.backHome")}
                </Link>
                {secondaryHref && secondaryLabel ? (
                  <Link href={secondaryHref} className="tasko-secondary-btn">
                    {secondaryLabel}
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--tasko-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] p-5 shadow-[0_18px_40px_rgba(47,83,151,0.06)]">
              <div className="rounded-[22px] bg-[linear-gradient(135deg,#2F6BFF_0%,#5A8CFF_100%)] p-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
                  {t("error.workspaceLabel")}
                </p>
                <p className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">{code}</p>
                <p className="mt-3 text-sm leading-7 text-white/80">
                  {t("error.workspaceText")}
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <ErrorInfoCard
                  label={t("error.helpLabel")}
                  value={t("error.helpValue")}
                />
                <ErrorInfoCard
                  label={t("error.actionsLabel")}
                  value={t("error.actionsValue")}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ErrorInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--tasko-border)] bg-white px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8ba0c3]">{label}</p>
      <p className="mt-2 text-sm font-medium leading-7 text-[var(--tasko-text)]">{value}</p>
    </div>
  );
}
