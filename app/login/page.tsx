"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    setLoading(false);

    if (error) {
      setErro("Credenciais inválidas. Verifique seu e-mail e senha.");
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-pct-bg px-4 py-10">
      <div className="w-full max-w-md rounded-[24px] border border-pct-border bg-pct-panel p-8 shadow-teams">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pct-accent/10 text-pct-accent shadow-teamsInset">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-pct-text">PoloJE</h1>
            <p className="mt-1 text-lg text-pct-muted">
              Gestão e Monitoramento de Polos de Contingência e Transmissão
            </p>
          </div>
          <p className="text-sm font-medium text-pct-muted">10ª Zona Eleitoral de Guarabira</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-pct-muted">
              E-mail institucional
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="teams-input"
              placeholder="usuario@tre.jus.br"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-pct-muted">
              Senha
            </label>
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="teams-input"
              placeholder="••••••••"
            />
          </div>

          {erro && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{erro}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="teams-button-primary w-full gap-2 py-3 text-sm disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-pct-muted">
          Acesso restrito a servidores e colaboradores autorizados.
        </p>
      </div>
    </div>
  );
}
