import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-navy-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#como-funciona"
            className="text-sm font-medium text-navy-600 hover:text-navy-900"
          >
            Como funciona
          </a>
          <a
            href="#problemas"
            className="text-sm font-medium text-navy-600 hover:text-navy-900"
          >
            O que identificamos
          </a>
          <a
            href="#beneficios"
            className="text-sm font-medium text-navy-600 hover:text-navy-900"
          >
            Benefícios
          </a>
          <Link
            href="/planos"
            className="text-sm font-medium text-navy-600 hover:text-navy-900"
          >
            Planos
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden sm:block">
            <Button variant="ghost" size="sm">
              Entrar
            </Button>
          </Link>
          <Link href="/cadastro">
            <Button size="sm">Começar grátis</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
