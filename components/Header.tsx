"use client";

import { StatusProntidao, STATUS_LABELS, ZONA_ELEITORAL_NOME } from "@/lib/types";
import { ChevronDown, FileDown, LogOut, Plus, Search, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export function Header({
  busca,
  onBuscaChange,
  statusFiltro,
  onStatusFiltroChange,
  onNovoPct,
  onExportarRelatorio,
  onExportarRelatorioSimplificado,
  searchDisabled = false,
}: {
  busca: string;
  onBuscaChange: (v: string) => void;
  statusFiltro: StatusProntidao | "todos";
  onStatusFiltroChange: (v: StatusProntidao | "todos") => void;
  onNovoPct: () => void;
  onExportarRelatorio: () => void;
  onExportarRelatorioSimplificado: () => void;
  searchDisabled?: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [saindo, setSaindo] = useState(false);
  const [usuarioEmail, setUsuarioEmail] = useState<string | null>(null);
  const [relatoriosAberto, setRelatoriosAberto] = useState(false);
  const relatoriosRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function carregarUsuario() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUsuarioEmail(session?.user?.email ?? null);
    }

    carregarUsuario();
  }, [supabase]);

  useEffect(() => {
    if (!relatoriosAberto) return;

    function handleClickFora(event: MouseEvent) {
      if (relatoriosRef.current && !relatoriosRef.current.contains(event.target as Node)) {
        setRelatoriosAberto(false);
      }
    }

    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, [relatoriosAberto]);

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
            <div className="flex items-center justify-center">
              <Image
                src="/logo.svg"
                alt="PoloJE"
                width={28}
                height={28}
                className="h-11 w-11 rounded-2xl shadow-teamsInset"
                priority
              />
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
            <div className="relative" ref={relatoriosRef}>
              <button
                type="button"
                onClick={() => setRelatoriosAberto((atual) => !atual)}
                aria-haspopup="menu"
                aria-expanded={relatoriosAberto}
                className="teams-button-secondary gap-1.5 px-3 py-2 text-[11px]"
              >
                <FileDown className="h-3.5 w-3.5" /> Relatórios
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${relatoriosAberto ? "rotate-180" : ""}`}
                />
              </button>

              {relatoriosAberto && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+6px)] z-40 w-52 overflow-hidden rounded-xl border border-pct-border bg-white p-1 shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onExportarRelatorio();
                      setRelatoriosAberto(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-pct-text transition hover:bg-slate-50"
                  >
                    <FileDown className="h-3.5 w-3.5 text-pct-accent" /> Relatório Consolidado
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onExportarRelatorioSimplificado();
                      setRelatoriosAberto(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-pct-text transition hover:bg-slate-50"
                  >
                    <FileDown className="h-3.5 w-3.5 text-pct-accent" /> Relatório Simplificado
                  </button>
                </div>
              )}
            </div>
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