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
] as const;

function railClass(active: boolean) {
  return [
    "w-[46px] h-[46px] rounded-[11px] flex items-center justify-center",
    "mb-2 transition-colors duration-100",
    active
      ? "bg-pine-tint text-pine"
      : "bg-transparent text-muted hover:bg-subtle",
  ].join(" ");
}

export function Rail() {
  const pathname = usePathname();

  return (
    <nav className="w-[76px] flex-none bg-bg border-r border-border flex flex-col items-center py-[22px] sticky top-0 h-screen">
      <Link
        href="/nova"
        aria-label="AplicaAI"
        className="w-10 h-10 rounded-[9px] bg-ink flex items-center justify-center mb-[34px]"
      >
        <LogoMark size={20} />
      </Link>

      {NAV.map(({ href, title, Icon }) => (
        <Link
          key={href}
          href={href}
          title={title}
          aria-label={title}
          aria-current={pathname === href ? "page" : undefined}
          className={railClass(pathname === href)}
        >
          <Icon size={21} />
        </Link>
      ))}

      <div className="mt-auto">
        <Link
          href="/onboarding"
          title="Onboarding"
          aria-label="Onboarding"
          aria-current={pathname === "/onboarding" ? "page" : undefined}
          className={railClass(pathname === "/onboarding")}
        >
          <IconUpload size={20} />
        </Link>
      </div>
    </nav>
  );
}
