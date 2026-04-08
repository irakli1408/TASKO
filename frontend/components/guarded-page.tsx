"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CurrentUser } from "@/lib/auth";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
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
  const pathname = usePathname();
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
            <div className="flex items-center gap-1">
              <div className="scale-[0.8] origin-left">
                <LogoLink compact />
              </div>
              <div className="min-w-0">
                <p className="text-[1rem] font-semibold tracking-tight text-[var(--tasko-text)] sm:text-[1.4rem]">
                  Tasko
                </p>
              </div>
            </div>

            <div className="hidden min-w-0 max-w-full lg:flex lg:flex-1 lg:justify-end">
              <div className="flex min-w-0 max-w-full items-center gap-2 overflow-x-auto pb-1">
              <Link href="/feed" className={navButtonClass(pathname, "/feed")}>
                {t("common.feed")}
              </Link>
              <Link href="/tasks/create" className={navButtonClass(pathname, "/tasks/create")}>
                {t("common.createTask")}
              </Link>
              <Link href="/tasks/mine" className={navButtonClass(pathname, "/tasks/mine")}>
                {t("common.myTasks")}
              </Link>
              <Link href="/offers/mine" className={navButtonClass(pathname, "/offers/mine")}>
                {t("common.myOffers")}
              </Link>
              <Link href="/jobs/mine" className={navButtonClass(pathname, "/jobs/mine")}>
                {t("common.myJobs")}
              </Link>
              <NotificationsNavLink />
              <Link href="/profile" className={navButtonClass(pathname, "/profile")}>
                {t("common.profile")}
              </Link>
              <Link
                href="/settings"
                className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border transition ${
                  isRouteActive(pathname, "/settings")
                    ? "border-[#86efac] bg-[#dcfce7] text-[#15803d] shadow-[0_10px_24px_rgba(34,197,94,0.18)]"
                    : "border-[#cdeedd] bg-[#f0fdf4] text-[#16a34a] hover:border-[#b7e5cb] hover:bg-[#dcfce7] hover:text-[#15803d]"
                }`}
                aria-label={t("common.settings")}
                title={t("common.settings")}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.9]">
                  <path d="M10.3 3.2h3.4l.5 2.1a7.3 7.3 0 0 1 1.6.7l1.9-1.1 2.4 2.4-1.1 1.9c.3.5.6 1 .7 1.6l2.1.5v3.4l-2.1.5a7.3 7.3 0 0 1-.7 1.6l1.1 1.9-2.4 2.4-1.9-1.1c-.5.3-1 .6-1.6.7l-.5 2.1h-3.4l-.5-2.1a7.3 7.3 0 0 1-1.6-.7l-1.9 1.1-2.4-2.4 1.1-1.9a7.3 7.3 0 0 1-.7-1.6l-2.1-.5v-3.4l2.1-.5c.1-.6.4-1.1.7-1.6L3.9 7.3l2.4-2.4 1.9 1.1c.5-.3 1-.6 1.6-.7l.5-2.1Z" />
                  <circle cx="12" cy="12" r="3.2" />
                </svg>
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="shrink-0 rounded-[12px] bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(59,130,246,0.28)] transition hover:bg-[#2563eb]"
              >
                {t("common.logout")}
              </button>
              </div>
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

        </div>

        <div
          className={`overflow-hidden transition-[max-height,opacity,margin] duration-300 lg:hidden ${
            mobileMenuOpen ? "mt-2 max-h-[32rem] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="rounded-[2rem] border border-[#dfe7f3] bg-white p-4 shadow-[0_22px_44px_rgba(42,78,148,0.12)]">
            <div className="mb-4 flex items-center gap-1 border-b border-[#eef3fb] pb-4 sm:hidden">
              <div className="scale-[0.8] origin-left">
                <LogoLink compact />
              </div>
              <div>
                <p className="text-[0.95rem] font-semibold tracking-tight text-[var(--tasko-text)]">Tasko</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Link href="/feed" className={mobileNavButtonClass(pathname, "/feed")}>
                  {t("common.feed")}
                </Link>
                <Link href="/tasks/create" className={mobileNavButtonClass(pathname, "/tasks/create")}>
                  {t("common.createTask")}
                </Link>
                <Link href="/tasks/mine" className={mobileNavButtonClass(pathname, "/tasks/mine")}>
                  {t("common.myTasks")}
                </Link>
                <Link href="/offers/mine" className={mobileNavButtonClass(pathname, "/offers/mine")}>
                  {t("common.myOffers")}
                </Link>
                <Link href="/jobs/mine" className={mobileNavButtonClass(pathname, "/jobs/mine")}>
                  {t("common.myJobs")}
                </Link>
                <NotificationsNavLink />
                <Link href="/profile" className={mobileNavButtonClass(pathname, "/profile")}>
                  {t("common.profile")}
                </Link>
                <Link
                  href="/settings"
                  className={mobileNavButtonClass(pathname, "/settings")}
                >
                  {t("common.settings")}
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
          <Link
            href="/profile"
            className="mt-5 inline-flex rounded-full bg-amber-600 px-4 py-3 text-sm font-semibold text-white"
          >
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

function navButtonClass(pathname: string | null, href: string) {
  const active = isRouteActive(pathname, href);

  return active
    ? "shrink-0 rounded-[12px] border border-[#86efac] bg-[#f0fdf4] px-4 py-2 text-sm font-semibold text-[#15803d] shadow-[0_10px_24px_rgba(34,197,94,0.16)]"
    : "tasko-secondary-btn shrink-0 px-4 py-2";
}

function mobileNavButtonClass(pathname: string | null, href: string) {
  const active = isRouteActive(pathname, href);

  return active
    ? "rounded-[12px] border border-[#86efac] bg-[#f0fdf4] px-4 py-2 text-center text-sm font-semibold text-[#15803d] shadow-[0_10px_24px_rgba(34,197,94,0.16)]"
    : "tasko-secondary-btn px-4 py-2 text-center";
}

function isRouteActive(pathname: string | null, href: string) {
  if (!pathname) {
    return false;
  }

  if (pathname === href) {
    return true;
  }

  if (href === "/tasks/mine") {
    return pathname.startsWith("/tasks/") && pathname !== "/tasks/create";
  }

  if (href === "/settings") {
    return pathname.startsWith("/settings");
  }

  if (href === "/profile") {
    return pathname.startsWith("/profile") || pathname.startsWith("/executors/");
  }

  if (href === "/offers/mine") {
    return pathname.startsWith("/offers/");
  }

  if (href === "/jobs/mine") {
    return pathname.startsWith("/jobs/");
  }

  if (href === "/feed") {
    return pathname === "/feed";
  }

  return false;
}
