"use client";

import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GuardedPage } from "@/components/guarded-page";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { buildHubUrl } from "@/lib/api";
import { getErrorMessage } from "@/lib/profile";
import {
  ChatMessage,
  TaskDetails,
  getTaskDetails,
  getTaskMessages,
  getTaskUnreadCount,
  markTaskMessagesRead,
  sendTaskMessage
} from "@/lib/tasks";

type TaskChatViewProps = {
  taskId: number;
};

export function TaskChatViewV2({ taskId }: TaskChatViewProps) {
  const router = useRouter();
  const { status, user, getAccessToken } = useAuth();
  const { locale, t } = useI18n();
  const connectionRef = useRef<HubConnection | null>(null);
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingStopTimerRef = useRef<number | null>(null);
  const typingUsersTimeoutsRef = useRef<Map<string, number>>(new Map());
  const lastMarkedMessageIdRef = useRef(0);
  const markReadInFlightRef = useRef(false);

  const [taskDetails, setTaskDetails] = useState<TaskDetails | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [realtimeState, setRealtimeState] = useState<"connecting" | "live" | "offline">(
    "connecting"
  );

  const markLatestAsRead = useCallback(
    async (lastReadMessageId: number) => {
      if (
        markReadInFlightRef.current ||
        lastReadMessageId <= 0 ||
        lastReadMessageId <= lastMarkedMessageIdRef.current
      ) {
        return;
      }

      const token = await getAccessToken();
      if (!token) {
        return;
      }

      markReadInFlightRef.current = true;

      try {
        await markTaskMessagesRead(token, taskId, lastReadMessageId).catch(() => undefined);
        lastMarkedMessageIdRef.current = Math.max(lastMarkedMessageIdRef.current, lastReadMessageId);
        setUnreadCount(0);
      } finally {
        markReadInFlightRef.current = false;
      }
    },
    [getAccessToken, taskId]
  );

  const loadChat = useCallback(
    async (isRefresh = false) => {
      if (status !== "authenticated") {
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const token = await getAccessToken();

        if (!token) {
          router.replace("/login");
          return;
        }

        const [task, taskMessages, unread] = await Promise.all([
          getTaskDetails(token, taskId),
          getTaskMessages(token, taskId, { take: 100 }),
          getTaskUnreadCount(token, taskId).catch(() => ({ count: 0 }))
        ]);

        const sortedMessages = [...taskMessages].sort((left, right) => left.id - right.id);

        setTaskDetails(task);
        setTaskTitle(task.title);
        setMessages(sortedMessages);
        setUnreadCount(unread.count);

        const lastMessageId = sortedMessages.at(-1)?.id;
        if (lastMessageId) {
          await markLatestAsRead(lastMessageId);
        }
      } catch (loadError) {
        setError(getErrorMessage(loadError, t("chat.loadError")));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getAccessToken, markLatestAsRead, router, status, t, taskId]
  );

  useEffect(() => {
    void loadChat();
  }, [loadChat]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadChat(true);
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [loadChat, status]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    let isCancelled = false;

    async function connectToTaskHub() {
      setRealtimeState("connecting");

      const connection = new HubConnectionBuilder()
        .withUrl(buildHubUrl("/hubs/tasks"), {
          accessTokenFactory: async () => (await getAccessToken()) ?? ""
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Error)
        .build();

      connection.on("MessageReceived", (incoming: ChatMessage) => {
        setMessages((current) => {
          if (current.some((message) => message.id === incoming.id)) {
            return current;
          }

          return [...current, incoming].sort((left, right) => left.id - right.id);
        });

        if (incoming.senderUserId !== user?.id) {
          void markLatestAsRead(incoming.id);
        }
      });

      connection.on("MessagesRead", () => {
        setUnreadCount(0);
      });

      connection.on(
        "UnreadCountUpdated",
        (payload: { taskId: number; userId: number; unreadCount: number }) => {
          if (payload.taskId !== taskId || payload.userId !== user?.id) {
            return;
          }

          setUnreadCount(payload.unreadCount);
        }
      );

      connection.on(
        "UserTyping",
        (payload: { taskId: number; userId: string | number; isTyping: boolean }) => {
          if (payload.taskId !== taskId || String(payload.userId) === String(user?.id)) {
            return;
          }

          const typingKey = String(payload.userId);
          const currentTimeout = typingUsersTimeoutsRef.current.get(typingKey);

          if (currentTimeout) {
            window.clearTimeout(currentTimeout);
          }

          if (!payload.isTyping) {
            typingUsersTimeoutsRef.current.delete(typingKey);
            setTypingUsers((current) => current.filter((value) => value !== typingKey));
            return;
          }

          setTypingUsers((current) =>
            current.includes(typingKey) ? current : [...current, typingKey]
          );

          const timeoutId = window.setTimeout(() => {
            typingUsersTimeoutsRef.current.delete(typingKey);
            setTypingUsers((current) => current.filter((value) => value !== typingKey));
          }, 2400);

          typingUsersTimeoutsRef.current.set(typingKey, timeoutId);
        }
      );

      connection.onreconnecting(() => {
        setRealtimeState("connecting");
      });

      connection.onreconnected(() => {
        setRealtimeState("live");
        void connection.invoke("JoinTask", taskId).catch(() => undefined);
        void loadChat(true);
      });

      connection.onclose(() => {
        setRealtimeState("offline");
      });

      try {
        await connection.start();

        if (isCancelled) {
          await connection.stop();
          return;
        }

        await connection.invoke("JoinTask", taskId);
        connectionRef.current = connection;
        setRealtimeState("live");
      } catch {
        setRealtimeState("offline");
      }
    }

    void connectToTaskHub();

    return () => {
      isCancelled = true;

      if (typingStopTimerRef.current) {
        window.clearTimeout(typingStopTimerRef.current);
        typingStopTimerRef.current = null;
      }

      for (const timeoutId of typingUsersTimeoutsRef.current.values()) {
        window.clearTimeout(timeoutId);
      }

      typingUsersTimeoutsRef.current.clear();
      setTypingUsers([]);

      const connection = connectionRef.current;
      connectionRef.current = null;

      if (connection) {
        void connection
          .invoke("LeaveTask", taskId)
          .catch(() => undefined)
          .finally(() => {
            void connection.stop().catch(() => undefined);
          });
      }
    };
  }, [getAccessToken, loadChat, markLatestAsRead, status, taskId, user?.id]);

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = window.setTimeout(() => setSuccess(""), 2500);
    return () => window.clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    const viewport = messagesViewportRef.current;

    if (!viewport) {
      return;
    }

    const distanceFromBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;

    if (distanceFromBottom < 180) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  const hasChatPartner = useMemo(() => {
    if (!taskDetails || !user) {
      return false;
    }

    if (taskDetails.createdByUserId === user.id) {
      return Boolean(taskDetails.assignedToUserId);
    }

    return true;
  }, [taskDetails, user]);

  const canSend = useMemo(
    () => hasChatPartner && Boolean(draft.trim()) && !sending,
    [draft, hasChatPartner, sending]
  );

  const chatCompanion = useMemo(() => {
    if (!taskDetails || !user) {
      return null;
    }

    if (taskDetails.createdByUserId === user.id) {
      if (!taskDetails.assignedToUserId) {
        return {
          name: t("chat.executorNotAssigned"),
          role: t("chat.roleExecutor"),
          initials: "--"
        };
      }

      return {
        name: formatParticipantName(
          taskDetails.assignedToFirstName,
          taskDetails.assignedToLastName,
          taskDetails.assignedToUserId
        ),
        role: t("chat.roleExecutor"),
        initials: getParticipantInitials(
          taskDetails.assignedToFirstName,
          taskDetails.assignedToLastName,
          taskDetails.assignedToUserId
        )
      };
    }

    return {
      name: formatParticipantName(
        taskDetails.createdByFirstName,
        taskDetails.createdByLastName,
        taskDetails.createdByUserId
      ),
      role: t("chat.roleCustomer"),
      initials: getParticipantInitials(
        taskDetails.createdByFirstName,
        taskDetails.createdByLastName,
        taskDetails.createdByUserId
      )
    };
  }, [taskDetails, t, user]);

  function scheduleTypingStop() {
    if (typingStopTimerRef.current) {
      window.clearTimeout(typingStopTimerRef.current);
    }

    typingStopTimerRef.current = window.setTimeout(() => {
      const connection = connectionRef.current;

      if (connection?.state === HubConnectionState.Connected) {
        void connection.invoke("TypingStop", taskId).catch(() => undefined);
      }
    }, 1400);
  }

  function handleDraftChange(value: string) {
    if (!hasChatPartner) {
      return;
    }

    setDraft(value);

    const connection = connectionRef.current;
    if (connection?.state !== HubConnectionState.Connected) {
      return;
    }

    if (!value.trim()) {
      if (typingStopTimerRef.current) {
        window.clearTimeout(typingStopTimerRef.current);
        typingStopTimerRef.current = null;
      }

      void connection.invoke("TypingStop", taskId).catch(() => undefined);
      return;
    }

    void connection.invoke("TypingStart", taskId).catch(() => undefined);
    scheduleTypingStop();
  }

  async function handleSend() {
    if (!hasChatPartner) {
      return;
    }

    const messageText = draft.trim();
    if (!messageText) {
      return;
    }

    setSending(true);
    setError("");
    setSuccess("");

    try {
      const connection = connectionRef.current;

      if (typingStopTimerRef.current) {
        window.clearTimeout(typingStopTimerRef.current);
        typingStopTimerRef.current = null;
      }

      setDraft("");

      if (connection?.state === HubConnectionState.Connected) {
        await connection.invoke("TypingStop", taskId).catch(() => undefined);
        await connection.invoke("SendMessage", taskId, messageText);
        setSuccess(t("chat.messageSent"));
        return;
      }

      const token = await getAccessToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      const sentMessage = await sendTaskMessage(token, taskId, messageText);
      setMessages((current) => [...current, sentMessage]);
      setSuccess(t("chat.messageSent"));
      await markTaskMessagesRead(token, taskId, sentMessage.id).catch(() => undefined);
      setUnreadCount(0);
    } catch (sendError) {
      setDraft((current) => current || messageText);
      setError(getErrorMessage(sendError, t("chat.sendError")));
    } finally {
      setSending(false);
    }
  }

  return (
    <GuardedPage title={t("chat.title")} description={t("chat.description")}>
      {loading ? (
        <section className="tasko-card p-8">{t("chat.loading")}</section>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.72fr_0.28fr]">
          <section className="tasko-card overflow-hidden p-0">
            <div className="border-b border-[var(--tasko-border)] bg-gradient-to-r from-[#f7faff] via-white to-[#fff8ec] p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                    {t("chat.conversation")}
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--tasko-text)]">
                    {taskTitle || `${t("feed.task")} #${taskId}`}
                  </h2>
                  {chatCompanion ? (
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef4ff] text-sm font-semibold text-[#2f6bff]">
                        {chatCompanion.initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--tasko-text)]">
                          {chatCompanion.name}
                        </p>
                        <p className="text-xs uppercase tracking-[0.18em] text-[#8ba0c3]">
                          {chatCompanion.role}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-3">
                  <div
                    className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${
                      realtimeState === "live"
                        ? "bg-emerald-50 text-emerald-700"
                        : realtimeState === "connecting"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {realtimeState === "live"
                      ? t("chat.realtimeActive")
                      : realtimeState === "connecting"
                        ? t("chat.connecting")
                        : t("chat.offlineFallback")}
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadChat(true)}
                    disabled={refreshing}
                    className="tasko-secondary-btn"
                  >
                    {refreshing ? t("chat.refreshing") : t("chat.refresh")}
                  </button>
                  <Link href={`/tasks/${taskId}`} className="tasko-primary-btn">
                    {t("chat.backToDetails")}
                  </Link>
                </div>
              </div>
            </div>

            {error ? (
              <div className="mx-6 mt-6 rounded-[1.6rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="mx-6 mt-6 rounded-[1.6rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
                {success}
              </div>
            ) : null}

            <div
              ref={messagesViewportRef}
              className="max-h-[58vh] min-h-[360px] space-y-4 overflow-y-auto bg-[linear-gradient(180deg,rgba(244,247,252,0.22)_0%,rgba(255,255,255,0)_100%)] p-6"
            >
              {!hasChatPartner ? (
                <div className="tasko-soft-card rounded-[1.8rem] border border-[#dbe7f6] bg-[linear-gradient(180deg,#f9fbff_0%,#ffffff_100%)] p-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef4ff] text-xl font-semibold text-[#2f6bff]">
                    ...
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[var(--tasko-text)]">
                    {t("chat.waitingTitle")}
                  </h3>
                  <p className="mt-3 text-sm leading-7 tasko-muted">
                    {t("chat.waitingDescription")}
                  </p>
                </div>
              ) : messages.length === 0 ? (
                <div className="tasko-soft-card p-5 text-sm tasko-muted">{t("chat.noMessages")}</div>
              ) : (
                messages.map((message) => {
                  const isMine = user?.id === message.senderUserId;

                  return (
                    <article
                      key={message.id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`flex max-w-[92%] items-end gap-3 sm:max-w-[78%] ${
                          isMine ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                            isMine
                              ? "bg-[#dbe6ff] text-[#2f6bff]"
                              : "bg-white text-[#37507d] shadow-[0_10px_30px_rgba(44,77,145,0.08)]"
                          }`}
                        >
                          {getMessageInitials(message, isMine)}
                        </div>
                        <div
                          className={`rounded-[1.6rem] px-4 py-3 shadow-[0_18px_45px_rgba(44,77,145,0.08)] ${
                            isMine ? "bg-[#2f6bff] text-white" : "bg-[#f4f7fc] text-[var(--tasko-text)]"
                          }`}
                        >
                          <div className="mb-2 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em]">
                            <span>{isMine ? t("chat.you") : getSenderDisplayName(message, t)}</span>
                            <span
                              className={`rounded-full px-2 py-1 tracking-[0.14em] ${
                                isMine ? "bg-white/12 text-white/85" : "bg-white text-[#59729e]"
                              }`}
                            >
                              {isMine ? t("chat.sent") : t("chat.received")}
                            </span>
                            <span className={isMine ? "text-white/75" : "text-[#8ba0c3]"}>
                              {formatDate(message.createdAtUtc, locale, t)}
                            </span>
                          </div>
                          <p className="text-sm leading-7">{message.text}</p>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-[var(--tasko-border)] p-6">
              <label className="block space-y-2">
                <span className="tasko-label">{t("chat.newMessage")}</span>
                <textarea
                  value={draft}
                  onChange={(event) => handleDraftChange(event.target.value)}
                  rows={4}
                  className="tasko-input"
                  placeholder={hasChatPartner ? t("chat.placeholder") : t("chat.lockedPlaceholder")}
                  disabled={!hasChatPartner}
                />
              </label>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm tasko-muted">
                    {hasChatPartner ? t("chat.keepTaskSpecific") : t("chat.lockedHelper")}
                  </p>
                  {typingUsers.length > 0 ? (
                    <p className="text-sm font-medium text-[#2f6bff]">
                      {typingUsers.length === 1
                        ? t("chat.otherTyping")
                        : `${typingUsers.length} ${t("chat.usersTyping")}`}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={!canSend}
                  className="tasko-primary-btn disabled:opacity-70"
                >
                  {sending ? t("task.sending") : t("chat.sendMessage")}
                </button>
              </div>
            </div>
          </section>

          <aside className="grid content-start gap-6">
            <div className="tasko-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                {t("chat.chatStatus")}
              </p>
              <div className="mt-4 grid gap-3">
                <ChatStat label={t("chat.messages")} value={String(messages.length)} />
                <ChatStat label={t("chat.unreadOnLoad")} value={String(unreadCount)} />
                <ChatStat label={t("feed.task")} value={`#${taskId}`} />
                <ChatStat
                  label={t("chat.participant")}
                  value={chatCompanion?.name ?? t("profile.unknown")}
                />
                <ChatStat
                  label={t("chat.connection")}
                  value={
                    realtimeState === "live"
                      ? t("chat.signalrLive")
                      : realtimeState === "connecting"
                        ? t("chat.reconnecting")
                        : t("chat.restFallback")
                  }
                />
              </div>
            </div>

            <div className="tasko-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                {t("chat.nextStep")}
              </p>
              <p className="mt-4 text-sm leading-7 tasko-muted">{t("chat.nextStepText")}</p>
            </div>
          </aside>
        </div>
      )}
    </GuardedPage>
  );
}

function ChatStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f4f7fc] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--tasko-text)]">{value}</p>
    </div>
  );
}

function formatDate(value: string, locale: string, t: (key: string) => string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return t("profile.unknown");
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function getSenderDisplayName(message: ChatMessage, t: (key: string) => string) {
  const fullName = `${message.senderFirstName ?? ""} ${message.senderLastName ?? ""}`.trim();
  if (fullName) {
    return fullName;
  }

  return `${t("task.executor")} #${message.senderUserId}`;
}

function getMessageInitials(message: ChatMessage, isMine: boolean) {
  if (isMine) {
    return "YO";
  }

  const fullName = `${message.senderFirstName ?? ""} ${message.senderLastName ?? ""}`.trim();
  if (!fullName) {
    return `U${String(message.senderUserId).slice(-1)}`;
  }

  return fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
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

function getParticipantInitials(
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
