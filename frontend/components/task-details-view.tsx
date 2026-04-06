"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GuardedPage } from "@/components/guarded-page";
import { useAuth } from "@/components/auth-provider";
import { UserRoleType } from "@/lib/auth";
import { resolveAssetUrl } from "@/lib/api";
import { getErrorMessage } from "@/lib/profile";
import {
  TaskDetails,
  TaskImage,
  TaskOffer,
  TaskStats,
  assignOffer,
  createOffer,
  getTaskDetails,
  getTaskImages,
  getTaskOffers,
  getTaskStats
} from "@/lib/tasks";

type TaskDetailsViewProps = {
  taskId: number;
};

export function TaskDetailsView({ taskId }: TaskDetailsViewProps) {
  const router = useRouter();
  const { status, user, getAccessToken } = useAuth();
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [offers, setOffers] = useState<TaskOffer[]>([]);
  const [images, setImages] = useState<TaskImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [offerComment, setOfferComment] = useState("");
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [assigningOfferId, setAssigningOfferId] = useState<number | null>(null);

  const isExecutorUser =
    user?.roleType === UserRoleType.Executor || user?.roleType === UserRoleType.Both;

  const loadTaskData = useCallback(async () => {
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

      const [taskDetails, taskImages, taskOffers] = await Promise.all([
        getTaskDetails(token, taskId),
        getTaskImages(token, taskId).catch(() => []),
        getTaskOffers(token, taskId).catch(() => [])
      ]);

      setTask(taskDetails);
      setImages(taskImages);
      setOffers(taskOffers);

      if (user && taskDetails.createdByUserId === user.id) {
        const taskStats = await getTaskStats(token, taskId).catch(() => null);
        setStats(taskStats);
      } else {
        setStats(null);
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load this task."));
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, router, status, taskId, user]);

  useEffect(() => {
    void loadTaskData();
  }, [loadTaskData]);

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = window.setTimeout(() => setSuccess(""), 3000);
    return () => window.clearTimeout(timer);
  }, [success]);

  const canSubmitOffer = useMemo(() => {
    if (!task || !user || !isExecutorUser) {
      return false;
    }

    if (task.createdByUserId === user.id) {
      return false;
    }

    return true;
  }, [isExecutorUser, task, user]);

  const isTaskCreator = useMemo(() => {
    if (!task || !user) {
      return false;
    }

    return task.createdByUserId === user.id;
  }, [task, user]);

  const canOpenChat = useMemo(() => {
    if (!task || !user) {
      return false;
    }

    if (task.createdByUserId === user.id || task.assignedToUserId === user.id) {
      return true;
    }

    return offers.some((offer) => offer.executorUserId === user.id);
  }, [offers, task, user]);

  async function handleAssignOffer(offerId: number) {
    if (!task || !isTaskCreator || task.assignedToUserId) {
      return;
    }

    setAssigningOfferId(offerId);
    setError("");
    setSuccess("");

    try {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      await assignOffer(token, task.id, offerId);

      const [taskDetails, taskOffers, taskStats] = await Promise.all([
        getTaskDetails(token, task.id),
        getTaskOffers(token, task.id).catch(() => []),
        getTaskStats(token, task.id).catch(() => null)
      ]);

      setTask(taskDetails);
      setOffers(taskOffers);
      setStats(taskStats);
      setSuccess("Executor assigned.");
    } catch (assignError) {
      setError(getErrorMessage(assignError, "Could not assign this offer."));
    } finally {
      setAssigningOfferId(null);
    }
  }

  async function handleCreateOffer() {
    if (!canSubmitOffer) {
      return;
    }

    const parsedPrice = Number(offerPrice);

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError("Enter a valid offer price.");
      return;
    }

    setSubmittingOffer(true);
    setError("");
    setSuccess("");

    try {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      const created = await createOffer(token, taskId, {
        price: parsedPrice,
        comment: offerComment.trim() || null
      });

      setOffers((current) => [created, ...current]);
      setOfferPrice("");
      setOfferComment("");
      setSuccess("Your offer has been sent.");
    } catch (offerError) {
      setError(getErrorMessage(offerError, "Could not create your offer."));
    } finally {
      setSubmittingOffer(false);
    }
  }

  return (
    <GuardedPage
      title="Task details"
      description="Review the task, see offers and stats, and move deeper into the task flow from a mobile-friendly detail page."
    >
      {loading || !task ? (
        <section className="tasko-card p-8">
          Loading task details...
        </section>
      ) : (
        <div className="grid gap-6">
          {error ? (
            <div className="rounded-[1.6rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-[1.6rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
              {success}
            </div>
          ) : null}

          <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
            <div className="grid gap-6">
              <article className="tasko-card overflow-hidden p-0">
                <div className="grid gap-6 bg-gradient-to-r from-[#f7faff] via-white to-[#fff7ea] p-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="tasko-pill">Task</span>
                      <span className="rounded-full bg-[#eef4ff] px-3 py-2 text-xs font-semibold text-[#315294]">
                        {getStatusLabel(task.status)}
                      </span>
                    </div>
                    <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-tight text-[var(--tasko-text)] sm:text-4xl">
                      {task.title}
                    </h2>
                    <p className="mt-4 max-w-2xl text-sm leading-7 tasko-muted">
                      {task.description?.trim() || "No description was added to this task."}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <MetaPill
                        label="Budget"
                        value={task.budget !== null ? formatBudget(task.budget) : "Not set"}
                      />
                      <MetaPill label="Published" value={formatDate(task.createdAtUtc)} />
                      <MetaPill label="Views" value={String(task.viewsCount)} />
                    </div>
                  </div>

                  <div className="tasko-soft-card flex flex-col justify-between p-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                        Overview
                      </p>
                      <div className="mt-4 grid gap-3">
                        <OverviewLine label="Task ID" value={`#${task.id}`} />
                        <OverviewLine label="Creator" value={`User #${task.createdByUserId}`} />
                        <OverviewLine
                          label="Assigned"
                          value={task.assignedToUserId ? `User #${task.assignedToUserId}` : "Not assigned"}
                        />
                      </div>
                    </div>

                    <div className="mt-6 rounded-[20px] bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                        Quick actions
                      </p>
                      <div className="mt-4 grid gap-3">
                        <Link href="/feed" className="tasko-secondary-btn w-full">
                          Back to feed
                        </Link>
                        {canOpenChat ? (
                          <Link href={`/tasks/${task.id}/chat`} className="tasko-secondary-btn w-full">
                            Open chat
                          </Link>
                        ) : null}
                        {canSubmitOffer ? (
                          <button
                            type="button"
                            onClick={() => {
                              const form = document.getElementById("offer-form");
                              form?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }}
                            className="tasko-primary-btn w-full"
                          >
                            Create offer
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              <article className="tasko-card p-6">
                <div className="flex flex-wrap gap-2">
                  {["Overview", "Offers", "Photos", "Stats"].map((tab, index) => (
                    <span
                      key={tab}
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        index === 0
                          ? "bg-[#2f6bff] text-white"
                          : "border border-[#dfe7f3] bg-white text-[#607392]"
                      }`}
                    >
                      {tab}
                    </span>
                  ))}
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="tasko-soft-card p-5">
                    <p className="text-sm font-semibold text-[var(--tasko-text)]">About this task</p>
                    <p className="mt-3 text-sm leading-8 tasko-muted">
                      {task.description?.trim() || "No description was added to this task."}
                    </p>
                  </div>

                  <div className="tasko-soft-card p-5">
                    <p className="text-sm font-semibold text-[var(--tasko-text)]">Task metrics</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <QuickMetric label="Budget" value={task.budget !== null ? formatBudget(task.budget) : "Not set"} />
                      <QuickMetric label="Views" value={String(task.viewsCount)} />
                      <QuickMetric label="Status" value={getStatusLabel(task.status)} />
                      <QuickMetric label="Published" value={formatDate(task.createdAtUtc)} />
                    </div>
                  </div>
                </div>
              </article>

              {images.length > 0 ? (
                <article className="tasko-card p-6">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                        Photos
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--tasko-text)]">
                        Attached images
                      </h3>
                    </div>
                    <span className="tasko-pill">{images.length} files</span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {images.map((image) => (
                      <a
                        key={image.fileId}
                        href={resolveAssetUrl(image.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="overflow-hidden rounded-[22px] border bg-slate-100"
                        style={{ borderColor: "var(--tasko-border)" }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolveAssetUrl(image.url)}
                          alt={`Task image ${image.fileId}`}
                          className="h-52 w-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </article>
              ) : null}
            </div>

            <div className="grid gap-6 content-start">
              <article className="tasko-card p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                  Offers
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--tasko-text)]">
                  Current responses
                </h3>

                <div className="mt-5 space-y-4">
                  {offers.length === 0 ? (
                    <div className="tasko-soft-card p-4 text-sm tasko-muted">
                      No offers available for this task yet.
                    </div>
                  ) : (
                    offers.map((offer) => (
                      <div key={offer.id} className="tasko-soft-card p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2f6bff] text-sm font-semibold text-white">
                              {getOfferInitials(offer.executorUserId)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[var(--tasko-text)]">
                                {formatBudget(offer.price)}
                              </p>
                              <p className="mt-1 text-xs uppercase tracking-[0.24em] text-[#8ba0c3]">
                                {offer.status}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs tasko-muted">{formatDate(offer.createdAtUtc)}</span>
                        </div>

                        {offer.comment ? (
                          <p className="mt-3 text-sm leading-7 tasko-muted">{offer.comment}</p>
                        ) : null}

                        {isTaskCreator ? (
                          <div className="mt-4 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => void handleAssignOffer(offer.id)}
                              disabled={
                                assigningOfferId !== null ||
                                Boolean(task?.assignedToUserId) ||
                                offer.status.toLowerCase() === "accepted"
                              }
                              className="tasko-primary-btn disabled:opacity-70"
                            >
                              {assigningOfferId === offer.id
                                ? "Assigning..."
                                : task?.assignedToUserId
                                  ? offer.status.toLowerCase() === "accepted"
                                    ? "Assigned"
                                    : "Task already assigned"
                                  : "Assign executor"}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </article>

              {stats ? (
                <article className="tasko-card p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                    Customer stats
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <QuickMetric label="Offers total" value={String(stats.offersCount)} />
                    <QuickMetric label="Active offers" value={String(stats.activeOffersCount)} />
                    <QuickMetric label="Accepted" value={String(stats.acceptedOffersCount)} />
                    <QuickMetric label="Views tracked" value={String(stats.viewsCount)} />
                  </div>
                </article>
              ) : null}

              {canSubmitOffer ? (
                <article id="offer-form" className="tasko-card p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                    Create offer
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--tasko-text)]">
                    Respond to this task
                  </h3>

                  <div className="mt-5 grid gap-4">
                    <label className="space-y-2">
                      <span className="tasko-label">Price</span>
                      <input
                        value={offerPrice}
                        onChange={(event) => setOfferPrice(event.target.value)}
                        inputMode="decimal"
                        className="tasko-input"
                        placeholder="120"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="tasko-label">Comment</span>
                      <textarea
                        value={offerComment}
                        onChange={(event) => setOfferComment(event.target.value)}
                        rows={4}
                        className="tasko-input"
                        placeholder="Share your timing, approach, or experience"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => void handleCreateOffer()}
                      disabled={submittingOffer}
                      className="tasko-primary-btn disabled:opacity-70"
                    >
                      {submittingOffer ? "Sending..." : "Send offer"}
                    </button>
                  </div>
                </article>
              ) : (
                <article className="tasko-card p-6">
                  <p className="text-sm leading-7 tasko-muted">
                    This page is ready for the next task actions. If you are the customer, you can use it
                    to review stats and offers. If you are an executor already tied to the task, you can
                    review the offer list from here.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href="/feed" className="tasko-secondary-btn">
                      Back to feed
                    </Link>
                    {canOpenChat ? (
                      <Link href={`/tasks/${task.id}/chat`} className="tasko-primary-btn">
                        Open chat
                      </Link>
                    ) : null}
                  </div>
                </article>
              )}
            </div>
          </section>
        </div>
      )}
    </GuardedPage>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="tasko-soft-card px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">{label}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

function OverviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
      <span className="text-sm tasko-muted">{label}</span>
      <span className="text-sm font-semibold text-[var(--tasko-text)]">{value}</span>
    </div>
  );
}

function QuickMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--tasko-text)]">{value}</p>
    </div>
  );
}

function formatBudget(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function getStatusLabel(status: number) {
  if (status === 1) return "Draft";
  if (status === 2) return "Published";
  if (status === 3) return "In progress";
  if (status === 4) return "Done";
  return `Status #${status}`;
}

function getOfferInitials(userId: number) {
  return `U${String(userId).slice(-1)}`;
}
