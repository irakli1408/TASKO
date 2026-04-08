"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoLink } from "@/components/logo-link";
import { NotificationsNavLink } from "@/components/notifications-nav-link";

type Category = {
  id: number;
  name: string;
  icon: string;
  tone: string;
  subcategories: string[];
};

type Step = {
  id: string;
  title: string;
  text: string;
  icon: "task" | "offers" | "select" | "pay";
};

const categories: Category[] = [
  {
    id: 1,
    name: "Дом и ремонт",
    icon: "⌂",
    tone: "bg-[#EFF6FF] text-[#3B82F6]",
    subcategories: ["Уборка", "Сантехника", "Электрика", "Сборка мебели", "Мелкий ремонт"]
  },
  {
    id: 2,
    name: "Переезды и перевозки",
    icon: "▣",
    tone: "bg-[#F5F3FF] text-[#8B5CF6]",
    subcategories: ["Грузчики", "Помощь с переездом", "Перенос мебели", "Погрузка / разгрузка"]
  },
  {
    id: 3,
    name: "Помощь и забота",
    icon: "♡",
    tone: "bg-[#FDF2F8] text-[#EC4899]",
    subcategories: ["Няня", "Помощь пожилым", "Сиделка", "Сопровождение"]
  },
  {
    id: 4,
    name: "Животные",
    icon: "◔",
    tone: "bg-[#ECFDF5] text-[#10B981]",
    subcategories: ["Выгул собак", "Присмотр", "Передержка", "Поездка к ветеринару"]
  },
  {
    id: 5,
    name: "Разовые поручения",
    icon: "◫",
    tone: "bg-[#FFF7ED] text-[#F59E0B]",
    subcategories: ["Купить продукты", "Аптека", "Забрать посылку", "Срочная помощь"]
  }
];

const steps: Step[] = [
  {
    id: "1",
    title: "Опишите задачу",
    text: "Расскажите, что нужно сделать, укажите бюджет и сроки.",
    icon: "task"
  },
  {
    id: "2",
    title: "Получите предложения",
    text: "Мастера откликнутся на вашу задачу с предложением цены.",
    icon: "offers"
  },
  {
    id: "3",
    title: "Выберите исполнителя",
    text: "Сравните предложения, отзывы и выберите лучшего мастера.",
    icon: "select"
  },
  {
    id: "4",
    title: "Оплатите после работы",
    text: "Проверьте работу и оплачивайте только когда всё готово.",
    icon: "pay"
  }
]

const reviews = [
  {
    name: "Мария Иванова",
    text: "Нашла сантехника за один вечер. Удобно, что чат и уведомления уже внутри платформы."
  },
  {
    name: "Игорь Смирнов",
    text: "В ленте удобно искать задачи по категориям и быстро отправлять предложения."
  },
  {
    name: "Елена Воронова",
    text: "Понятный flow от публикации задачи до выбора мастера и завершения работы."
  }
];

