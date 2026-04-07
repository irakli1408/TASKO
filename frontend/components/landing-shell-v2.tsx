"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoLink } from "@/components/logo-link";
import { NotificationsNavLink } from "@/components/notifications-nav-link";

type LandingCategory = {
  id: number;
  name: string;
  icon: string;
  accentClass: string;
  iconClass: string;
  subcategories: string[];
};

const categories: LandingCategory[] = [
  {
    id: 1,
    name: "Дом и ремонт",
    icon: "⌂",
    accentClass: "from-[#60A5FA] to-[#3B82F6]",
    iconClass: "bg-[#EEF6FF] text-[#3B82F6]",
    subcategories: ["Уборка", "Сантехника", "Электрика", "Сборка мебели", "Мелкий ремонт"]
  },
  {
    id: 2,
    name: "Переезды и перевозки",
    icon: "▣",
    accentClass: "from-[#A78BFA] to-[#8B5CF6]",
    iconClass: "bg-[#F4EDFF] text-[#8B5CF6]",
    subcategories: ["Грузчики", "Помощь с переездом", "Перенос мебели", "Погрузка / разгрузка"]
  },
  {
    id: 3,
    name: "Помощь и забота",
    icon: "♡",
    accentClass: "from-[#FB7185] to-[#EC4899]",
    iconClass: "bg-[#FFF1F7] text-[#EC4899]",
    subcategories: ["Няня", "Помощь пожилым", "Сиделка", "Сопровождение"]
  },
  {
    id: 4,
    name: "Животные",
    icon: "◔",
    accentClass: "from-[#34D399] to-[#10B981]",
    iconClass: "bg-[#ECFDF5] text-[#10B981]",
    subcategories: ["Выгул собак", "Присмотр", "Передержка", "Поездка к ветеринару"]
  },
  {
    id: 5,
    name: "Разовые поручения",
    icon: "◫",
    accentClass: "from-[#F59E0B] to-[#FB923C]",
    iconClass: "bg-[#FFF7ED] text-[#F59E0B]",
    subcategories: ["Купить продукты", "Аптека", "Забрать посылку", "Срочная помощь"]
  }
];

const steps = [
  {
    id: 1,
    title: "Опишите задачу",
    text: "Клиент выбирает категорию, добавляет описание, бюджет и публикует задачу."
  },
  {
    id: 2,
    title: "Получите предложения",
    text: "Исполнители открывают ленту, видят бюджет и район и отправляют свои offers."
  },
  {
    id: 3,
    title: "Выберите мастера",
    text: "Назначьте подходящего исполнителя и продолжите работу в общем чате Tasko."
  }
];

const testimonials = [
  {
    name: "Мария Иванова",
    role: "Клиент",
    text: "Разместила задачу вечером, а утром уже выбрала мастера и договорилась по срокам в чате."
  },
  {
    name: "Ираклий Н.",
    role: "Мастер",
    text: "В ленте сразу видно задачи по нужным категориям, бюджету и району. Можно быстро откликнуться."
  },
  {
    name: "Нино Г.",
    role: "Клиент",
    text: "Понравилось, что после выбора мастера все осталось внутри платформы: чат, уведомления и статусы."
  }
];

const trustPoints = ["Более 10,000 мастеров", "Быстрые отклики", "Проверенные профили"];

