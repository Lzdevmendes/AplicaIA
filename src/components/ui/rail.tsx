"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogoMark,
  IconPlus,
  IconTracker,
  IconTasks,
  IconProfile,
  IconUpload,
} from "@/components/ui/icons";

const NAV = [
  { href: "/nova", title: "Nova candidatura", Icon: IconPlus },
  { href: "/tracker", title: "Tracker", Icon: IconTracker },
  { href: "/tarefas", title: "Tarefas", Icon: IconTasks },
  { href: "/perfil", title: "Perfil", Icon: IconProfile },
  { href: "/onboarding", title: "Onboarding", Icon: IconUpload },
] as const;

function itemClass(active: boolean) {
  return [
    "w-[46px] h-[46px] rounded-[11px] flex items-center justify-center",
    "transition-colors duration-100",
    active ? "bg-pine-tint text-pine" : "bg-transparent text-muted hover:bg-subtle",
  ].join(" ");
}

export function Rail() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Desktop: barra lateral vertical */}
      <nav className="hidden md:flex w-[76px] flex-none bg-bg border-r border-border flex-col items-center py-[22px] sticky top-0 h-screen">
        <Link
          href="/nova"
          aria-label="AplicaAI"
          className="w-10 h-10 rounded-[9px] bg-ink flex items-center justify-center mb-[34px]"
        >
          <LogoMark size={20} />
        </Link>

        {NAV.slice(0, 4).map(({ href, title, Icon }) => (
          <Link
            key={href}
            href={href}
            title={title}
            aria-label={title}
            aria-current={isActive(href) ? "page" : undefined}
            className={`${itemClass(isActive(href))} mb-2`}
          >
            <Icon size={21} />
          </Link>
        ))}

        <div className="mt-auto">
          <Link
            href="/onboarding"
            title="Onboarding"
            aria-label="Onboarding"
            aria-current={isActive("/onboarding") ? "page" : undefined}
            className={itemClass(isActive("/onboarding"))}
          >
            <IconUpload size={20} />
          </Link>
        </div>
      </nav>

      {/* Mobile: barra de navegação inferior fixa */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-bg border-t border-border flex items-center justify-around px-2 pt-1.5 pb-[max(6px,env(safe-area-inset-bottom))]">
        {NAV.map(({ href, title, Icon }) => (
          <Link
            key={href}
            href={href}
            aria-label={title}
            aria-current={isActive(href) ? "page" : undefined}
            className={itemClass(isActive(href))}
          >
            <Icon size={21} />
          </Link>
        ))}
      </nav>
    </>
  );
}
