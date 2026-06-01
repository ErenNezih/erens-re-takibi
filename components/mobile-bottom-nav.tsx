"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Sun, Dumbbell, ListTodo, Target, Settings } from "lucide-react";
import { cn } from "@/lib/cn";

const tabs = [
  { href: "/calendar", label: "Takvim", icon: Calendar },
  { href: "/today", label: "Bugün", icon: Sun },
  { href: "/workout", label: "Antrenman", icon: Dumbbell },
  { href: "/plans", label: "Planlar", icon: ListTodo },
  { href: "/seasons", label: "Süreçlerim", icon: Target },
  { href: "/settings", label: "Ayarlar", icon: Settings },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active =
            pathname === tab.href ||
            (tab.href === "/seasons"
              ? pathname.startsWith("/seasons")
              : tab.href !== "/calendar" && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0 min-w-[52px] min-h-[44px] px-1 py-0.5 rounded-lg transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", active && "stroke-[2.5]")} />
              <span className="text-[9px] font-medium leading-tight text-center">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
