import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="border-t border-navy-100 bg-navy-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-navy-600">
              Pré-análise técnica de projetos de prevenção e combate a
              incêndio com apoio de Inteligência Artificial.
            </p>
            <p className="mt-4 max-w-sm text-xs text-navy-500">
              Esta ferramenta realiza pré-análise automatizada de apoio
              técnico. O resultado não substitui a responsabilidade do
              profissional habilitado nem garante aprovação pelo CBMBA.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-navy-900">Produto</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="#como-funciona" className="text-navy-600 hover:text-navy-900">
                  Como funciona
                </a>
              </li>
              <li>
                <a href="#beneficios" className="text-navy-600 hover:text-navy-900">
                  Benefícios
                </a>
              </li>
              <li>
                <Link href="/planos" className="text-navy-600 hover:text-navy-900">
                  Planos
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-navy-900">Conta</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/login" className="text-navy-600 hover:text-navy-900">
                  Entrar
                </Link>
              </li>
              <li>
                <Link href="/cadastro" className="text-navy-600 hover:text-navy-900">
                  Criar conta
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-navy-100 pt-6 text-xs text-navy-500">
          © {new Date().getFullYear()} PPCI Check IA. Todos os direitos
          reservados.
        </div>
      </div>
    </footer>
  );
}
