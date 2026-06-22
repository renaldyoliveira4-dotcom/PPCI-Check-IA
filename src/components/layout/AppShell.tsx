"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Plus,
  History,
  Coins,
  Sparkles,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { StateSelector } from "@/components/layout/StateSelector";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { FeedbackButton } from "@/components/layout/FeedbackButton";
import { SITE_CONFIG } from "@/lib/config";
import { resetUser } from "@/lib/analytics";

const NAV_GROUPS = [
  {
    label: "Principal",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/projetos/novo", label: "Novo projeto", icon: Plus },
      { href: "/historico", label: "Histórico", icon: History },
    ],
  },
  {
    label: "Conta",
    items: [
      { href: "/tokens", label: "Tokens", icon: Coins },
      { href: "/planos", label: "Planos", icon: Sparkles },
    ],
  },
];

interface AppShellProps {
  children: React.ReactNode;
  userName?: string;
  userEmail?: string;
  tokens?: number;
  activeState?: string;
  isAdmin?: boolean;
}

export function AppShell({
  children,
  userName,
  userEmail,
  tokens,
  activeState = "BA",
  isAdmin = false,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    resetUser();
    router.push("/");
    router.refresh();
  };

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const SidebarContent = ({ mini = false }: { mini?: boolean }) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn(
        "flex h-20 items-center justify-center border-b border-slate-700/40",
        mini ? "px-2" : "px-4"
      )}>
        {mini ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white text-xs font-bold shadow-lg">
            PC
          </div>
        ) : (
          <Logo variant="white" />
        )}
      </div>

      {/* Projeto ativo / tokens / admin */}
      {!mini && isAdmin && (
        <div className="mx-3 mt-3 flex items-center gap-2.5 rounded-lg border border-ember-500/30 bg-ember-500/10 px-3 py-2">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-ember-500 to-amber-500 text-white shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ember-400">Conta admin</p>
            <p className="text-xs font-medium text-white/90 leading-none">Sem cobrança de tokens</p>
          </div>
        </div>
      )}

      {!mini && !isAdmin && typeof tokens === "number" && (
        <Link href="/tokens" className="mx-3 mt-3 flex items-center gap-2.5 rounded-lg bg-slate-800/60 px-3 py-2 hover:bg-slate-800 transition-colors">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-sm">
            <Coins className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Saldo</p>
            <p className="font-bold text-white leading-none">
              {tokens} <span className="text-xs font-normal text-slate-400">{tokens === 1 ? "token" : "tokens"}</span>
            </p>
          </div>
        </Link>
      )}

      {/* Nav */}
      <nav className="flex-1 space-y-5 overflow-y-auto p-3 pt-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!mini && (
              <p className="mb-1.5 px-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={mini ? item.label : undefined}
                    className={cn(
                      "flex items-center rounded-lg transition-all duration-150",
                      mini ? "h-10 w-10 justify-center mx-auto" : "gap-3 px-3 py-2.5",
                      isActive
                        ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm shadow-orange-900/30"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <Icon className="h-[17px] w-[17px] flex-shrink-0" />
                    {!mini && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-700/40 p-3">
        {!mini && userName && (
          <div className="mb-2 flex items-center gap-2.5 rounded-lg px-2 py-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-xs font-bold text-white shadow-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{userName}</p>
              {userEmail && (
                <p className="truncate text-xs text-slate-500">{userEmail}</p>
              )}
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          title={mini ? "Sair" : undefined}
          className={cn(
            "flex w-full items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-red-400",
            mini ? "h-10 w-10 justify-center" : "gap-3 px-3 py-2.5"
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!mini && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Sidebar Desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden bg-slate-900 text-white transition-all duration-300 lg:flex lg:flex-col",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        <SidebarContent mini={collapsed} />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-400 hover:text-white shadow"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm lg:hidden">
        <Logo />
        <div className="flex items-center gap-2">
          <StateSelector currentState={activeState} />
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-slate-900 text-white">
            <div className="flex h-16 items-center justify-between border-b border-slate-700/40 px-5">
              <Logo />
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <main className={cn("transition-all duration-300", collapsed ? "lg:pl-[68px]" : "lg:pl-64")}>
        {/* Desktop topbar */}
        <div className="sticky top-0 z-10 hidden h-14 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm lg:flex">
          <div />
          <StateSelector currentState={activeState} />
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      <WhatsAppButton
        number={SITE_CONFIG.whatsappNumber}
        defaultMessage={SITE_CONFIG.whatsappDefaultMessage}
      />
      <FeedbackButton />
    </div>
  );
}
