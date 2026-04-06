"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { resolveHomePath, useAuth } from "@/components/auth-provider";
import { LogoLink } from "@/components/logo-link";

const navItems = [
  { label: "Feed", href: "#feed" },
  { label: "Create task", href: "#create" },
  { label: "Profile", href: "#profile" },
  { label: "Chat", href: "#chat" }
];

const priorities = [
  "Phone-first responsive layout",
  "Fast task feed and task details",
  "Simple auth and profile flow",
  "Growth path for offers and realtime chat"
];

const screens = [
  {
    id: "feed",
    title: "Task feed",
    text: "Browse live task cards, filter offers, and move straight into a concrete job from the main marketplace view."
  },
  {
    id: "create",
    title: "Create task",
    text: "A guided posting flow with category, budget and location that works as comfortably on mobile as it does on desktop."
  },
  {
    id: "profile",
    title: "Profile and executor settings",
    text: "A dashboard-style account area with reputation, categories, work areas and account controls in structured sections."
  },
  {
    id: "chat",
    title: "Task chat and notifications",
    text: "Compact messenger and notifications screens built around quick actions, avatars and clear unread states."
  }
];

export function SiteShell() {
  const router = useRouter();
  const { status, user, logout } = useAuth();

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(resolveHomePath(user));
    }
  }, [router, status, user]);

  return (
    <main className="relative overflow-hidden py-5">
      <section className="tasko-shell flex min-h-screen flex-col pb-12">
        <header className="tasko-topbar px-4 py-3 md:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <LogoLink />

            <div className="flex flex-wrap items-center gap-2 text-sm font-medium tasko-muted">
              <nav className="flex flex-wrap gap-2">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-full px-3 py-2 transition hover:bg-[#f3f7ff] hover:text-[#1e3d8f]"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              {status === "authenticated" ? (
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="tasko-primary-btn px-4 py-2"
                >
                  Log out
                </button>
              ) : null}
            </div>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-[1.12fr_0.88fr] lg:py-12">
          <div className="space-y-7">
            <div className="tasko-pill">
              Find a specialist in minutes
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-[3.65rem]">
                Find the right specialist and manage tasks in one clean workflow.
              </h1>
              <p className="max-w-2xl text-base leading-7 tasko-muted sm:text-lg">
                Your existing backend already supports auth, task feed, task details, profile,
                notifications and realtime chat. The frontend now follows a marketplace dashboard
                design closer to the Tasko concept you shared.
              </p>
            </div>

            <div className="tasko-card grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                {["Cleaning", "Furniture", "Electric", "Plumbing", "Painting", "Repair"].map(
                  (label) => (
                    <div
                      key={label}
                      className="tasko-soft-card flex items-center justify-center px-4 py-3 text-sm font-semibold text-[#35507f]"
                    >
                      {label}
                    </div>
                  )
                )}
              </div>
              <div className="flex flex-col gap-3 sm:w-[220px]">
                <Link
                  href="/login"
                  className="tasko-primary-btn"
                >
                  Open platform
                </Link>
                <Link
                  href="/register"
                  className="tasko-secondary-btn"
                >
                  Create account
                </Link>
              </div>
            </div>

            <div id="roadmap" className="grid gap-3 sm:grid-cols-2">
              {priorities.map((item) => (
                <div key={item} className="tasko-card p-4">
                  <p className="text-sm font-medium text-[#38537f]">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="tasko-card p-5">
            <div className="grid gap-4">
              <div className="tasko-card overflow-hidden p-0">
                <div className="grid items-center gap-6 bg-gradient-to-r from-[#f6f9ff] to-[#fff8ec] p-6 lg:grid-cols-[1fr_170px]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7d8fb3]">
                      Tasko platform
                    </p>
                    <p className="mt-2 text-2xl font-semibold leading-tight">
                      Find a trusted specialist for your task
                    </p>
                    <div className="mt-4 flex gap-3">
                      <button className="tasko-primary-btn px-4 py-2.5 text-xs">Create task</button>
                      <button className="tasko-secondary-btn px-4 py-2.5 text-xs">Browse feed</button>
                    </div>
                  </div>
                  <div className="rounded-[24px] bg-white p-4">
                    <div className="grid grid-cols-2 gap-3">
                      {["+", "tool", "check", "chat"].map((item) => (
                        <div
                          key={item}
                          className="flex h-16 items-center justify-center rounded-2xl bg-[#edf3ff] text-xs font-semibold text-[#3f5e95]"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {["Bathroom repair", "Apartment cleaning", "Electrical setup", "Furniture assembly"].map(
                  (task, index) => (
                    <div key={task} className="tasko-soft-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-[#8ba0c3]">
                            Popular request
                          </p>
                          <p className="mt-2 text-base font-semibold">{task}</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#2f6bff]">
                          0{index + 1}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {screens.map((screen, index) => (
            <article id={screen.id} key={screen.id} className="tasko-card p-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                Screen 0{index + 1}
              </p>
              <h2 className="mb-3 text-2xl font-semibold tracking-tight">{screen.title}</h2>
              <p className="text-sm leading-7 tasko-muted">{screen.text}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
