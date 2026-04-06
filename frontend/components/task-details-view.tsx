"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GuardedPage } from "@/components/guarded-page";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { LocationType, UserRoleType } from "@/lib/auth";
import { resolveAssetUrl } from "@/lib/api";
import { getErrorMessage } from "@/lib/profile";
import {
  TaskDetails,
  TaskImage,
  TaskOffer,
  TaskStats,
  assignOffer,
  cancelTask,
  completeTask,
  createOffer,
  getTaskDetails,
  getTaskImages,
  getTaskOffers,
  getTaskStats,
  startTaskProgress
} from "@/lib/tasks";

type TaskDetailsViewProps = {
  taskId: number;
};

export function TaskDetailsView({ taskId }: TaskDetailsViewProps) {
  const router = useRouter();
  const { status, user, getAccessToken } = useAuth();
  const { locale, t } = useI18n();
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
  const [statusAction, setStatusAction] = useState<"start" | "complete" | "cancel" | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "offers" | "photos" | "stats">("overview");

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
      setError(getErrorMessage(loadError, t("task.loadError")));
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, router, status, taskId, user, t]);

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

    if (task.status !== TASK_STATUS.PUBLISHED) {
      return false;
    }

    if (task.assignedToUserId) {
      return false;
    }

    return !offers.some((offer) => offer.executorUserId === user.id);
  }, [isExecutorUser, offers, task, user]);

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

  const isAssignedExecutor = useMemo(() => {
    if (!task || !user) {
      return false;
    }

    return task.assignedToUserId === user.id;
  }, [task, user]);

  const canStartTask = isAssignedExecutor && task?.status === TASK_STATUS.ASSIGNED;
  const canCompleteTask = isTaskCreator && task?.status === TASK_STATUS.IN_PROGRESS;
  const canCancelTask = Boolean(
    isTaskCreator &&
      task &&
      ([TASK_STATUS.PUBLISHED, TASK_STATUS.ASSIGNED, TASK_STATUS.IN_PROGRESS] as number[]).includes(
        task.status
      )
  );
  const taskStatus = task?.status ?? TASK_STATUS.DRAFT;
  const flowSteps = useMemo(() => getTaskFlowSteps(taskStatus, t), [taskStatus, t]);
  const flowSummary = useMemo(() => getTaskFlowSummary(taskStatus, t), [taskStatus, t]);
  const tabItems = useMemo(
    () => [
      { id: "overview" as const, label: t("task.tabOverview") },
      { id: "offers" as const, label: t("task.tabOffers") },
      { id: "photos" as const, label: t("task.tabPhotos") },
      { id: "stats" as const, label: t("task.tabStats") }
    ],
    [t]
  );

  async function refreshTaskState(token: string, taskIdToLoad: number) {
    const [taskDetails, taskOffers, taskImages] = await Promise.all([
      getTaskDetails(token, taskIdToLoad),
      getTaskOffers(token, taskIdToLoad).catch(() => []),
      getTaskImages(token, taskIdToLoad).catch(() => [])
    ]);

    setTask(taskDetails);
    setOffers(taskOffers);
    setImages(taskImages);

    if (user && taskDetails.createdByUserId === user.id) {
      const taskStats = await getTaskStats(token, taskIdToLoad).catch(() => null);
      setStats(taskStats);
    } else {
      setStats(null);
    }
  }

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
      await refreshTaskState(token, task.id);
      setSuccess(t("task.executorAssignedSuccess"));
    } catch (assignError) {
      setError(getErrorMessage(assignError, t("task.assignError")));
    } finally {
      setAssigningOfferId(null);
    }
  }

  async function handleStartTask() {
    if (!task || !canStartTask) {
      return;
    }

    setStatusAction("start");
    setError("");
    setSuccess("");

    try {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      await startTaskProgress(token, task.id);
      await refreshTaskState(token, task.id);
      setSuccess(t("task.startedSuccess"));
    } catch (startError) {
      setError(getErrorMessage(startError, t("task.startError")));
    } finally {
      setStatusAction(null);
    }
  }

  async function handleCompleteTask() {
    if (!task || !canCompleteTask) {
      return;
    }

    setStatusAction("complete");
    setError("");
    setSuccess("");

    try {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      await completeTask(token, task.id);
      await refreshTaskState(token, task.id);
      setSuccess(t("task.completedSuccess"));
    } catch (completeError) {
      setError(getErrorMessage(completeError, t("task.completeError")));
    } finally {
      setStatusAction(null);
    }
  }

  async function handleCancelTask() {
    if (!task || !canCancelTask) {
      return;
    }

    setStatusAction("cancel");
    setError("");
    setSuccess("");

    try {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      await cancelTask(token, task.id);
      await refreshTaskState(token, task.id);
      setSuccess(t("task.cancelledSuccess"));
    } catch (cancelError) {
      setError(getErrorMessage(cancelError, t("task.cancelError")));
    } finally {
      setStatusAction(null);
    }
  }

  async function handleCreateOffer() {
    if (!canSubmitOffer) {
      return;
    }

    const parsedPrice = Number(offerPrice);

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError(t("task.invalidOfferPrice"));
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
      setSuccess(t("task.offerSentSuccess"));
    } catch (offerError) {
      setError(getErrorMessage(offerError, t("task.offerError")));
    } finally {
      setSubmittingOffer(false);
    }
  }

  return (
    <GuardedPage
      title={t("task.title")}
      description={t("task.description")}
    >
      {loading || !task ? (
        <section className="tasko-card p-8">
          {t("task.loading")}
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
              <article className="tasko-card p-4 sm:p-5 lg:p-6">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_340px]">
                  <div className="rounded-[2rem] bg-gradient-to-br from-[#2569f6] via-[#2f74ff] to-[#1f56cf] p-5 text-white shadow-[0_24px_54px_rgba(37,105,246,0.24)] sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="rounded-full bg-white/14 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
                        {`Task #${task.id}`}
                      </div>
                      <span className="rounded-full bg-white/16 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                        {getStatusLabel(task.status, t)}
                      </span>
                    </div>

                    <h2 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-[2.35rem]">
                      {task.title}
                    </h2>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <HeroMetaItem
                        label={t("feed.budget")}
                        value={task.budget !== null ? formatBudget(task.budget, locale) : t("task.notSet")}
                      />
                      <HeroMetaItem label={t("task.status")} value={getStatusLabel(task.status, t)} />
                      <HeroMetaItem
                        label={t("task.creator")}
                        value={formatParticipantName(
                          task.createdByFirstName,
                          task.createdByLastName,
                          task.createdByUserId
                        )}
                      />
                      <HeroMetaItem
                        label={t("task.assigned")}
                        value={
                          task.assignedToUserId
                            ? formatParticipantName(
                                task.assignedToFirstName,
                                task.assignedToLastName,
                                task.assignedToUserId
                              )
                            : t("task.notAssigned")
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                    {images.length > 0
                      ? images.slice(0, 4).map((image) => (
                          <a
                            key={image.fileId}
                            href={resolveAssetUrl(image.url)}
                            target="_blank"
                            rel="noreferrer"
                            className="overflow-hidden rounded-[1.6rem] border border-[#dfe7f3] bg-[#eef3fb]"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={resolveAssetUrl(image.url)}
                              alt={`Task image ${image.fileId}`}
                              className="h-32 w-full object-cover sm:h-36"
                            />
                          </a>
                        ))
                      : Array.from({ length: 4 }).map((_, index) => (
                          <div
                            key={index}
                            className="flex h-32 items-center justify-center rounded-[1.6rem] border border-dashed border-[#d7e2f3] bg-[#f7faff] text-center text-sm text-[#90a1bc] sm:h-36"
                          >
                            {t("task.photos")}
                          </div>
                        ))}
                  </div>
                </div>
              </article>

              <article className="tasko-card p-6">
                <div className="flex flex-wrap gap-2">
                  {tabItems.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        activeTab === tab.id
                          ? "bg-[#111827] text-white shadow-[0_12px_24px_rgba(17,24,39,0.14)]"
                          : "border border-[#dfe7f3] bg-white text-[#607392] hover:border-[#cbd8eb]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                  {activeTab === "overview" ? (
                    <>
                      <div className="tasko-soft-card p-5">
                        <p className="text-sm font-semibold text-[var(--tasko-text)]">{t("task.aboutTask")}</p>
                        <p className="mt-3 text-sm leading-8 tasko-muted">
                          {task.description?.trim() || t("task.noDescription")}
                        </p>
                      </div>

                      <div className="tasko-soft-card p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[var(--tasko-text)]">{t("task.flowTitle")}</p>
                            <p className="mt-2 text-sm leading-7 tasko-muted">{flowSummary}</p>
                          </div>
                          <span className={`rounded-full px-3 py-2 text-xs font-semibold ${getFlowTone(task.status)}`}>
                            {getStatusLabel(task.status, t)}
                          </span>
                        </div>

                        <div className="mt-5 grid gap-3">
                          {flowSteps.map((step, index) => (
                            <TaskFlowStep
                              key={step.label}
                              index={index + 1}
                              label={step.label}
                              description={step.description}
                              state={step.state}
                            />
                          ))}
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                          {canStartTask ? (
                            <button
                              type="button"
                              onClick={() => void handleStartTask()}
                              disabled={statusAction !== null}
                              className="tasko-primary-btn disabled:opacity-70"
                            >
                              {statusAction === "start" ? t("task.flowStart") : t("task.flowStartAction")}
                            </button>
                          ) : null}
                          {canCompleteTask ? (
                            <button
                              type="button"
                              onClick={() => void handleCompleteTask()}
                              disabled={statusAction !== null}
                              className="tasko-primary-btn disabled:opacity-70"
                            >
                              {statusAction === "complete" ? t("task.flowComplete") : t("task.flowCompleteAction")}
                            </button>
                          ) : null}
                          {canCancelTask ? (
                            <button
                              type="button"
                              onClick={() => void handleCancelTask()}
                              disabled={statusAction !== null}
                              className="tasko-secondary-btn border-red-200 text-red-700 disabled:opacity-70"
                            >
                              {statusAction === "cancel" ? t("task.flowCancel") : t("task.flowCancelAction")}
                            </button>
                          ) : null}
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          <QuickMetric
                            label={t("feed.budget")}
                            value={task.budget !== null ? formatBudget(task.budget, locale) : t("task.notSet")}
                          />
                          <QuickMetric label={t("task.views")} value={String(task.viewsCount)} />
                          <QuickMetric label={t("task.status")} value={getStatusLabel(task.status, t)} />
                          <QuickMetric label={t("feed.published")} value={formatDate(task.createdAtUtc, locale, t)} />
                        </div>
                      </div>
                    </>
                  ) : null}

                  {activeTab === "photos" ? (
                    <div className="lg:col-span-2">
                      {images.length > 0 ? (
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
                      ) : (
                        <div className="tasko-soft-card p-5 text-sm tasko-muted">{t("task.photos")} {t("task.notSet").toLowerCase()}</div>
                      )}
                    </div>
                  ) : null}

                  {activeTab === "stats" ? (
                    <div className="tasko-soft-card p-5 lg:col-span-2">
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <QuickMetric label={t("task.offersTotal")} value={String(stats?.offersCount ?? offers.length)} />
                        <QuickMetric label={t("task.activeOffers")} value={String(stats?.activeOffersCount ?? 0)} />
                        <QuickMetric label={t("task.accepted")} value={String(stats?.acceptedOffersCount ?? 0)} />
                        <QuickMetric label={t("task.viewsTracked")} value={String(stats?.viewsCount ?? task.viewsCount)} />
                      </div>
                    </div>
                  ) : null}
                </div>
              </article>

              {images.length > 0 ? (
                <article className="tasko-card p-6">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                        {t("task.photos")}
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--tasko-text)]">
                        {t("task.attachedImages")}
                      </h3>
                    </div>
                    <span className="tasko-pill">{images.length} {t("task.files")}</span>
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
              <article className={`tasko-card p-6 ${activeTab !== "offers" ? "lg:sticky lg:top-6" : ""}`}>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                  {t("task.offers")}
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--tasko-text)]">
                  {t("task.currentResponses")}
                </h3>

                <div className="mt-5 space-y-4">
                  {offers.length === 0 ? (
                    <div className="tasko-soft-card p-4 text-sm tasko-muted">
                      {t("task.noOffers")}
                    </div>
                  ) : (
                    offers.map((offer) => (
                      <OfferCard
                        key={offer.id}
                        offer={offer}
                        isTaskCreator={isTaskCreator}
                        isAssigned={Boolean(task.assignedToUserId)}
                        assigningOfferId={assigningOfferId}
                        locale={locale}
                        onAssign={handleAssignOffer}
                        t={t}
                      />
                    ))
                  )}
                </div>
              </article>

              {stats ? (
                <article className="tasko-card p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                    {t("task.customerStats")}
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <QuickMetric label={t("task.offersTotal")} value={String(stats.offersCount)} />
                    <QuickMetric label={t("task.activeOffers")} value={String(stats.activeOffersCount)} />
                    <QuickMetric label={t("task.accepted")} value={String(stats.acceptedOffersCount)} />
                    <QuickMetric label={t("task.viewsTracked")} value={String(stats.viewsCount)} />
                  </div>
                </article>
              ) : null}

              {canSubmitOffer ? (
                <article id="offer-form" className="tasko-card p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                    {t("task.createOffer")}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--tasko-text)]">
                    {t("task.respond")}
                  </h3>

                  <div className="mt-5 grid gap-4">
                    <label className="space-y-2">
                      <span className="tasko-label">{t("task.price")}</span>
                      <input
                        value={offerPrice}
                        onChange={(event) => setOfferPrice(event.target.value)}
                        inputMode="decimal"
                        className="tasko-input"
                        placeholder="120"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="tasko-label">{t("task.comment")}</span>
                      <textarea
                        value={offerComment}
                        onChange={(event) => setOfferComment(event.target.value)}
                        rows={4}
                        className="tasko-input"
                        placeholder={t("task.commentPlaceholder")}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => void handleCreateOffer()}
                      disabled={submittingOffer}
                      className="tasko-primary-btn disabled:opacity-70"
                    >
                      {submittingOffer ? t("task.sending") : t("task.sendOffer")}
                    </button>
                  </div>
                </article>
              ) : (
                <article className="tasko-card p-6">
                  <p className="text-sm leading-7 tasko-muted">
                    {t("task.nextActionsText")}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href="/feed" className="tasko-secondary-btn">
                      {t("task.backToFeed")}
                    </Link>
                    {canOpenChat ? (
                      <Link href={`/tasks/${task.id}/chat`} className="tasko-primary-btn">
                        {t("task.openChat")}
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

function HeroMetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/16 bg-white/10 px-4 py-3 backdrop-blur-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
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

function TaskFlowStep({
  index,
  label,
  description,
  state
}: {
  index: number;
  label: string;
  description: string;
  state: "done" | "current" | "upcoming";
}) {
  const tone =
    state === "done"
      ? "border-[#d8eadb] bg-[#eef9f0] text-[#23724d]"
      : state === "current"
        ? "border-[#d9e5ff] bg-[#eef4ff] text-[#2f6bff]"
        : "border-[var(--tasko-border)] bg-white text-[#7c8da9]";

  return (
    <div className={`rounded-[1.4rem] border p-4 ${tone}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold uppercase tracking-[0.14em]">
          {index}
        </div>
        <div>
          <p className="text-sm font-semibold">{label}</p>
          <p className="mt-1 text-sm leading-6 opacity-85">{description}</p>
        </div>
      </div>
    </div>
  );
}

function OfferAvatar({
  firstName,
  lastName,
  userId,
  avatarUrl
}: {
  firstName: string | null | undefined;
  lastName: string | null | undefined;
  userId: number;
  avatarUrl: string | null | undefined;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolveAssetUrl(avatarUrl)}
        alt={formatParticipantName(firstName, lastName, userId)}
        className="h-11 w-11 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2f6bff] text-sm font-semibold text-white">
      {getOfferInitials(firstName, lastName, userId)}
    </div>
  );
}

function OfferMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8ba0c3]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-[var(--tasko-text)]">{value}</p>
    </div>
  );
}

function OfferCard({
  offer,
  isTaskCreator,
  isAssigned,
  assigningOfferId,
  locale,
  onAssign,
  t
}: {
  offer: TaskOffer;
  isTaskCreator: boolean;
  isAssigned: boolean;
  assigningOfferId: number | null;
  locale: string;
  onAssign: (offerId: number) => Promise<void>;
  t: (key: string) => string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-[#dfe7f3] bg-white p-4 shadow-[0_14px_30px_rgba(52,85,145,0.08)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <OfferAvatar
            firstName={offer.executorFirstName}
            lastName={offer.executorLastName}
            userId={offer.executorUserId}
            avatarUrl={offer.executorAvatarUrl}
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-[var(--tasko-text)]">
                {formatParticipantName(
                  offer.executorFirstName,
                  offer.executorLastName,
                  offer.executorUserId
                )}
              </p>
              <span className="rounded-full bg-[#eef8f2] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1f8b64]">
                {t("task.executor")}
              </span>
            </div>
            <p className="mt-1 text-xs tasko-muted">{formatDate(offer.createdAtUtc, locale, t)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
          <p className="text-lg font-semibold text-[var(--tasko-text)]">
            {formatBudget(offer.price, locale)}
          </p>
          <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${getOfferStatusTone(offer.status)}`}>
            {getOfferStatusLabel(offer.status, t)}
          </span>
        </div>
      </div>

      {offer.comment ? (
        <p className="mt-4 text-sm leading-7 tasko-muted">{offer.comment}</p>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <OfferMeta
          label={t("task.experience")}
          value={formatExperience(offer.executorExperienceYears, t)}
        />
        <OfferMeta
          label={t("task.area")}
          value={getLocationLabel(offer.executorLocationType, t)}
        />
        <OfferMeta
          label={t("task.rating")}
          value={formatRating(offer.executorRatingAverage, offer.executorRatingCount, t)}
        />
      </div>

      {isTaskCreator ? (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => void onAssign(offer.id)}
            disabled={
              assigningOfferId !== null || isAssigned || offer.status.toLowerCase() === "accepted"
            }
            className="rounded-full bg-[#dff5e5] px-5 py-2.5 text-sm font-semibold text-[#23915d] transition hover:bg-[#d2f0dc] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {assigningOfferId === offer.id
              ? t("task.assigning")
              : isAssigned
                ? offer.status.toLowerCase() === "accepted"
                  ? t("task.assignedDone")
                  : t("task.alreadyAssigned")
                : t("task.assignExecutor")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function formatBudget(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value: string, locale: string, t: (key: string) => string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return t("profile.unknown");
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function getStatusLabel(status: number, t: (key: string) => string) {
  if (status === TASK_STATUS.DRAFT) return t("task.statusDraft");
  if (status === TASK_STATUS.PUBLISHED) return t("task.statusPublished");
  if (status === TASK_STATUS.ASSIGNED) return t("task.statusAssigned");
  if (status === TASK_STATUS.IN_PROGRESS) return t("task.statusInProgress");
  if (status === TASK_STATUS.COMPLETED) return t("task.statusCompleted");
  if (status === TASK_STATUS.CANCELLED) return t("task.statusCancelled");
  return `Status #${status}`;
}

function getOfferInitials(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  userId: number
) {
  const first = firstName?.trim()?.[0] ?? "";
  const last = lastName?.trim()?.[0] ?? "";
  const initials = `${first}${last}`.toUpperCase();

  if (initials) {
    return initials;
  }

  return `U${String(userId).slice(-1)}`;
}

function getOfferStatusTone(status: string) {
  const value = status.trim().toLowerCase();

  if (value === "accepted") {
    return "bg-[#eef9f0] text-[#23724d]";
  }

  if (value === "rejected" || value === "cancelled") {
    return "bg-[#fff1f1] text-[#c53a3a]";
  }

  return "bg-[#eef4ff] text-[#2f6bff]";
}

function getOfferStatusLabel(status: string, t: (key: string) => string) {
  const value = status.trim().toLowerCase();

  if (value === "accepted") return t("task.offerAccepted");
  if (value === "rejected") return t("task.offerRejected");
  if (value === "cancelled" || value === "canceled") return t("task.offerCancelled");
  return t("task.offerPending");
}

function formatParticipantName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  userId: number
) {
  const fullName = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ");

  if (fullName) {
    return fullName;
  }

  return `User #${userId}`;
}

function getTaskFlowSteps(status: number, t: (key: string) => string) {
  const currentIndex =
    status === TASK_STATUS.DRAFT
      ? 0
      : status === TASK_STATUS.PUBLISHED
        ? 1
        : status === TASK_STATUS.ASSIGNED
          ? 2
          : status === TASK_STATUS.IN_PROGRESS
            ? 3
            : status === TASK_STATUS.COMPLETED
              ? 4
              : 1;

  const steps = [
    {
      label: t("task.flowDraftTitle"),
      description: t("task.flowDraftText")
    },
    {
      label: t("task.flowPublishedTitle"),
      description: t("task.flowPublishedText")
    },
    {
      label: t("task.flowAssignedTitle"),
      description: t("task.flowAssignedText")
    },
    {
      label: t("task.flowInProgressTitle"),
      description: t("task.flowInProgressText")
    },
    {
      label: t("task.flowCompletedTitle"),
      description: t("task.flowCompletedText")
    }
  ];

  if (status === TASK_STATUS.CANCELLED) {
    return steps.map((step, index) => ({
      ...step,
      state: index < currentIndex ? "done" : "upcoming"
    })) as Array<(typeof steps)[number] & { state: "done" | "current" | "upcoming" }>;
  }

  return steps.map((step, index) => ({
    ...step,
    state: index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming"
  })) as Array<(typeof steps)[number] & { state: "done" | "current" | "upcoming" }>;
}

function getTaskFlowSummary(status: number, t: (key: string) => string) {
  if (status === TASK_STATUS.DRAFT) {
    return t("task.summaryDraft");
  }

  if (status === TASK_STATUS.PUBLISHED) {
    return t("task.summaryPublished");
  }

  if (status === TASK_STATUS.ASSIGNED) {
    return t("task.summaryAssigned");
  }

  if (status === TASK_STATUS.IN_PROGRESS) {
    return t("task.summaryInProgress");
  }

  if (status === TASK_STATUS.COMPLETED) {
    return t("task.summaryCompleted");
  }

  if (status === TASK_STATUS.CANCELLED) {
    return t("task.summaryCancelled");
  }

  return t("task.summaryDefault");
}

function getFlowTone(status: number) {
  if (status === TASK_STATUS.COMPLETED) {
    return "bg-[#eef9f0] text-[#23724d]";
  }

  if (status === TASK_STATUS.CANCELLED) {
    return "bg-[#fff1f1] text-[#c53a3a]";
  }

  return "bg-[#eef4ff] text-[#315294]";
}

function getLocationLabel(locationType: LocationType, t: (key: string) => string) {
  if (locationType === LocationType.AllCity) return t("location.allCity");
  if (locationType === LocationType.Mtatsminda) return t("location.mtatsminda");
  if (locationType === LocationType.Vake) return t("location.vake");
  if (locationType === LocationType.Saburtalo) return t("location.saburtalo");
  if (locationType === LocationType.Krtsanisi) return t("location.krtsanisi");
  if (locationType === LocationType.Isani) return t("location.isani");
  if (locationType === LocationType.Samgori) return t("location.samgori");
  if (locationType === LocationType.Chugureti) return t("location.chugureti");
  if (locationType === LocationType.Didube) return t("location.didube");
  if (locationType === LocationType.Nadzaladevi) return t("location.nadzaladevi");
  if (locationType === LocationType.Gldani) return t("location.gldani");
  return `Location #${locationType}`;
}

function formatExperience(years: number | null, t: (key: string) => string) {
  if (years === null || years === undefined) {
    return t("task.notSet");
  }

  return years === 1 ? t("task.oneYear") : `${years} ${t("task.years")}`;
}

function formatRating(ratingAverage: number, ratingCount: number, t: (key: string) => string) {
  if (ratingCount <= 0) {
    return t("task.newExecutor");
  }

  return `${ratingAverage.toFixed(1)} / 5 (${ratingCount})`;
}

const TASK_STATUS = {
  DRAFT: 0,
  PUBLISHED: 1,
  ASSIGNED: 2,
  IN_PROGRESS: 3,
  COMPLETED: 4,
  CANCELLED: 5
} as const;