export function LandingShellV3() {
  const { status, logout } = useAuth();
  const { t } = useI18n();
  const [selectedCategoryId, setSelectedCategoryId] = useState(1);
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? categories[0];

  return (
    <main className="bg-[#F7F8FA] pb-0">
      <div className="tasko-shell py-5">
        <header className="tasko-topbar mb-6 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <div className="scale-[0.8] origin-left">
                <LogoLink compact />
              </div>
              <span className="text-[1rem] font-semibold tracking-tight text-[var(--tasko-text)] sm:text-[1.4rem]">
                Tasko
              </span>
            </div>

            <div className="hidden flex-1 items-center justify-end gap-7 pr-8 text-sm font-medium text-[var(--tasko-muted)] lg:flex">
              {status === "authenticated" ? (
                <>
                  <Link href="/tasks/mine" className="transition hover:text-[var(--tasko-text)]">
                    Мои задачи
                  </Link>
                  <Link href="/offers/mine" className="transition hover:text-[var(--tasko-text)]">
                    Мои отклики
                  </Link>
                  <Link href="/jobs/mine" className="transition hover:text-[var(--tasko-text)]">
                    Мои работы
                  </Link>
                  <Link href="/profile" className="transition hover:text-[var(--tasko-text)]">
                    Профиль
                  </Link>
                </>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {status === "authenticated" ? <NotificationsNavLink /> : null}
              <LanguageSwitcher />
              {status === "authenticated" ? (
                <>
                  <Link
                    href="/profile"
                    className="inline-flex min-h-[42px] items-center justify-center rounded-[12px] border border-[var(--tasko-border)] bg-white px-5 text-sm font-semibold text-[var(--tasko-text)] transition hover:bg-[#f8fafc] lg:hidden"
                  >
                    {t("common.profile")}
                  </Link>
                  <Link
                    href="/settings"
                    className="inline-flex min-h-[42px] items-center justify-center rounded-[12px] border border-[#cdeedd] bg-[#f0fdf4] px-5 text-sm font-semibold text-[#16a34a] transition hover:border-[#b7e5cb] hover:bg-[#dcfce7] hover:text-[#15803d] lg:hidden"
                  >
                    {t("common.settings")}
                  </Link>
                  <Link
                    href="/settings"
                    className="hidden h-[42px] w-[42px] items-center justify-center rounded-[12px] border border-[#cdeedd] bg-[#f0fdf4] text-[#16a34a] transition hover:border-[#b7e5cb] hover:bg-[#dcfce7] hover:text-[#15803d] lg:inline-flex"
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
                    className="inline-flex min-h-[42px] items-center justify-center rounded-[12px] border border-[var(--tasko-border)] bg-white px-5 text-sm font-semibold text-[var(--tasko-text)] transition hover:bg-[#f8fafc]"
                  >
                    {t("common.logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex min-h-[42px] items-center justify-center rounded-[12px] border border-[var(--tasko-border)] bg-white px-5 text-sm font-semibold text-[var(--tasko-text)] transition hover:bg-[#f8fafc]"
                  >
                    {t("auth.login")}
                  </Link>
                  <Link href="/register" className="inline-flex min-h-[42px] items-center justify-center rounded-[12px] bg-[#22C55E] px-5 text-sm font-semibold text-white transition hover:bg-[#16A34A]">
                    {t("auth.register")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        <section className="rounded-[18px] bg-[linear-gradient(180deg,#F8FBFF_0%,#FFFFFF_100%)] px-4 py-14 text-center sm:px-8 sm:py-20">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-[2.3rem] font-bold leading-tight tracking-[-0.03em] text-[var(--tasko-text)] sm:text-[3.55rem]">
              Найдите лучшего мастера
              <br />
              за 5 минут
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[var(--tasko-muted)]">
              Разместите задачу бесплатно и получите предложения от проверенных специалистов по нужной категории и району.
            </p>

            <div className="mx-auto mt-8 flex max-w-xl flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href={status === "authenticated" ? "/tasks/create" : "/register"}
                className="inline-flex min-h-[52px] min-w-[220px] items-center justify-center rounded-[12px] bg-[#22C55E] px-6 text-sm font-semibold text-white transition hover:bg-[#16A34A]"
              >
                Разместить задачу
              </Link>
              <Link
                href="/feed"
                className="inline-flex min-h-[52px] min-w-[220px] items-center justify-center rounded-[12px] border border-[var(--tasko-border)] bg-white px-6 text-sm font-semibold text-[var(--tasko-text)] transition hover:bg-[#f8fafc]"
              >
                Найти работу
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-5 text-sm text-[var(--tasko-muted)]">
              <span>Более 10,000 мастеров</span>
              <span>50,000+ выполненных задач</span>
              <span>Проверенные специалисты</span>
            </div>
          </div>
        </section>

        <section className="rounded-[18px] border border-[var(--tasko-border)] bg-white px-4 py-10 sm:px-8">
          <div className="text-center">
            <h2 className="text-[2rem] font-semibold tracking-tight text-[var(--tasko-text)]">
              Какая помощь вам нужна?
            </h2>
            <p className="mt-2 text-sm text-[var(--tasko-muted)]">
              Выберите категорию и найдите подходящего специалиста
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {categories.map((category) => {
              const active = category.id === selectedCategoryId;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`rounded-[16px] border p-5 text-left transition ${
                    active
                      ? "border-[#86efac] bg-[#f0fdf4] shadow-[0_16px_36px_rgba(34,197,94,0.08)]"
                      : "border-[var(--tasko-border)] bg-white hover:border-[#86efac] hover:bg-[#f0fdf4] hover:shadow-[0_14px_30px_rgba(34,197,94,0.08)]"
                  }`}
                >
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-[14px] text-xl font-semibold ${category.tone}`}>
                    {category.icon}
                  </div>
                  <p className="mt-4 text-base font-semibold leading-tight text-[var(--tasko-text)]">
                    {category.name}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-[16px] bg-[#F8FAFD] p-4">
            <p className="text-lg font-semibold text-[var(--tasko-text)]">{selectedCategory.name}</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {selectedCategory.subcategories.map((subcategory, index) => (
                <span
                  key={subcategory}
                  className={`inline-flex rounded-full px-4 py-2 text-sm font-medium ${
                    index === 0
                      ? "bg-[#22C55E] text-white"
                      : "border border-[var(--tasko-border)] bg-white text-[var(--tasko-text)]"
                  }`}
                >
                  {subcategory}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[18px] border border-[var(--tasko-border)] bg-white px-4 py-10 sm:px-8">
          <div className="text-center">
            <h2 className="text-[2rem] font-semibold tracking-tight text-[var(--tasko-text)]">
              Как это работает
            </h2>
            <p className="mt-2 text-sm text-[var(--tasko-muted)]">
              Простой процесс от размещения задачи до её выполнения
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step) => (
              <div
                key={step.id}
                className="relative rounded-[16px] border border-[var(--tasko-border)] bg-white p-5 text-center shadow-[0_10px_25px_rgba(15,23,42,0.03)]"
              >
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#10B981] text-xs font-semibold text-white shadow-[0_10px_22px_rgba(16,185,129,0.26)]">
                    {step.id}
                  </div>
                </div>
                <div className="mx-auto mt-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF6FF] text-[#2F6BFF]">
                  <StepIcon kind={step.icon} />
                </div>
                <p className="mt-4 text-lg font-semibold text-[var(--tasko-text)]">{step.title}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--tasko-muted)]">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[18px] border border-[var(--tasko-border)] bg-white px-4 py-10 sm:px-8">
          <div className="text-center">
            <h2 className="text-[2rem] font-semibold tracking-tight text-[var(--tasko-text)]">
              Отзывы наших пользователей
            </h2>
            <p className="mt-2 text-sm text-[var(--tasko-muted)]">
              Тысячи клиентов и мастеров уже используют Tasko
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {reviews.map((review) => (
              <article
                key={review.name}
                className="rounded-[16px] border border-[var(--tasko-border)] bg-white p-5 shadow-[0_10px_25px_rgba(15,23,42,0.03)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F1FF] text-sm font-semibold text-[#3B82F6]">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--tasko-text)]">{review.name}</p>
                    <p className="text-xs text-[#F59E0B]">★★★★★</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-[var(--tasko-muted)]">{review.text}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className="bg-[#111827] px-4 py-10 text-white sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <LogoLink compact />
                <span className="text-lg font-semibold">Tasko</span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-7 text-white/70">
                Платформа для поиска мастеров и заказов в вашем городе.
              </p>
            </div>

            <FooterColumn title="Для клиентов" items={["Разместить задачу", "Как это работает", "Категории услуг"]} />
            <FooterColumn title="Для мастеров" items={["Найти заказы", "Стать мастером", "Профиль и рейтинг"]} />
            <FooterColumn title="Поддержка" items={["Центр помощи", "Контакты", "Политика конфиденциальности"]} />
          </div>
        </footer>
      </div>
    </main>
  );
}

function FooterColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="mt-4 grid gap-2 text-sm text-white/70">
        {items.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>
  );
}

function StepIcon({ kind }: { kind: Step["icon"] }) {
  if (kind === "task") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 7h8" />
        <path d="M8 12h8" />
        <path d="M8 17h5" />
        <rect x="4" y="4" width="16" height="16" rx="3" />
      </svg>
    );
  }

  if (kind === "offers") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 12h10" />
        <path d="M12 7l5 5-5 5" />
        <path d="M7 7H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1" />
      </svg>
    );
  }

  if (kind === "select") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8" />
        <path d="m9.5 12 1.7 1.7 3.3-3.4" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="M4 10h16" />
      <path d="M8 15h2" />
    </svg>
  );
}
