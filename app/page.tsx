"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { KpisGerais, PCT, StatusProntidao } from "@/lib/types";
import { KpiPanel } from "@/components/KpiPanel";
import { PctCard } from "@/components/PctCard";
import { Header } from "@/components/Header";
import { NewPctDrawer } from "@/components/NewPctDrawer";
import { PctDetailsModal } from "@/components/PctDetailsModal";
import { gerarRelatorioConsolidado, gerarRelatorioSimplificadoPCTs } from "@/lib/pdf";
import { Loader2, RadioTower } from "lucide-react";

export default function DashboardPage() {
  const supabase = createClient();

  const [pcts, setPcts] = useState<PCT[]>([]);
  const [kpis, setKpis] = useState<KpisGerais | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState<PCT | null>(null);
  const [busca, setBusca] = useState("");
  const [searchDisabled, setSearchDisabled] = useState(false);
  const [statusFiltro, setStatusFiltro] = useState<StatusProntidao | "todos">("todos");

  const carregarDados = useCallback(async () => {
    setCarregando(true);

    const [{ data: pctsData }, { data: kpisData }] = await Promise.all([
      supabase
        .from("vw_pcts_totais")
        .select(
          `id,
          codigo,
          nome,
          logradouro,
          cep,
          ponto_referencia,
          status,
          alvt_id,
          secoes_proprias,
          secoes_totais,
          secoes_vinculadas,
          transmite_secoes_proprias,
          agrega_locais_satelites,
          conectividade,
          possui_nobreak,
          ponto_rede_homologado,
          observacoes_tecnicas,
          alvt:alvts(id, nome, telefone, matricula_eleitoral, cpf, treinado, homologado, crachao_titularidade),
          locais_vinculados(id, nome_escola, secoes_count, pct_id)`
        )
        .order("codigo"),
      supabase.from("vw_kpis_gerais").select("total_pcts_ativos, total_secoes_atendidas, pcts_com_locais_vinculados, total_locais_vinculados, total_alvts, alvts_treinados_homologados").single(),
    ]);

    const pctsAtualizados = (pctsData as unknown as PCT[]) ?? [];
    setPcts(pctsAtualizados);
    setKpis((kpisData as unknown as KpisGerais) ?? null);

    setModalDetalhes((modalAtual) => {
      if (!modalAtual) return null;
      return pctsAtualizados.find((p) => p.id === modalAtual.id) ?? null;
    });

    setCarregando(false);
  }, [supabase]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const pctsFiltrados = useMemo(() => {
    return pcts.filter((p) => {
      const matchStatus = statusFiltro === "todos" || p.status === statusFiltro;
      const buscaLower = busca.trim().toLowerCase();
      const matchBusca =
        buscaLower === "" ||
        p.codigo.toLowerCase().includes(buscaLower) ||
        p.nome.toLowerCase().includes(buscaLower) ||
        p.logradouro.toLowerCase().includes(buscaLower);
      return matchStatus && matchBusca;
    });
  }, [pcts, statusFiltro, busca]);

  return (
    <div className="min-h-screen bg-pct-bg">
      <Header
        busca={busca}
        onBuscaChange={setBusca}
        statusFiltro={statusFiltro}
        onStatusFiltroChange={setStatusFiltro}
        onNovoPct={() => setDrawerAberto(true)}
        onExportarRelatorio={() => gerarRelatorioConsolidado(pctsFiltrados)}
        onExportarRelatorioSimplificado={() => gerarRelatorioSimplificadoPCTs(pctsFiltrados)}
        searchDisabled={searchDisabled}
      />

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        {kpis && <KpiPanel kpis={kpis} />}

        {carregando ? (
          <div className="flex items-center justify-center gap-2 py-24 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Carregando polos...
          </div>
        ) : pctsFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-pct-border py-24 text-center">
            <RadioTower className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-400">
              Nenhum PCT encontrado com os filtros atuais.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {pctsFiltrados.map((pct) => (
              <PctCard
                key={pct.id}
                pct={pct}
                onEdit={() => setModalDetalhes(pct)}
              />
            ))}
          </div>
        )}
      </main>

      <NewPctDrawer
        open={drawerAberto}
        onClose={() => setDrawerAberto(false)}
        onCreated={carregarDados}
      />

      <PctDetailsModal
        pct={modalDetalhes}
        open={Boolean(modalDetalhes)}
        onClose={() => {
          setModalDetalhes(null);
          setSearchDisabled(false);
        }}
        onUpdated={carregarDados}
        onDeleteStateChange={(ativo) => {
          setSearchDisabled(ativo);
          if (ativo) {
            setBusca("");
          }
        }}
      />
    </div>
  );
}