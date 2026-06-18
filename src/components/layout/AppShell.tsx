"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Plus, History, Coins, Sparkles,
  LogOut, Menu, X, ChevronLeft, ChevronRight,
  ShieldCheck, Flame, Moon, Sun,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { StateSelector } from "@/components/layout/StateSelector";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { SITE_CONFIG } from "@/lib/config";
import { useTheme } from "@/components/theme/ThemeProvider";

const NAV_GROUPS = [
  {
    label: "Principal",
    items: [
      { href: "/dashboard",       label: "Dashboard",    icon: LayoutDashboard },
      { href: "/projetos/novo",   label: "Novo projeto", icon: Plus },
      { href: "/historico",       label: "Histórico",    icon: History },
    ],
  },
  {
    label: "Conta",
    items: [
      { href: "/tokens",  label: "Tokens",  icon: Coins },
      { href: "/planos",  label: "Planos",  icon: Sparkles },
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
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const SidebarContent = ({ mini = false }: { mini?: boolean }) => (
    <div className="flex h-full flex-col">

      {/* ── Logo ── */}
      <div className={cn(
        "flex h-[64px] items-center border-b border-white/[0.06]",
        mini ? "justify-center px-0" : "gap-3 px-5"
      )}>
        {mini ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 shadow-[0_0_14px_rgba(239,68,68,0.35)]">
            <Flame className="h-5 w-5 text-white" />
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-600 shadow-[0_0_14px_rgba(239,68,68,0.35)]">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[13px] font-semibold leading-none text-white">PPCI Check IA</p>
              <p className="mt-0.5 text-[10px] text-white/30">Conformidade CBMBA</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Badge admin ou tokens ── */}
      {!mini && isAdmin && (
        <div className="mx-3 mt-3 flex items-center gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-red-600 text-white shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-red-400">Admin</p>
            <p className="text-xs font-medium text-white/80 leading-none">Tokens ilimitados</p>
          </div>
        </div>
      )}

      {!mini && !isAdmin && typeof tokens === "number" && (
        <Link
          href="/tokens"
          className="mx-3 mt-3 flex items-center gap-2.5 rounded-lg bg-white/[0.04] px-3 py-2.5 hover:bg-white/[0.07] transition-colors border border-white/[0.06]"
        >
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-red-600/20 text-red-400">
            <Coins className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-wider text-white/30">Saldo</p>
            <p className="font-bold text-white leading-none text-sm">
              {tokens}{" "}
              <span className="text-xs font-normal text-white/40">
                {tokens === 1 ? "token" : "tokens"}
              </span>
            </p>
          </div>
        </Link>
      )}

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto p-3 pt-5 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!mini && (
              <p className="mb-1 px-2 text-[9px] font-bold uppercase tracking-widest text-white/20">
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
                        ? "bg-red-600/15 border border-red-500/20 text-red-400"
                        : "text-white/30 hover:bg-white/[0.05] hover:text-white/70"
                    )}
                  >
                    <Icon className="h-[17px] w-[17px] flex-shrink-0" />
                    {!mini && <span className="text-sm font-medium">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="border-t border-white/[0.06] p-3 space-y-1">
        {/* Toggle tema */}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
          className={cn(
            "flex w-full items-center rounded-lg text-white/30 transition-colors hover:bg-white/[0.05] hover:text-white/60",
            mini ? "h-10 w-10 justify-center" : "gap-3 px-3 py-2.5"
          )}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 flex-shrink-0" />
          ) : (
            <Moon className="h-4 w-4 flex-shrink-0" />
          )}
          {!mini && (
            <span className="text-sm font-medium">
              {theme === "dark" ? "Modo claro" : "Modo escuro"}
            </span>
          )}
        </button>

        {/* User */}
        {!mini && userName && (
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-600/20 border border-red-500/25 text-xs font-bold text-red-400">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white/80">{userName}</p>
              {userEmail && (
                <p className="truncate text-xs text-white/25">{userEmail}</p>
              )}
            </div>
          </div>
        )}

        {/* Sair */}
        <button
          onClick={handleSignOut}
          title={mini ? "Sair" : undefined}
          className={cn(
            "flex w-full items-center rounded-lg text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400",
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
    <div
      className="min-h-screen transition-colors duration-200"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      {/* ── Sidebar desktop ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col transition-all duration-300 lg:flex",
          collapsed ? "w-[64px]" : "w-60"
        )}
        style={{ background: "var(--bg-sidebar)", borderRight: "1px solid rgba(255,255,255,0.05)" }}
      >
        <SidebarContent mini={collapsed} />
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="absolute -right-3 top-[72px] flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#0a0f1a] text-white/30 shadow hover:text-white/70"
        >
          {collapsed
            ? <ChevronRight className="h-3.5 w-3.5" />
            : <ChevronLeft className="h-3.5 w-3.5" />
          }
        </button>
      </aside>

      {/* ── Mobile header ── */}
      <header
        className="sticky top-0 z-20 flex h-14 items-center justify-between px-4 lg:hidden"
        style={{
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <Logo />
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Alternar tema"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <StateSelector currentState={activeState} />
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="absolute inset-y-0 left-0 w-60"
            style={{ background: "var(--bg-sidebar)" }}
          >
            <div
              className="flex h-14 items-center justify-between px-5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <Logo variant="white" />
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white/30 hover:text-white/70"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main ── */}
      <main className={cn("transition-all duration-300", collapsed ? "lg:pl-[64px]" : "lg:pl-60")}>
        {/* Desktop topbar */}
        <div
          className="sticky top-0 z-10 hidden h-14 items-center justify-between px-6 lg:flex"
          style={{
            background: "var(--bg-base)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div />
          <div className="flex items-center gap-3">
            <StateSelector currentState={activeState} />
          </div>
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
    </div>
  );
}
