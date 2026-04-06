"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CurrentUser } from "@/lib/auth";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoLink } from "@/components/logo-link";
import { NotificationsNavLink } from "@/components/notifications-nav-link";
import { NotificationsToastLayer } from "@/components/notifications-toast-layer";

type GuardedPageProps = {
  title: string;
  description: string;
  children?: React.ReactNode;
  requireExecutor?: boolean;
};

export function GuardedPage({
  title,
  description,
  children,
  requireExecutor = false
}: GuardedPageProps) {
  const router = useRouter();
  const { status, user, logout } = useAuth();
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [title]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="rounded-[2rem] border border-white/70 bg-white/90 px-8 py-6 text-slate-600 shadow-soft">
          {t("common.loadingWorkspace")}
        </div>
      </main>
    );
  }

  const executorBlocked = requireExecutor && !canUseExecutorFeed(user);

  return (
    <main className="tasko-shell flex min-h-screen flex-col py-5">
      <NotificationsToastLayer />

      <header className="tasko-topbar mb-6 p-4 sm:p-5">
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <LogoLink compact />
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#dfe7f3] bg-white text-[#244274] shadow-[0_10px_24px_rgba(42,78,148,0.10)] transition hover:border-[#c7d5eb] lg:hidden"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation"
            >
              <span className="flex flex-col gap-1.5">
                <span className="block h-0.5 w-5 rounded-full bg-current" />
                <span className="block h-0.5 w-5 rounded-full bg-current" />
                <span className="block h-0.5 w-5 rounded-full bg-current" />
              </span>
            </button>
          </div>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 tasko-muted">{description}</p>
            </div>

            <div className="hidden flex-wrap gap-3 lg:flex">
              <LanguageSwitcher />
              <Link href="/feed" className="tasko-secondary-btn px-4 py-2">
                {t("common.feed")}
              </Link>
              <Link href="/tasks/create" className="tasko-secondary-btn px-4 py-2">
                {t("common.createTask")}
              </Link>
              <Link href="/tasks/mine" className="tasko-secondary-btn px-4 py-2">
                {t("common.myTasks")}
              </Link>
              <NotificationsNavLink />
              <Link href="/profile" className="tasko-secondary-btn px-4 py-2">
                {t("common.profile")}
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="tasko-primary-btn px-4 py-2"
              >
                {t("common.logout")}
              </button>
            </div>
          </div>
        </div>

        <div
          className={`overflow-hidden transition-[max-height,opacity,margin] duration-300 lg:hidden ${
            mobileMenuOpen ? "mt-2 max-h-[32rem] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="rounded-[2rem] border border-[#dfe7f3] bg-white p-4 shadow-[0_22px_44px_rgba(42,78,148,0.12)]">
            <div className="flex flex-col gap-3">
              <LanguageSwitcher />

              <div className="grid grid-cols-2 gap-3">
                <Link href="/feed" className="tasko-secondary-btn px-4 py-2 text-center">
                  {t("common.feed")}
                </Link>
                <Link href="/tasks/create" className="tasko-secondary-btn px-4 py-2 text-center">
                  {t("common.createTask")}
                </Link>
                <Link href="/tasks/mine" className="tasko-secondary-btn px-4 py-2 text-center">
                  {t("common.myTasks")}
                </Link>
                <NotificationsNavLink />
                <Link href="/profile" className="tasko-secondary-btn px-4 py-2 text-center">
                  {t("common.profile")}
                </Link>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="tasko-primary-btn px-4 py-2"
                >
                  {t("common.logout")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {executorBlocked ? (
        <section className="tasko-card border-amber-200 bg-amber-50 p-6">
          <h2 className="text-xl font-semibold text-amber-900">
            {t("guarded.executorBlockedTitle")}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-amber-900/80">
            {t("guarded.executorBlockedText")}
          </p>
          <Link href="/profile" className="mt-5 inline-flex rounded-full bg-amber-600 px-4 py-3 text-sm font-semibold text-white">
            {t("common.goToProfile")}
          </Link>
        </section>
      ) : (
        children
      )}
    </main>
  );
}

function canUseExecutorFeed(user: CurrentUser | null) {
  if (!user) {
    return false;
  }

  return user.isExecutorActive;
}
