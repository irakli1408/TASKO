"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoLink } from "@/components/logo-link";
import { NotificationsNavLink } from "@/components/notifications-nav-link";

const categoryAccentClasses = [
  "from-[#1b6fff] to-[#58a2ff]",
  "from-[#19b86c] to-[#54d58f]",
  "from-[#fb7a27] to-[#ff9a57]",
  "from-[#7256ff] to-[#9a7fff]",
  "from-[#17b0a7] to-[#41d4cb]",
  "from-[#2f6bff] to-[#6e7cff]"
] as const;

const marketplaceCategories = [
  {
    id: 1,
    name: "Дом и ремонт",
    subcategories: ["Уборка", "Сантехника", "Электрика", "Сборка мебели", "Мелкий ремонт"]
  },
  {
    id: 2,
    name: "Переезды и перевозки",
    subcategories: ["Грузчики", "Помощь с переездом", "Перенос мебели", "Погрузка / разгрузка"]
  },
  {
    id: 3,
    name: "Помощь и забота",
    subcategories: ["Няня", "Помощь пожилым", "Сиделка", "Сопровождение"]
  },
  {
    id: 4,
    name: "Животные",
    subcategories: ["Выгул собак", "Присмотр", "Передержка", "Поездка к ветеринару"]
  },
  {
    id: 5,
    name: "Разовые поручения",
    subcategories: ["Купить продукты", "Аптека", "Забрать посылку", "Срочная помощь"]
  }
] as const;

