"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { LogoLink } from "@/components/logo-link";
import { useI18n } from "@/components/i18n-provider";
import { ApiError } from "@/lib/api";
import { forgotPasswordRequest, resetPasswordRequest } from "@/lib/auth";

type AuthRecoveryCardProps = {
  mode: "forgot" | "reset";
};

function getRecoveryError(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

export function AuthRecoveryCard({ mode }: AuthRecoveryCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const isForgot = mode === "forgot";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (isForgot) {
        if (!email.trim()) {
          setError(t("authRecovery.emailRequired"));
          return;
        }

        const result = await forgotPasswordRequest({ email: email.trim() });
        setSuccess(result.message || t("authRecovery.forgotSuccess"));
        setEmail("");
        return;
      }

      if (!token) {
        setError(t("authRecovery.invalidToken"));
        return;
      }

      if (!newPassword.trim() || !confirmPassword.trim()) {
        setError(t("authRecovery.fillAllFields"));
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

      const result = await resetPasswordRequest({
        token,
        newPassword
      });

      setSuccess(result.message || t("authRecovery.resetSuccess"));
      setNewPassword("");
      setConfirmPassword("");

      window.setTimeout(() => {
        router.replace("/login");
      }, 1200);
    } catch (submitError) {
      setError(getRecoveryError(submitError, t("authRecovery.genericError")));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7F8FA_0%,#EFF6FF_100%)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[680px] items-center justify-center">
        <section className="w-full rounded-[24px] border border-[var(--tasko-border)] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.10)] sm:p-8">
          <div className="flex flex-col items-center text-center">
            <LogoLink compact />
            <p className="mt-4 text-[2rem] font-semibold tracking-tight text-[var(--tasko-text)]">
              {isForgot ? t("authRecovery.forgotTitle") : t("authRecovery.resetTitle")}
            </p>
            <p className="mt-2 max-w-md text-base leading-7 text-[var(--tasko-muted)]">
              {isForgot ? t("authRecovery.forgotText") : t("authRecovery.resetText")}
            </p>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {isForgot ? (
              <label className="block space-y-2">
                <span className="tasko-label">{t("auth.email")}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="tasko-input"
                  placeholder={t("auth.emailPlaceholder")}
                  required
                />
              </label>
            ) : (
              <>
                <label className="block space-y-2">
                  <span className="tasko-label">{t("settings.newPassword")}</span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="tasko-input"
                    placeholder={t("settings.newPasswordPlaceholder")}
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="tasko-label">{t("settings.confirmPassword")}</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="tasko-input"
                    placeholder={t("settings.confirmPasswordPlaceholder")}
                    required
                  />
                </label>
              </>
            )}

            {error ? (
              <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-[12px] bg-[var(--tasko-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--tasko-primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting
                ? t("auth.wait")
                : isForgot
                  ? t("authRecovery.sendLink")
                  : t("authRecovery.savePassword")}
            </button>
          </form>

          <div className="mt-6 border-t border-[var(--tasko-border)] pt-5 text-center text-sm text-[var(--tasko-muted)]">
            <Link href="/login" className="font-semibold text-[var(--tasko-primary)]">
              {t("auth.logInHere")}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
