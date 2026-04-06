"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CurrentUser } from "@/lib/auth";
import { useAuth } from "@/components/auth-provider";
import { LogoLink } from "@/components/logo-link";
import { NotificationsNavLink } from "@/components/notifications-nav-link";

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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="rounded-[2rem] border border-white/70 bg-white/90 px-8 py-6 text-slate-600 shadow-soft">
          Loading your workspace...
        </div>
      </main>
    );
  }

  const executorBlocked = requireExecutor && !canUseExecutorFeed(user);

  return (
    <main className="tasko-shell flex min-h-screen flex-col py-5">
      <header className="tasko-topbar mb-6 p-4 sm:p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <LogoLink compact />
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 tasko-muted">{description}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/feed" className="tasko-secondary-btn px-4 py-2">
              Feed
            </Link>
            <Link href="/tasks/create" className="tasko-secondary-btn px-4 py-2">
              Create task
            </Link>
            <Link href="/tasks/mine" className="tasko-secondary-btn px-4 py-2">
              My tasks
            </Link>
            <NotificationsNavLink />
            <Link href="/profile" className="tasko-secondary-btn px-4 py-2">
              Profile
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="tasko-primary-btn px-4 py-2"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {executorBlocked ? (
        <section className="tasko-card border-amber-200 bg-amber-50 p-6">
          <h2 className="text-xl font-semibold text-amber-900">Feed is only for active executors</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-amber-900/80">
            Your backend only allows active executors with executor mode enabled to use the feed.
            We&apos;ll continue this flow from the profile screen, where executor settings and categories
            will be connected next.
          </p>
          <Link href="/profile" className="mt-5 inline-flex rounded-full bg-amber-600 px-4 py-3 text-sm font-semibold text-white">
            Go to profile
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