export function SiteShell() {
  const { status, user, logout } = useAuth();
  const { t } = useI18n();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(1);

  const selectedCategory =
    marketplaceCategories.find((category) => category.id === selectedCategoryId) ?? marketplaceCategories[0];

  const sections = [
    {
      eyebrow: t("common.feed"),
      title: t("home.screen1Title"),
      text: t("home.screen1Text"),
      href: "/feed",
      action: t("home.browseFeed")
    },
    {
      eyebrow: t("common.createTask"),
      title: t("home.screen2Title"),
      text: t("home.screen2Text"),
      href: "/tasks/create",
      action: t("common.createTask")
    },
    {
      eyebrow: t("common.profile"),
      title: t("home.screen3Title"),
      text: t("home.screen3Text"),
      href: "/profile",
      action: t("common.goToProfile")
    },
    {
      eyebrow: t("home.navChat"),
      title: t("home.screen4Title"),
      text: t("home.screen4Text"),
      href: "/notifications",
      action: t("common.notifications")
    }
  ];

  return (
    <main className="relative overflow-hidden py-4 sm:py-6">
      <section className="tasko-shell flex min-h-screen flex-col gap-6 pb-12">
        <section className="overflow-hidden rounded-[32px] bg-[#2a2c31] text-white shadow-[0_30px_80px_rgba(18,24,35,0.18)]">
          <div className="border-b border-white/10 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <LogoLink compact />
                <div className="hidden min-w-[220px] rounded-full border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/60 md:block">
                  {t("home.heroBadge")}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                <div className="rounded-full border border-white/12 bg-white/6 px-1 py-1">
                  <LanguageSwitcher />
                </div>
                {status === "authenticated" ? <NotificationsNavLink /> : null}
                {status === "authenticated" ? (
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="rounded-full border border-white/20 bg-transparent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    {t("common.logout")}
                  </button>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="rounded-full border border-white/20 bg-transparent px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      {t("auth.login")}
                    </Link>
                    <Link
                      href="/register"
                      className="rounded-full bg-white px-5 py-2.5 text-center text-sm font-semibold text-[#1b6fff] transition hover:bg-[#edf4ff]"
                    >
                      {t("auth.register")}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="relative px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
            <div className="absolute inset-y-0 right-0 hidden w-[40%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent_58%)] lg:block" />
            <div className="absolute right-[12%] top-[22%] hidden h-44 w-44 rounded-full border border-white/10 bg-white/5 blur-[1px] lg:block" />
            <div className="absolute right-[22%] top-[46%] hidden h-20 w-20 rounded-full bg-white/7 lg:block" />

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_290px] lg:items-center">
              <div className="space-y-6">
                <div className="md:hidden">
                  <div className="tasko-pill border-white/15 bg-white/10 text-white/80">
                    {t("home.heroBadge")}
                  </div>
                </div>

                <h1 className="max-w-3xl text-[2.2rem] font-semibold leading-[0.96] tracking-[-0.04em] sm:text-[3rem] lg:text-[3.8rem]">
                  Найдите мастера для своей задачи быстро и просто
                </h1>

                <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
                  {t("home.heroText")}
                </p>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link href="/register" className="rounded-full bg-[#2f6bff] px-6 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-[#2457d6]">
                    {t("home.createAccount")}
                  </Link>
                  <Link href="/login" className="rounded-full border border-white/18 bg-white/8 px-6 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-white/12">
                    {t("home.openPlatform")}
                  </Link>
                </div>
              </div>

              <div className="mx-auto w-full max-w-[230px] rounded-[32px] border border-white/14 bg-white/6 p-3 shadow-[0_20px_36px_rgba(0,0,0,0.2)] backdrop-blur sm:max-w-[260px] md:max-w-[280px] lg:mr-2 lg:mt-6">
                <div className="rounded-[26px] bg-[#23252a] p-3">
                  <p className="mb-3 text-xl font-semibold">Tasko</p>
                  <div className="space-y-2.5">
                    {marketplaceCategories.slice(0, 4).map((item, index) => (
                      <div
                        key={item.id}
                        className={`rounded-[22px] bg-gradient-to-r px-4 py-4 text-base font-semibold text-white ${categoryAccentClasses[index]}`}
                      >
                        {item.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="tasko-card p-5 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#7a8cac]">{t("home.platformLabel")}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {t("home.platformTitle")}
              </h2>
            </div>
            <div className="flex gap-3">
              <Link href="/tasks/create" className="tasko-primary-btn min-h-[48px] px-5">
                {t("common.createTask")}
              </Link>
              <Link href="/feed" className="tasko-secondary-btn min-h-[48px] px-5">
                {t("home.browseFeed")}
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {marketplaceCategories.map((category, index) => {
              const isActive = category.id === selectedCategory.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`relative overflow-hidden rounded-[24px] bg-gradient-to-r px-5 py-5 text-left text-white shadow-[0_16px_30px_rgba(46,78,145,0.18)] transition hover:scale-[1.01] ${categoryAccentClasses[index]} ${
                    isActive ? "ring-4 ring-[#dfeaff]" : ""
                  }`}
                >
                  <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/12" />
                  <div className="absolute bottom-0 right-0 h-16 w-16 rounded-tl-[28px] bg-white/10" />
                  <div className="relative flex min-h-[96px] flex-col justify-between">
                    <p className="max-w-[160px] text-xl font-semibold leading-tight">{category.name}</p>
                    {isActive ? (
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-[#1f9e76]">
                        ✓
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-[26px] bg-[#f5f8fd] px-4 py-5 sm:px-5">
            <p className="text-xl font-semibold tracking-tight text-[#16233b]">{selectedCategory.name}</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {selectedCategory.subcategories.map((subcategory, index) => (
                <span
                  key={subcategory}
                  className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
                    index === 0
                      ? "bg-[#1fbea1] text-white"
                      : "bg-white text-[#334764] shadow-[0_6px_16px_rgba(53,83,127,0.08)]"
                  }`}
                >
                  {subcategory}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {sections.map((card) => (
            <article key={card.href} className="tasko-card flex flex-col p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                {card.eyebrow}
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight">{card.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-7 tasko-muted">{card.text}</p>
              <Link href={card.href} className="tasko-secondary-btn mt-5 min-h-[48px] px-5">
                {card.action}
              </Link>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