export function LandingShellV2() {
  const { status, logout } = useAuth();
  const { t } = useI18n();
  const [selectedCategoryId, setSelectedCategoryId] = useState(1);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) ?? categories[0],
    [selectedCategoryId]
  );

  return (
    <main className="bg-[var(--tasko-bg)] py-4 sm:py-6">
      <section className="tasko-shell flex min-h-screen flex-col gap-6 pb-12">
        <header className="tasko-card px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <LogoLink compact />
              <div className="hidden sm:block">
                <p className="text-lg font-semibold text-[var(--tasko-text)]">Tasko</p>
                <p className="text-sm text-[var(--tasko-muted)]">Маркетплейс услуг для задач и мастеров</p>
              </div>
            </div>

            <div className="hidden items-center gap-6 text-sm font-medium text-[var(--tasko-muted)] lg:flex">
              <Link href="/feed" className="transition hover:text-[var(--tasko-text)]">
                Найти работу
              </Link>
              <Link href="/tasks/create" className="transition hover:text-[var(--tasko-text)]">
                Разместить задачу
              </Link>
              <Link href="/notifications" className="transition hover:text-[var(--tasko-text)]">
                Уведомления
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <LanguageSwitcher />
              {status === "authenticated" ? <NotificationsNavLink /> : null}
              {status === "authenticated" ? (
                <button type="button" onClick={() => void logout()} className="tasko-secondary-btn">
                  {t("common.logout")}
                </button>
              ) : (
                <>
                  <Link href="/login" className="tasko-secondary-btn">
                    {t("auth.login")}
                  </Link>
                  <Link href="/register" className="tasko-primary-btn bg-[#22C55E] hover:bg-[#16A34A]">
                    {t("auth.register")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        <section className="tasko-card overflow-hidden p-0">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="bg-[linear-gradient(180deg,#27313F_0%,#374151_100%)] px-6 py-10 text-white sm:px-8 lg:px-10 lg:py-12">
              <div className="max-w-xl">
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                  Tasko marketplace
                </span>
                <h1 className="mt-5 text-[2.1rem] font-bold leading-[1.02] tracking-[-0.03em] sm:text-[3.1rem]">
                  Найдите лучшего мастера
                  <br />
                  за 5 минут
                </h1>
                <p className="mt-5 max-w-lg text-base leading-7 text-white/78">
                  Разместите задачу бесплатно, получите предложения от исполнителей, выберите мастера и ведите работу в одном понятном процессе.
                </p>

                <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div className="flex min-h-[52px] items-center rounded-[12px] border border-white/12 bg-white/8 px-4 text-sm text-white/70">
                    Что нужно сделать?
                  </div>
                  <Link
                    href={status === "authenticated" ? "/tasks/create" : "/register"}
                    className="inline-flex min-h-[52px] items-center justify-center rounded-[12px] bg-[#22C55E] px-6 text-sm font-semibold text-white transition hover:bg-[#16A34A]"
                  >
                    Разместить задачу
                  </Link>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {trustPoints.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 bg-white/8 px-3 py-2 text-sm text-white/80"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[linear-gradient(180deg,#F8FAFC_0%,#EEF4FF_100%)] px-6 py-10 sm:px-8 lg:px-10">
              <div className="mx-auto max-w-sm rounded-[28px] border border-[#d7e2f1] bg-white p-5 shadow-[0_30px_70px_rgba(15,23,42,0.08)]">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-[var(--tasko-text)]">Tasko</p>
                    <p className="text-sm text-[var(--tasko-muted)]">Живой процесс задачи</p>
                  </div>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F1FF] text-xl text-[#3B82F6]">
                    ⋮
                  </span>
                </div>

                <div className="rounded-[20px] bg-[linear-gradient(135deg,#3B82F6_0%,#2563EB_100%)] p-5 text-white">
                  <p className="text-sm font-medium text-white/80">Task #10891</p>
                  <p className="mt-2 text-[1.75rem] font-semibold leading-tight">
                    Замена смесителя
                    <br />
                    в ванной комнате
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/85">
                    <span>Бюджет: 5000 ₽</span>
                    <span>Статус: В работе</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    { title: "Предложения", value: "4 оффера", tone: "bg-[#ECFDF5] text-[#15803D]" },
                    { title: "Чат", value: "1 новое", tone: "bg-[#EEF6FF] text-[#2563EB]" },
                    { title: "Назначен", value: "Мастер", tone: "bg-[#FFF7ED] text-[#D97706]" },
                    { title: "Уведомления", value: "3 события", tone: "bg-[#F5F3FF] text-[#7C3AED]" }
                  ].map((item) => (
                    <div key={item.title} className="rounded-[18px] border border-[#e5edf8] bg-white p-4">
                      <p className="text-sm font-semibold text-[var(--tasko-text)]">{item.title}</p>
                      <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.tone}`}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="tasko-card p-5 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8BA0C3]">
                Категории
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--tasko-text)]">
                Какая помощь вам нужна?
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/tasks/create" className="tasko-primary-btn">
                Создать задачу
              </Link>
              <Link href="/feed" className="tasko-secondary-btn">
                Открыть ленту
              </Link>
            </div>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {categories.map((category) => {
              const active = selectedCategory.id === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`rounded-[20px] border p-5 text-left transition ${
                    active
                      ? "border-[#bfdbfe] bg-[#f9fbff] shadow-[0_20px_40px_rgba(59,130,246,0.10)]"
                      : "border-[var(--tasko-border)] bg-white hover:border-[#cfd9ea]"
                  }`}
                >
                  <span className={`inline-flex h-12 w-12 items-center justify-center rounded-[14px] text-xl font-semibold ${category.iconClass}`}>
                    {category.icon}
                  </span>
                  <p className="mt-4 text-lg font-semibold leading-tight text-[var(--tasko-text)]">
                    {category.name}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-[20px] bg-[var(--tasko-soft)] p-4 sm:p-5">
            <p className="text-2xl font-semibold tracking-tight text-[var(--tasko-text)]">
              {selectedCategory.name}
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {selectedCategory.subcategories.map((subcategory, index) => (
                <span
                  key={subcategory}
                  className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
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

        <section className="tasko-card p-5 sm:p-6 lg:p-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8BA0C3]">
              Как это работает
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--tasko-text)]">
              Простой и прозрачный процесс
            </h2>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {steps.map((step) => (
              <div key={step.id} className="tasko-soft-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F1FF] text-sm font-semibold text-[#2563EB]">
                  {step.id}
                </div>
                <h3 className="mt-4 text-xl font-semibold text-[var(--tasko-text)]">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--tasko-muted)]">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="tasko-card p-5 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8BA0C3]">
                Отзывы
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--tasko-text)]">
                Что говорят пользователи Tasko
              </h2>
            </div>
            <div className="rounded-full bg-[#EEF6FF] px-4 py-2 text-sm font-semibold text-[#2563EB]">
              Доверие и быстрый отклик
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {testimonials.map((item) => (
              <article key={item.name} className="tasko-soft-card p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E8F1FF] text-sm font-semibold text-[#2563EB]">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--tasko-text)]">{item.name}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-[#94A3B8]">{item.role}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-[var(--tasko-muted)]">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[16px] bg-[#0EA5E9] px-5 py-10 text-center text-white sm:px-8">
          <h2 className="text-3xl font-semibold tracking-tight">Готовы начать?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/90">
            Разместите первую задачу бесплатно или откройте ленту и найдите новую работу уже сегодня.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/tasks/create" className="tasko-primary-btn bg-white text-[#0EA5E9] hover:bg-[#EFF8FF]">
              Разместить задачу
            </Link>
            <Link href="/feed" className="tasko-secondary-btn border-white/30 bg-transparent text-white hover:bg-white/10">
              Найти работу
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
