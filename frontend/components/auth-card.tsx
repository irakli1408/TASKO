"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { ApiError } from "@/lib/api";
import { LogoLink } from "@/components/logo-link";

type AuthMode = "login" | "register";

type AuthCardProps = {
  mode: AuthMode;
};

type FormState = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
};

const initialState: FormState = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: ""
};

function getFriendlyError(error: unknown, t: (key: string) => string) {
  if (error instanceof ApiError) {
    if (error.status === 401) return t("auth.incorrectCredentials");
    if (error.status === 409) return t("auth.emailExists");
    if (error.status === 400) return error.message || t("auth.checkFields");
    return error.message;
  }

  if (error instanceof Error) {
    const message = error.message;

    if (message.includes("401")) return t("auth.incorrectCredentials");
    if (message.includes("400")) return t("auth.checkFields");
    if (message.includes("409")) return t("auth.accountExists");

    return message;
  }

  return t("auth.genericError");
}

export function AuthCard({ mode }: AuthCardProps) {
  const router = useRouter();
  const { login, register, status, user } = useAuth();
  const { t } = useI18n();
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace("/");
    }
  }, [router, status, user]);

  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const currentUser = isRegister
        ? await register({
            email: form.email,
            password: form.password,
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone
          })
        : await login({
            email: form.email,
            password: form.password
          });

      router.replace("/");
    } catch (submitError) {
      setError(getFriendlyError(submitError, t));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7F8FA_0%,#EFF6FF_100%)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[760px] items-center justify-center">
        <section className="w-full rounded-[28px] border border-[var(--tasko-border)] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.10)] sm:p-9">
          <div className="flex flex-col items-center text-center">
            <LogoLink compact />
            <h1 className="mt-5 text-[2.1rem] font-semibold tracking-tight text-[var(--tasko-text)]">
              {isRegister ? t("auth.register") : t("auth.login")}
            </h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-[var(--tasko-muted)]">
              {isRegister ? t("auth.registerText") : t("auth.loginText")}
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {isRegister ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="tasko-label">{t("auth.firstName")}</span>
                  <input
                    value={form.firstName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, firstName: event.target.value }))
                    }
                    className="tasko-input"
                    placeholder={t("auth.firstNamePlaceholder")}
                    required
                  />
                </label>
                <label className="space-y-2">
                  <span className="tasko-label">{t("auth.lastName")}</span>
                  <input
                    value={form.lastName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, lastName: event.target.value }))
                    }
                    className="tasko-input"
                    placeholder={t("auth.lastNamePlaceholder")}
                    required
                  />
                </label>
              </div>
            ) : null}

            <label className="block space-y-2">
              <span className="tasko-label">{t("auth.email")}</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                className="tasko-input"
                placeholder={t("auth.emailPlaceholder")}
                required
              />
            </label>

            {isRegister ? (
              <label className="block space-y-2">
                <span className="tasko-label">{t("auth.phone")}</span>
                <input
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, phone: event.target.value }))
                  }
                  className="tasko-input"
                  placeholder={t("auth.phonePlaceholder")}
                  required
                />
              </label>
            ) : null}

            <label className="block space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="tasko-label">{t("auth.password")}</span>
                {!isRegister ? (
                  <Link
                    href="/forgot-password"
                    className="text-sm font-semibold text-[var(--tasko-primary)] transition hover:text-[var(--tasko-primary-strong)]"
                  >
                    {t("auth.forgotPassword")}
                  </Link>
                ) : null}
              </div>
              <input
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                className="tasko-input"
                placeholder={t("auth.passwordPlaceholder")}
                required
              />
            </label>

            {error ? (
              <div className="rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting || status === "loading"}
              className={`w-full rounded-[14px] px-4 py-3.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${
                isRegister
                  ? "bg-[#22C55E] hover:bg-[#16A34A]"
                  : "bg-[var(--tasko-primary)] hover:bg-[var(--tasko-primary-strong)]"
              }`}
            >
              {submitting ? t("auth.wait") : isRegister ? t("auth.register") : t("auth.logIn")}
            </button>
          </form>

          <div className="mt-7 border-t border-[var(--tasko-border)] pt-5 text-center text-sm text-[var(--tasko-muted)]">
            {isRegister ? `${t("auth.alreadyHaveAccount")} ` : `${t("auth.needAccount")} `}
            <Link
              href={isRegister ? "/login" : "/register"}
              className="font-semibold text-[var(--tasko-primary)]"
            >
              {isRegister ? t("auth.logInHere") : t("auth.registerHere")}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
