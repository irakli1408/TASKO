"use client";

import Image from "next/image";
import Link from "next/link";

type LogoLinkProps = {
  compact?: boolean;
};

export function LogoLink({ compact = false }: LogoLinkProps) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center rounded-[1.5rem] transition ${
        compact ? "gap-3" : "gap-4"
      }`}
      aria-label="Go to Tasko home page"
    >
      <div
        className={`overflow-hidden rounded-[1.2rem] border bg-white transition group-hover:scale-[1.01] ${
          compact ? "px-2.5 py-2" : "px-3 py-2.5"
        }`}
        style={{ borderColor: "var(--tasko-border)", boxShadow: "var(--tasko-shadow)" }}
      >
        <Image
          src="/tasko-logo.png"
          alt="Tasko logo"
          width={compact ? 120 : 154}
          height={compact ? 44 : 56}
          priority
          className="h-auto w-auto object-contain"
        />
      </div>
      {!compact ? (
        <div className="hidden sm:block">
          <p className="text-lg font-semibold tracking-tight" style={{ color: "var(--tasko-text)" }}>
            Tasko
          </p>
          <p className="text-sm tasko-muted">Service marketplace platform</p>
        </div>
      ) : null}
    </Link>
  );
}
