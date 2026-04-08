"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GuardedPage } from "@/components/guarded-page";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { getErrorMessage } from "@/lib/profile";
import { getMyOffers, MyOfferItem } from "@/lib/tasks";

type OfferStatusFilter = "all" | "pending" | "accepted" | "rejected";

export function MyOffersView() {
  const router = useRouter();
  const { status, getAccessToken } = useAuth();
  const { locale, t } = useI18n();
  const [statusFilter, setStatusFilter] = useState<OfferStatusFilter>("all");
  const [offers, setOffers] = useState<MyOfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOffers() {
      if (status !== "authenticated") {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const token = await getAccessToken();

        if (!token) {
          router.replace("/login");
          return;
        }

        const data = await getMyOffers(token);
        setOffers(data);
      } catch (loadError) {
        setError(getErrorMessage(loadError, t("myOffers.loadError")));
      } finally {
        setLoading(false);
      }
    }

    void loadOffers();
  }, [getAccessToken, router, status, t]);

  const filteredOffers = useMemo(() => {
    if (statusFilter === "all") {
      return offers;
    }

    return offers.filter((offer) => offer.status.trim().toLowerCase() === statusFilter);
  }, [offers, statusFilter]);

  const stats = useMemo(
    () => ({
      total: offers.length,
      pending: offers.filter((offer) => offer.status.trim().toLowerCase() === "pending").length,
      accepted: offers.filter((offer) => offer.status.trim().toLowerCase() === "accepted").length
    }),
    [offers]
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
            {loading ? (
              <div className="tasko-soft-card p-6 text-sm tasko-muted">{t("common.loadingWorkspace")}</div>
            ) : error ? (
              <div className="rounded-[1.6rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                {error}
              </div>
            ) : filteredOffers.length === 0 ? (
              <div className="tasko-soft-card p-6 text-sm tasko-muted">{t("myOffers.empty")}</div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {filteredOffers.map((offer) => (
                  <article
                    key={offer.offerId}
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

                    <p className="mt-4 text-sm leading-7 tasko-muted">
                      {offer.taskDescription?.trim() || t("task.noDescription")}
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <OfferMetaCard label={t("myOffers.category")} value={offer.categoryName} />
                      <OfferMetaCard label={t("myOffers.location")} value={getLocationLabel(offer.locationType, t)} />
                      <OfferMetaCard
                        label={t("myOffers.sentAt")}
                        value={formatDate(offer.createdAtUtc, locale)}
                      />
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link href={`/tasks/${offer.taskId}`} className="tasko-secondary-btn">
                        {t("myOffers.openTask")}
                      </Link>
                      {offer.status.trim().toLowerCase() === "accepted" ? (
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

function getOfferTone(status: string) {
  const value = status.trim().toLowerCase();
  if (value === "accepted") return "bg-[#eef9f0] text-[#23724d]";
  if (value === "rejected") return "bg-[#fff1f1] text-[#c53a3a]";
  return "bg-[#eef4ff] text-[#2f6bff]";
}

function getOfferStatusLabel(status: string, t: (key: string) => string) {
  const value = status.trim().toLowerCase();
  if (value === "accepted") return t("myOffers.accepted");
  if (value === "rejected") return t("myOffers.rejected");
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

function getLocationLabel(locationType: number, t: (key: string) => string) {
  switch (locationType) {
    case 0:
      return t("location.allCity");
    case 1:
      return t("location.mtatsminda");
    case 2:
      return t("location.vake");
    case 3:
      return t("location.saburtalo");
    case 4:
      return t("location.krtsanisi");
    case 5:
      return t("location.isani");
    case 6:
      return t("location.samgori");
    case 7:
      return t("location.chugureti");
    case 8:
      return t("location.didube");
    case 9:
      return t("location.nadzaladevi");
    case 10:
      return t("location.gldani");
    default:
      return t("profile.unknown");
  }
}
