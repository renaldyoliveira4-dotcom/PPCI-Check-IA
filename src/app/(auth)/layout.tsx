import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-navy-50/50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Voltar para a página inicial">
          <Logo />
        </Link>
      </div>
      <main className="mx-auto flex max-w-md flex-col items-center justify-center px-4 pb-16 sm:px-6">
        {children}
      </main>
    </div>
  );
}
