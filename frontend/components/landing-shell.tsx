"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoLink } from "@/components/logo-link";
import { NotificationsNavLink } from "@/components/notifications-nav-link";

const categories = [
  {
    id: 1,
    name: "Дом и ремонт",
    tone: "bg-[#E8F1FF] text-[#2563EB]",
    subcategories: ["Уборка", "Сантехника", "Электрика", "Сборка мебели", "Мелкий ремонт"]
  },
  {
    id: 2,
    name: "Переезды и перевозки",
    tone: "bg-[#ECFDF3] text-[#16A34A]",
    subcategories: ["Грузчики", "Помощь с переездом", "Перенос мебели", "Погрузка / разгрузка"]
  },
  {
    id: 3,
    name: "Помощь и забота",
    tone: "bg-[#FFF4E8] text-[#EA580C]",
    subcategories: ["Няня", "Помощь пожилым", "Сиделка", "Сопровождение"]
  },
  {
    id: 4,
    name: "Животные",
    tone: "bg-[#F4EDFF] text-[#7C3AED]",
    subcategories: ["Выгул собак", "Присмотр", "Передержка", "Поездка к ветеринару"]
  },
  {
    id: 5,
    name: "Разовые поручения",
    tone: "bg-[#ECFEFF] text-[#0F766E]",
    subcategories: ["Купить продукты", "Аптека", "Забрать посылку", "Срочная помощь"]
  }
] as const;

