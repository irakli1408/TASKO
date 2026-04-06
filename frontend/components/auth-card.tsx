"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { resolveHomePath, useAuth } from "@/components/auth-provider";
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

function getFriendlyError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Email or password is incorrect.";
    if (error.status === 409) return "This email already exists.";
    if (error.status === 400) return error.message || "Please check the form fields and try again.";

    return error.message;
  }

  if (error instanceof Error) {
    const message = error.message;

    if (message.includes("401")) return "Email or password is incorrect.";
    if (message.includes("400")) return "Please check the form fields and try again.";
    if (message.includes("409")) return "This account already exists.";

    return message;
  }

  return "Something went wrong. Please try again.";
}

export function AuthCard({ mode }: AuthCardProps) {
  const router = useRouter();
  const { login, register, status, user } = useAuth();
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(resolveHomePath(user));
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

      router.replace(resolveHomePath(currentUser));
    } catch (submitError) {
      setError(getFriendlyError(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="tasko-shell flex min-h-screen items-center py-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="tasko-card overflow-hidden p-0">
          <div className="border-b px-6 py-4" style={{ borderColor: "var(--tasko-border)" }}>
            <LogoLink compact />
          </div>
          <div className="grid gap-8 bg-gradient-to-br from-[#f7faff] via-white to-[#fff8ed] p-8 sm:p-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#8ba0c3]">
                Tasko access
              </p>
              <h1 className="mt-4 max-w-md text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                {isRegister ? "Create an account and start using Tasko." : "Welcome back to Tasko."}
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 tasko-muted">
                {isRegister
                  ? "Registration signs the user in immediately and takes them into the platform flow."
                  : "Login loads the current user profile and routes them to the right workspace automatically."}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {["Safe login", "Profile sync", "Role redirect"].map((item) => (
                <div key={item} className="tasko-soft-card px-4 py-5">
                  <p className="text-sm font-semibold text-[#35507f]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="tasko-card p-6 sm:p-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#8ba0c3]">
                {isRegister ? "Register" : "Login"}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                {isRegister ? "Let&apos;s create your account" : "Sign in to continue"}
              </h2>
            </div>
            <Link href="/" className="tasko-secondary-btn px-4 py-2">
              Home
            </Link>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isRegister ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="tasko-label">First name</span>
                  <input
                    value={form.firstName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, firstName: event.target.value }))
                    }
                    className="tasko-input"
                    placeholder="Nika"
                    required
                  />
                </label>
                <label className="space-y-2">
                  <span className="tasko-label">Last name</span>
                  <input
                    value={form.lastName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, lastName: event.target.value }))
                    }
                    className="tasko-input"
                    placeholder="Beridze"
                    required
                  />
                </label>
              </div>
            ) : null}

            <label className="block space-y-2">
              <span className="tasko-label">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                className="tasko-input"
                placeholder="you@example.com"
                required
              />
            </label>

            {isRegister ? (
              <label className="block space-y-2">
                <span className="tasko-label">Phone</span>
                <input
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, phone: event.target.value }))
                  }
                  className="tasko-input"
                  placeholder="+995 555 12 34 56"
                  required
                />
              </label>
            ) : null}

            <label className="block space-y-2">
              <span className="tasko-label">Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                className="tasko-input"
                placeholder="Enter password"
                required
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting || status === "loading"}
              className="tasko-primary-btn w-full disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Please wait..." : isRegister ? "Create account" : "Log in"}
            </button>
          </form>

          <p className="mt-6 text-sm tasko-muted">
            {isRegister ? "Already have an account?" : "Need an account?"}{" "}
            <Link
              href={isRegister ? "/login" : "/register"}
              className="font-semibold text-[#2f6bff]"
            >
              {isRegister ? "Log in here" : "Register here"}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
