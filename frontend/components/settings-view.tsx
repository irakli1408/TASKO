"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GuardedPage } from "@/components/guarded-page";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import {
  NotificationPreferenceKey,
  NotificationPreferences,
  defaultNotificationPreferences,
  loadNotificationPreferences,
  saveNotificationPreferences
} from "@/lib/settings-preferences";
import { changePasswordRequest, getSettingsErrorMessage } from "@/lib/settings";

export function SettingsView() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notificationSuccess, setNotificationSuccess] = useState("");
  const [activeSection, setActiveSection] = useState<
    "profile" | "security" | "language" | "notifications"
  >("security");
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(
    defaultNotificationPreferences
  );

  useEffect(() => {
    setNotificationPreferences(loadNotificationPreferences());
  }, []);

  useEffect(() => {
    if (!notificationSuccess) {
      return;
    }

    const timer = window.setTimeout(() => setNotificationSuccess(""), 2500);
    return () => window.clearTimeout(timer);
  }, [notificationSuccess]);

  const canSubmit = useMemo(
    () =>
      currentPassword.trim().length > 0 &&
      newPassword.trim().length >= 8 &&
      confirmPassword.trim().length >= 8 &&
      !saving,
    [confirmPassword, currentPassword, newPassword, saving]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError(t("settings.fillAllFields"));
      return;
    }

    if (newPassword.length < 8) {
      setError(t("settings.minLength"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("settings.passwordMismatch"));
      return;
    }

    if (currentPassword === newPassword) {
      setError(t("settings.passwordDifferent"));
      return;
    }

    setSaving(true);

    try {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      await changePasswordRequest(token, {
        currentPassword,
        newPassword
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(t("settings.success"));
    } catch (submitError) {
      setError(getSettingsErrorMessage(submitError, t("settings.error")));
    } finally {
      setSaving(false);
    }
  }

  function handleNotificationToggle(key: NotificationPreferenceKey) {
    setNotificationPreferences((current) => ({
      ...current,
      [key]: !current[key]
    }));
    setNotificationSuccess("");
  }

  function handleSaveNotificationPreferences() {
    saveNotificationPreferences(notificationPreferences);
    setNotificationSuccess(t("settings.notificationsSaved"));
  }

  const enabledNotificationCount = useMemo(
    () => Object.values(notificationPreferences).filter(Boolean).length,
    [notificationPreferences]
  );

  return (
    <GuardedPage title={t("settings.title")} description={t("settings.description")}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_340px]">
        <section className="tasko-card overflow-hidden p-0">
          <div className="border-b border-[var(--tasko-border)] bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-6 py-6 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
              {t("settings.pageLabel")}
            </p>
            <h1 className="mt-3 text-[2rem] font-semibold tracking-tight text-[var(--tasko-text)]">
              {t("settings.pageTitle")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--tasko-muted)]">
              {t("settings.pageDescription")}
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid gap-6">
              <div className="flex flex-wrap gap-3">
                {(
                  [
                    ["profile", t("settings.sectionProfile")],
                    ["security", t("settings.sectionSecurity")],
                    ["language", t("settings.sectionLanguage")],
                    ["notifications", t("settings.sectionNotifications")]
                  ] as const
                ).map(([section, label]) => {
                  const active = activeSection === section;

                  return (
                    <button
                      key={section}
                      type="button"
                      onClick={() => setActiveSection(section)}
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

              {activeSection === "language" ? (
                <div className="grid gap-5">
                  <div className="tasko-soft-card p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                      {t("settings.languageLabel")}
                    </p>
                    <h2 className="mt-3 text-xl font-semibold tracking-tight text-[var(--tasko-text)]">
                      {t("settings.languageTitle")}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-[var(--tasko-muted)]">
                      {t("settings.languageText")}
                    </p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {(
                        [
                          ["en", t("language.en"), "EN"],
                          ["ru", t("language.ru"), "RU"],
                          ["ka", t("language.ka"), "KA"],
                          ["uk", t("language.uk"), "UK"]
                        ] as const
                      ).map(([value, label, badge]) => {
                        const active = locale === value;

                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setLocale(value)}
                            className={`rounded-[1.15rem] border px-4 py-4 text-left transition ${
                              active
                                ? "border-[#bfdbfe] bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_100%)] text-[#1d4ed8] shadow-[0_16px_30px_rgba(59,130,246,0.12)]"
                                : "border-[#dfe7f3] bg-white text-[var(--tasko-text)] hover:border-[#cbd8eb] hover:bg-[#f8fbff] hover:shadow-[0_12px_24px_rgba(42,78,148,0.06)]"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <span
                                  className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                                    active
                                      ? "bg-[#dbeafe] text-[#1d4ed8]"
                                      : "bg-[#f3f6fb] text-[#6b7fa3]"
                                  }`}
                                >
                                  {badge}
                                </span>
                                <p className="mt-3 text-sm font-semibold">{label}</p>
                                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8ba0c3]">
                                  {active
                                    ? t("settings.languageCurrent")
                                    : t("settings.languageAvailable")}
                                </p>
                              </div>

                              <span
                                className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-sm ${
                                  active
                                    ? "border-[#93c5fd] bg-white text-[#2563eb]"
                                    : "border-[#e2e8f0] bg-white text-transparent"
                                }`}
                              >
                                {active ? "✓" : "."}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}

              {activeSection === "profile" ? (
                <div className="tasko-soft-card p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                    {t("settings.comingSoonLabel")}
                  </p>
                  <h2 className="mt-3 text-xl font-semibold tracking-tight text-[var(--tasko-text)]">
                    {activeSection === "profile"
                      ? t("settings.sectionProfile")
                      : t("settings.sectionNotifications")}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--tasko-muted)]">
                    {t("settings.comingSoonText")}
                  </p>
                </div>
              ) : null}

              {activeSection === "notifications" ? (
                <div className="grid gap-5">
                  {notificationSuccess ? (
                    <div className="rounded-[1rem] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#166534]">
                      {notificationSuccess}
                    </div>
                  ) : null}

                  <div className="tasko-soft-card p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                      {t("settings.notificationsLabel")}
                    </p>
                    <h2 className="mt-3 text-xl font-semibold tracking-tight text-[var(--tasko-text)]">
                      {t("settings.notificationsTitle")}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-[var(--tasko-muted)]">
                      {t("settings.notificationsText")}
                    </p>

                    <div className="mt-6 grid gap-3">
                      <NotificationPreferenceCard
                        title={t("settings.notificationsOffer")}
                        text={t("settings.notificationsOfferText")}
                        checked={notificationPreferences.offerReceived}
                        onToggle={() => handleNotificationToggle("offerReceived")}
                      />
                      <NotificationPreferenceCard
                        title={t("settings.notificationsAssignment")}
                        text={t("settings.notificationsAssignmentText")}
                        checked={notificationPreferences.taskAssigned}
                        onToggle={() => handleNotificationToggle("taskAssigned")}
                      />
                      <NotificationPreferenceCard
                        title={t("settings.notificationsMessages")}
                        text={t("settings.notificationsMessagesText")}
                        checked={notificationPreferences.messageReceived}
                        onToggle={() => handleNotificationToggle("messageReceived")}
                      />
                      <NotificationPreferenceCard
                        title={t("settings.notificationsCompletion")}
                        text={t("settings.notificationsCompletionText")}
                        checked={notificationPreferences.taskCompleted}
                        onToggle={() => handleNotificationToggle("taskCompleted")}
                      />
                      <NotificationPreferenceCard
                        title={t("settings.notificationsMarketplace")}
                        text={t("settings.notificationsMarketplaceText")}
                        checked={notificationPreferences.marketplaceUpdates}
                        onToggle={() => handleNotificationToggle("marketplaceUpdates")}
                      />
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSaveNotificationPreferences}
                        className="tasko-primary-btn min-w-[220px]"
                      >
                        {t("settings.notificationsSave")}
                      </button>
                      <p className="text-sm text-[var(--tasko-muted)]">
                        {t("settings.notificationsEnabled").replace(
                          "{count}",
                          String(enabledNotificationCount)
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {activeSection === "security" ? (
                <>
              {error ? (
                <div className="rounded-[1rem] border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#b91c1c]">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-[1rem] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#166534]">
                  {success}
                </div>
              ) : null}

              <form className="grid gap-5" onSubmit={handleSubmit}>
                <PasswordField
                  label={t("settings.currentPassword")}
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  visible={showCurrentPassword}
                  onToggleVisibility={() => setShowCurrentPassword((value) => !value)}
                  placeholder={t("settings.currentPasswordPlaceholder")}
                />

                <PasswordField
                  label={t("settings.newPassword")}
                  value={newPassword}
                  onChange={setNewPassword}
                  visible={showNewPassword}
                  onToggleVisibility={() => setShowNewPassword((value) => !value)}
                  placeholder={t("settings.newPasswordPlaceholder")}
                />

                <PasswordField
                  label={t("settings.confirmPassword")}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  visible={showConfirmPassword}
                  onToggleVisibility={() => setShowConfirmPassword((value) => !value)}
                  placeholder={t("settings.confirmPasswordPlaceholder")}
                />

                <div className="flex flex-wrap gap-3 pt-2">
                  <button type="submit" className="tasko-primary-btn min-w-[220px]" disabled={!canSubmit}>
                    {saving ? t("settings.saving") : t("settings.submit")}
                  </button>
                </div>
              </form>
                </>
              ) : null}
            </div>
          </div>
        </section>

        <aside className="grid gap-6 self-start">
          {activeSection === "security" ? (
            <>
              <section className="tasko-card p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                  {t("settings.requirementsLabel")}
                </p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-[var(--tasko-text)]">
                  {t("settings.requirementsTitle")}
                </h2>
                <div className="mt-5 grid gap-3">
                  <RuleCard index="01" text={t("settings.ruleMinLength")} />
                  <RuleCard index="02" text={t("settings.ruleDifferent")} />
                  <RuleCard index="03" text={t("settings.rulePrivate")} />
                </div>
              </section>

              <section className="tasko-card p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                  {t("settings.securityHintLabel")}
                </p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-[var(--tasko-text)]">
                  {t("settings.securityHintTitle")}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--tasko-muted)]">
                  {t("settings.securityHintText")}
                </p>
              </section>
            </>
          ) : null}

          {activeSection === "notifications" ? (
            <>
              <section className="tasko-card p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                  {t("settings.notificationsSummaryLabel")}
                </p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-[var(--tasko-text)]">
                  {t("settings.notificationsSummaryTitle")}
                </h2>
                <div className="mt-5 grid gap-3">
                  <RuleCard
                    index="01"
                    text={t("settings.notificationsEnabled").replace(
                      "{count}",
                      String(enabledNotificationCount)
                    )}
                  />
                  <RuleCard index="02" text={t("settings.notificationsSummaryRule1")} />
                  <RuleCard index="03" text={t("settings.notificationsSummaryRule2")} />
                </div>
              </section>

              <section className="tasko-card p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                  {t("settings.notificationsHintLabel")}
                </p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-[var(--tasko-text)]">
                  {t("settings.notificationsHintTitle")}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--tasko-muted)]">
                  {t("settings.notificationsHintText")}
                </p>
              </section>
            </>
          ) : null}
        </aside>
      </div>
    </GuardedPage>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggleVisibility,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisibility: () => void;
  placeholder: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="tasko-label">{label}</span>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="tasko-input pr-14"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#8aa0c5] transition hover:bg-[#f3f7fd] hover:text-[#3b82f6]"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.9]">
            <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
    </label>
  );
}

function RuleCard({ index, text }: { index: string; text: string }) {
  return (
    <div className="rounded-[1.15rem] border border-[#dfe7f3] bg-[#f8fbff] px-4 py-3">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#3b82f6] px-2 text-[11px] font-semibold text-white">
          {index}
        </span>
        <p className="text-sm leading-6 text-[var(--tasko-text)]">{text}</p>
      </div>
    </div>
  );
}

function NotificationPreferenceCard({
  title,
  text,
  checked,
  onToggle
}: {
  title: string;
  text: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-[1.25rem] border border-[#dfe7f3] bg-white px-4 py-4 shadow-[0_14px_28px_rgba(42,78,148,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-base font-semibold text-[var(--tasko-text)]">{title}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--tasko-muted)]">{text}</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`relative inline-flex h-8 w-14 shrink-0 rounded-full transition ${
            checked ? "bg-[#22c55e]" : "bg-[#dfe7f3]"
          }`}
          aria-pressed={checked}
        >
          <span
            className={`absolute top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-[0_6px_18px_rgba(17,24,39,0.12)] transition ${
              checked ? "left-7" : "left-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