export function LandingShell() {
  const { status, logout } = useAuth();
  const { t } = useI18n();
  const [selectedCategoryId, setSelectedCategoryId] = useState(1);

  const selectedCategory =
    categories.find((category) => category.id === selectedCategoryId) ?? categories[0];

  const showcaseCards = [
    {
      eyebrow: "Для клиента",
      title: "Создай задачу и получи отклики",
      text: "Публикуй задачу, получай предложения от мастеров и выбирай исполнителя без лишних звонков.",
      href: "/tasks/create",
      action: "Создать задачу"
    },
    {
      eyebrow: "Для мастера",
      title: "Находи подходящие задачи в ленте",
      text: "Открывай feed, отправляй offer, получай назначение и веди работу через чат.",
      href: "/feed",
      action: "Открыть ленту"
    },
    {
      eyebrow: "После назначения",
      title: "Веди работу в одном рабочем процессе",
      text: "Чат, статусы задачи и уведомления помогают обеим сторонам не терять договоренности.",
      href: "/notifications",
      action: "Открыть уведомления"
    }
  ];

  return (
    <main className="py-4 sm:py-6">
      <section className="tasko-shell flex min-h-screen flex-col gap-6 pb-12">
        <header className="tasko-topbar p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <LogoLink compact />
              <div>
                <p className="text-sm font-semibold text-[var(--tasko-text)]">Tasko</p>
                <p className="mt-1 text-sm tasko-muted">Marketplace для клиентов и мастеров</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <LanguageSwitcher />
              {status === "authenticated" ? <NotificationsNavLink /> : null}
              {status === "authenticated" ? (
                <button type="button" onClick={() => void logout()} className="tasko-primary-btn">
                  {t("common.logout")}
                </button>
              ) : (
                <>
                  <Link href="/login" className="tasko-secondary-btn">
                    {t("auth.login")}
                  </Link>
                  <Link href="/register" className="tasko-primary-btn">
                    {t("auth.register")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_360px]">
          <article className="tasko-card p-6 sm:p-8 lg:p-10">
            <span className="tasko-pill">Быстрый сервис для бытовых задач</span>
            <h1 className="mt-5 max-w-3xl text-[2.15rem] font-bold leading-tight tracking-[-0.03em] text-[var(--tasko-text)] sm:text-[2.8rem] lg:text-[3.5rem]">
              Найдите мастера для своей задачи быстро и просто
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 tasko-muted">
              Клиент создает задачу, получает предложения, выбирает исполнителя и ведет работу в одном месте.
              Мастер находит задачи в ленте, отправляет offer и получает заказ без лишней переписки вне платформы.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={status === "authenticated" ? "/tasks/create" : "/register"}
                className="tasko-primary-btn"
              >
                {status === "authenticated" ? "Создать задачу" : "Создать аккаунт"}
              </Link>
              <Link
                href={status === "authenticated" ? "/feed" : "/login"}
                className="tasko-secondary-btn"
              >
                {status === "authenticated" ? "Перейти в ленту" : "Войти в платформу"}
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <LandingMetric title="Черновик → публикация" value="Задачи" />
              <LandingMetric title="Offer → назначение" value="Исполнители" />
              <LandingMetric title="Чат → завершение" value="Workflow" />
            </div>
          </article>

          <aside className="tasko-card p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#94A3B8]">
              Как работает Tasko
            </p>
            <div className="mt-5 space-y-4">
              <MiniStep
                index="01"
                title="Клиент создает задачу"
                text="Категория, описание, бюджет, фото и публикация в marketplace."
              />
              <MiniStep
                index="02"
                title="Мастера отправляют offers"
                text="Исполнители видят задачу в feed и предлагают свою цену и комментарий."
              />
              <MiniStep
                index="03"
                title="Выбор мастера и работа"
                text="После назначения открывается чат, статусы задачи и дальнейший flow."
              />
            </div>
          </aside>
        </section>

        <section className="tasko-card p-5 sm:p-6 lg:p-8">
          <div>
            <p className="text-sm font-semibold text-[#94A3B8]">Категории</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--tasko-text)] sm:text-3xl">
              Выберите нужное направление
            </h2>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {categories.map((category) => {
              const isActive = category.id === selectedCategory.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`rounded-[16px] border px-4 py-5 text-left transition ${
                    isActive
                      ? "border-[#BFDBFE] bg-white shadow-[0_10px_24px_rgba(59,130,246,0.10)]"
                      : "border-[var(--tasko-border)] bg-[var(--tasko-soft)]"
                  }`}
                >
                  <div className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${category.tone}`}>
                    {category.subcategories.length} подкатегории
                  </div>
                  <p className="mt-4 text-xl font-semibold leading-tight text-[var(--tasko-text)]">
                    {category.name}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-[16px] border border-[var(--tasko-border)] bg-[var(--tasko-soft)] p-4 sm:p-5">
            <p className="text-xl font-semibold tracking-tight text-[var(--tasko-text)]">
              {selectedCategory.name}
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {selectedCategory.subcategories.map((subcategory, index) => (
                <span
                  key={subcategory}
                  className={`inline-flex rounded-full px-4 py-2 text-sm font-medium ${
                    index === 0
                      ? "bg-[var(--tasko-primary)] text-white"
                      : "border border-[var(--tasko-border)] bg-white text-[var(--tasko-text)]"
                  }`}
                >
                  {subcategory}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {showcaseCards.map((card) => (
            <article key={card.href} className="tasko-card flex flex-col p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#94A3B8]">
                {card.eyebrow}
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--tasko-text)]">
                {card.title}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-7 tasko-muted">{card.text}</p>
              <Link href={card.href} className="tasko-secondary-btn mt-5">
                {card.action}
              </Link>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

function LandingMetric({ title, value }: { title: string; value: string }) {
  return (
    <div className="tasko-soft-card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">{value}</p>
      <p className="mt-2 text-sm font-medium text-[var(--tasko-text)]">{title}</p>
    </div>
  );
}

function MiniStep({
  index,
  title,
  text
}: {
  index: string;
  title: string;
  text: string;
}) {
  return (
    <div className="tasko-soft-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F1FF] text-xs font-semibold text-[#2563EB]">
          {index}
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--tasko-text)]">{title}</p>
          <p className="mt-2 text-sm leading-7 tasko-muted">{text}</p>
        </div>
      </div>
    </div>
  );
}
