"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const TABS = [
  { href: "/refunds", label: "Refunds" },
  { href: "/", label: "Overview" },
]

export function TabNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Dashboard sections" className="-mb-px flex items-center gap-1 border-b border-border">
      {TABS.map((tab) => {
        const active = pathname === tab.href

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`numeric border-b px-4 py-2.5 text-[12px] uppercase tracking-[0.14em] transition-colors ${
              active
                ? "border-signal text-foreground"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
