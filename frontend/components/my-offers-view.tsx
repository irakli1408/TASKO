"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GuardedPage } from "@/components/guarded-page";
import { useI18n } from "@/components/i18n-provider";

type OfferStatus = "pending" | "accepted" | "rejected";

type MockOffer = {
  id: number;
  taskId: number;
  taskTitle: string;
  category: string;
  location: string;
  price: number;
  status: OfferStatus;
  createdAt: string;
  customerName: string;
  description: string;
};

const mockOffers: MockOffer[] = [
  {
    id: 301,
    taskId: 23,
    taskTitle: "Замена смесителя на кухне",
    category: "Сантехника",
    location: "Ваке",
    price: 120,
    status: "pending",
    createdAt: "2026-04-06T13:45:00Z",
    customerName: "Нино Беридзе",
    description: "Нужно снять старый смеситель и аккуратно поставить новый сегодня вечером."
  },
  {
    id: 302,
    taskId: 19,
    taskTitle: "Сборка шкафа и тумбы",
    category: "Сборка мебели",
    location: "Сабуртало",
    price: 180,
    status: "accepted",
    createdAt: "2026-04-05T10:10:00Z",
    customerName: "Георгий Мчедлишвили",
    description: "Две коробки мебели, желательно прийти с инструментом и собрать за один визит."
  },
  {
    id: 303,
    taskId: 14,
    taskTitle: "Выгул собаки два раза в день",
    category: "Выгул собак",
    location: "Мтацминда",
    price: 90,
    status: "rejected",
    createdAt: "2026-04-03T08:25:00Z",
    customerName: "Мариам Джапаридзе",
    description: "Ищу исполнителя на три дня, утром и вечером по 30 минут."
  }
];

export function MyOffersView() {
  const { locale, t } = useI18n();
  const [statusFilter, setStatusFilter] = useState<"all" | OfferStatus>("all");

  const filteredOffers = useMemo(() => {
    if (statusFilter === "all") {
      return mockOffers;
    }

    return mockOffers.filter((offer) => offer.status === statusFilter);
  }, [statusFilter]);

  const stats = useMemo(
    () => ({
      total: mockOffers.length,
      pending: mockOffers.filter((offer) => offer.status === "pending").length,
      accepted: mockOffers.filter((offer) => offer.status === "accepted").length
    }),
    []
  );

  return (
    <GuardedPage title={t("myOffers.title")} description={t("myOffers.description")}>
      <div className="grid gap-6">
        <section className="grid gap-4 md:grid-cols-3">
          <OfferStatCard label={t("myOffers.allOffers")} value={String(stats.total)} tone="blue" />
          <OfferStatCard label={t("myOffers.pending")} value={String(stats.pending)} tone="amber" />
          <OfferStatCard label={t("myOffers.accepted")} value={String(stats.accepted)} tone="green" />
        </section>

        <section className="tasko-card overflow-hidden p-0">
          <div className="border-b border-[var(--tasko-border)] bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                  {t("myOffers.workspace")}
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--tasko-text)]">
                  {t("myOffers.sentOffers")}
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {([
                  ["all", t("myOffers.filterAll")],
                  ["pending", t("myOffers.pending")],
                  ["accepted", t("myOffers.accepted")],
                  ["rejected", t("myOffers.rejected")]
                ] as const).map(([value, label]) => {
                  const active = statusFilter === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStatusFilter(value)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? "bg-[#111827] text-white shadow-[0_12px_24px_rgba(17,24,39,0.14)]"
                          : "border border-[#dfe7f3] bg-white text-[#607392] hover:border-[#cbd8eb]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-6">
            {filteredOffers.length === 0 ? (
              <div className="tasko-soft-card p-6 text-sm tasko-muted">{t("myOffers.empty")}</div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {filteredOffers.map((offer) => (
                  <article
                    key={offer.id}
                    className="rounded-[1.8rem] border border-[#dfe7f3] bg-white p-5 shadow-[0_16px_34px_rgba(42,78,148,0.08)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="tasko-pill">#{offer.taskId}</span>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${getOfferTone(
                              offer.status
                            )}`}
                          >
                            {getOfferStatusLabel(offer.status, t)}
                          </span>
                        </div>
                        <h3 className="mt-3 text-xl font-semibold tracking-tight text-[var(--tasko-text)]">
                          {offer.taskTitle}
                        </h3>
                        <p className="mt-2 text-sm tasko-muted">{offer.customerName}</p>
                      </div>

                      <div className="rounded-[1.25rem] bg-[#f4f7fc] px-4 py-3 text-right">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                          {t("myOffers.yourPrice")}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-[var(--tasko-text)]">
                          {formatBudget(offer.price, locale)}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-7 tasko-muted">{offer.description}</p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <OfferMetaCard label={t("myOffers.category")} value={offer.category} />
                      <OfferMetaCard label={t("myOffers.location")} value={offer.location} />
                      <OfferMetaCard
                        label={t("myOffers.sentAt")}
                        value={formatDate(offer.createdAt, locale)}
                      />
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link href={`/tasks/${offer.taskId}`} className="tasko-secondary-btn">
                        {t("myOffers.openTask")}
                      </Link>
                      {offer.status === "accepted" ? (
                        <Link href={`/tasks/${offer.taskId}/chat`} className="tasko-primary-btn">
                          {t("myOffers.openChat")}
                        </Link>
                      ) : (
                        <Link href={`/tasks/${offer.taskId}`} className="tasko-secondary-btn">
                          {t("myOffers.reviewTask")}
                        </Link>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </GuardedPage>
  );
}

function OfferStatCard({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "blue" | "amber" | "green";
}) {
  const toneClass =
    tone === "blue"
      ? "bg-[#eef4ff] text-[#2f6bff]"
      : tone === "amber"
        ? "bg-[#fff7e8] text-[#d48a12]"
        : "bg-[#eef9f0] text-[#23915d]";

  return (
    <div className="tasko-card p-5">
      <div className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${toneClass}`}>
        {label}
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-[var(--tasko-text)]">{value}</p>
    </div>
  );
}

function OfferMetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] bg-[#f4f7fc] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--tasko-text)]">{value}</p>
    </div>
  );
}

function getOfferTone(status: OfferStatus) {
  if (status === "accepted") return "bg-[#eef9f0] text-[#23724d]";
  if (status === "rejected") return "bg-[#fff1f1] text-[#c53a3a]";
  return "bg-[#eef4ff] text-[#2f6bff]";
}

function getOfferStatusLabel(status: OfferStatus, t: (key: string) => string) {
  if (status === "accepted") return t("myOffers.accepted");
  if (status === "rejected") return t("myOffers.rejected");
  return t("myOffers.pending");
}

function formatBudget(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value: string, locale: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}
