"use client";

import { StatusProntidao, STATUS_LABELS, ZONA_ELEITORAL_NOME } from "@/lib/types";
import { FileDown, LogOut, Plus, Search, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function Header({
  busca,
  onBuscaChange,
  statusFiltro,
  onStatusFiltroChange,
  onNovoPct,
  onExportarRelatorio,
  searchDisabled = false,
}: {
  busca: string;
  onBuscaChange: (v: string) => void;
  statusFiltro: StatusProntidao | "todos";
  onStatusFiltroChange: (v: StatusProntidao | "todos") => void;
  onNovoPct: () => void;
  onExportarRelatorio: () => void;
  searchDisabled?: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [saindo, setSaindo] = useState(false);
  const [usuarioEmail, setUsuarioEmail] = useState<string | null>(null);

  useEffect(() => {
    async function carregarUsuario() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUsuarioEmail(session?.user?.email ?? null);
    }

    carregarUsuario();
  }, [supabase]);

  async function handleLogout() {
    if (saindo) return;

    setSaindo(true);
    try {
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setSaindo(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-pct-border bg-pct-bg/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pct-accent/10 text-pct-accent shadow-teamsInset">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-tight text-pct-text">
                PoloJE
              </h1>
              <p className="text-xs text-pct-muted">Polos de Contingência e Transmissão | {ZONA_ELEITORAL_NOME}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {usuarioEmail && (
              <span className="hidden text-[11px] text-pct-muted sm:inline-block">
                {usuarioEmail}
              </span>
            )}
            <button
              onClick={onExportarRelatorio}
              className="teams-button-secondary gap-1.5 px-3 py-2 text-[11px]"
            >
              <FileDown className="h-3.5 w-3.5" /> Relatório Consolidado
            </button>
            <button
              onClick={onNovoPct}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#4f52b3] px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#4348a4]"
            >
              <Plus className="h-3.5 w-3.5" /> Novo PCT
            </button>
            <button
              onClick={handleLogout}
              disabled={saindo}
              className="teams-button-secondary flex h-9 w-9 items-center justify-center rounded-xl p-0 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-75"
              title={saindo ? "Saindo..." : "Sair"}
            >
              <LogOut
                className={`h-3.5 w-3.5 ${
                  saindo ? "animate-spin text-pct-accent" : "transition-transform duration-300"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pct-muted" />
            <input
              type="search"
              name="pct-search"
              value={busca}
              onChange={(e) => onBuscaChange(e.target.value)}
              placeholder="Buscar por código, nome do polo ou logradouro..."
              autoComplete="off"
              spellCheck={false}
              disabled={searchDisabled}
              data-lpignore="true"
              data-form-type="other"
              className="teams-input pl-9 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {(["todos", "pronto_transmissao", "em_teste_link"] as const).map(
              (s) => (
                <button
                  key={s}
                  onClick={() => onStatusFiltroChange(s)}
                  className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    statusFiltro === s
                      ? "border-pct-accent bg-pct-accent/10 text-pct-accent"
                      : "border-pct-border bg-white text-pct-muted hover:bg-slate-50"
                  }`}
                >
                  {s === "todos" ? "Todos" : STATUS_LABELS[s as StatusProntidao]}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
