import { KpisGerais } from "@/lib/types";
import { Radio, MapPinned, Building2 } from "lucide-react";

function KpiCard({
  icon: Icon,
  label,
  value,
  sublabel,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sublabel?: string;
  className?: string;
}) {
  return (
    <div className={`h-full rounded-2xl border border-[#4f52b3]/25 bg-[#4f52b3] p-4 text-white shadow-sm ${className ?? ""}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/80">
          {label}
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-4 text-3xl font-semibold tracking-tight text-white">{value}</div>
      {sublabel && <div className="mt-2 text-xs text-white/80">{sublabel}</div>}
    </div>
  );
}

export function KpiPanel({ kpis }: { kpis: KpisGerais }) {
  const percentualCobertura =
    kpis.total_locais_vinculados > 0
      ? Math.round((kpis.pcts_com_locais_vinculados / kpis.total_locais_vinculados) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard icon={Radio} label="PCTs Ativos" value={String(kpis.total_pcts_ativos)} className="min-h-[150px]" />
      <KpiCard
        icon={Building2}
        label="Seções Atendidas"
        value={String(kpis.total_secoes_atendidas)}
        sublabel="100% de cobertura dos Locais de Votação"
        className="min-h-[150px]"
      />
      <KpiCard
        icon={MapPinned}
        label="Locais de Votação Vinculados"
        value={String(kpis.total_locais_vinculados)}
        className="min-h-[150px]"
      />
    </div>
  );
}
