"use client";

import Link from "next/link";

type LogoLinkProps = {
  compact?: boolean;
};

export function LogoLink({ compact = false }: LogoLinkProps) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center rounded-[1.5rem] transition ${compact ? "gap-3" : "gap-4"}`}
      aria-label="Go to Tasko home page"
    >
      <div className={`relative shrink-0 transition group-hover:scale-[1.02] ${compact ? "h-10 w-10" : "h-14 w-14"}`}>
        <svg
          viewBox="0 0 64 64"
          aria-hidden="true"
          className="h-full w-full drop-shadow-[0_10px_24px_rgba(59,130,246,0.18)]"
        >
          <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#taskoLogoBg)" />
          <defs>
            <linearGradient id="taskoLogoBg" x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38BDF8" />
              <stop offset="1" stopColor="#2563EB" />
            </linearGradient>
          </defs>
          <path
            d="M17 18C17 15.7909 18.7909 14 21 14H39.5C41.7091 14 43.5 15.7909 43.5 18V21C43.5 23.2091 41.7091 25 39.5 25H34.5V46C34.5 48.2091 32.7091 50 30.5 50H27.5C25.2909 50 23.5 48.2091 23.5 46V25H21C18.7909 25 17 23.2091 17 21V18Z"
            fill="white"
          />
          <path
            d="M33 17.5H46C48.2091 17.5 50 19.2909 50 21.5V22.2C50 24.4091 48.2091 26.2 46 26.2H33V17.5Z"
            fill="#DBEAFE"
          />
          <path
            d="M21.5 47.2H35.5"
            stroke="#DBEAFE"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
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
