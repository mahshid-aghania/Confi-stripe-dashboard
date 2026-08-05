"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

const TABS = [
  { href: "/", label: "Overview" },
  { href: "/report", label: "Report" },
  { href: "/refunds", label: "Refunds" },
]

export function TabNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Keep the chosen range when switching sections, so an operator does not have
  // to re-pick dates on every tab.
  const carried = new URLSearchParams()
  for (const key of ["preset", "from", "to"]) {
    const value = searchParams.get(key)
    if (value) carried.set(key, value)
  }
  const query = carried.toString()

  return (
    <nav aria-label="Dashboard sections" className="-mb-px flex items-center gap-1 border-b border-border">
      {TABS.map((tab) => {
        const active = pathname === tab.href

        return (
          <Link
            key={tab.href}
            href={query ? `${tab.href}?${query}` : tab.href}
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
