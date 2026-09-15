"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ALVT, LocalVinculado, PCT, StatusProntidao } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { NewPctDrawer } from "@/components/NewPctDrawer";
import {
  X,
  MapPin,
  Building2,
  ShieldCheck,
  UserRound,
  Clock3,
  ClipboardList,
  FileText,
  Pencil,
  Save,
  RotateCcw,
  Plus,
  Trash2,
} from "lucide-react";

export function PctDetailsModal({
  pct,
  open,
  onClose,
  onUpdated,
  onDeleteStateChange,
}: {
  pct: PCT | null;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
  onDeleteStateChange?: (ativo: boolean) => void;
}) {
  const supabase = createClient();

  const [modoEdicao, setModoEdicao] = useState(false);
  const [form, setForm] = useState<PCT | null>(pct);
  const [locais, setLocais] = useState<LocalVinculado[]>(pct?.locais_vinculados ?? []);
  const [alvts, setAlvts] = useState<ALVT[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);
  const [editDrawerAberto, setEditDrawerAberto] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [senhaExclusao, setSenhaExclusao] = useState("");
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(null), 3300);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!pct) return;

    setForm(pct);
    setLocais(pct.locais_vinculados ?? []);
    setModoEdicao(false);
    setErro(null);
    setCarregandoDetalhes(true);

    let ignore = false;

    const carregarDetalhesCompletos = async () => {
      const { data, error } = await supabase
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
          created_at,
          updated_at,
          alvt:alvts(id, nome, telefone, matricula_eleitoral, cpf, treinado, homologado, crachao_titularidade),
          locais_vinculados(id, nome_escola, secoes_count, pct_id)`
        )
        .eq("id", pct.id)
        .single();

      if (ignore) return;

      if (error || !data) {
        setCarregandoDetalhes(false);
        return;
      }

      const pctDetalhado = {
        ...data,
        created_at: data.created_at ?? pct.created_at ?? new Date().toISOString(),
        updated_at: data.updated_at ?? pct.updated_at ?? new Date().toISOString(),
      } as unknown as PCT;

      setForm(pctDetalhado);
      setLocais(pctDetalhado.locais_vinculados ?? []);
      setCarregandoDetalhes(false);
    };

    carregarDetalhesCompletos();

    return () => {
      ignore = true;
      setCarregandoDetalhes(false);
    };
  }, [pct, supabase]);

  useEffect(() => {
    const carregarAlvts = async () => {
      const { data } = await supabase
        .from("alvts")
        .select("id, nome, matricula_eleitoral, telefone, treinado, homologado, crachao_titularidade, cpf")
        .order("nome");
      setAlvts((data as ALVT[]) ?? []);
    };

    carregarAlvts();
  }, [supabase]);

  const secoesTotais = useMemo(() => {
    if (!form) return 0;

    const secoesLocaisVinculados = (locais ?? []).reduce(
      (total, local) => total + Number(local.secoes_count ?? 0),
      0
    );

    return (form.secoes_totais ?? 0) > 0
      ? form.secoes_totais ?? 0
      : Number(form.secoes_proprias ?? 0) + secoesLocaisVinculados;
  }, [form, locais]);

  const linhasObservacoes = useMemo(() => {
    if (!form?.observacoes_tecnicas) return [];

    return form.observacoes_tecnicas
      .split("\n")
      .map((linha) => linha.trim())
      .filter((linha) => linha.length > 0);
  }, [form?.observacoes_tecnicas]);

  if (!open || !form) return null;

  const atualizarCampo = <K extends keyof PCT>(campo: K, valor: PCT[K]) => {
    setForm((atual) => (atual ? { ...atual, [campo]: valor } : atual));
  };

  const adicionarLocal = () => {
    setLocais((atual) => [
      ...atual,
      {
        id: crypto.randomUUID(),
        pct_id: form!.id,
        nome_escola: "",
        secoes_count: 0,
      },
    ]);
  };

  const atualizarLocal = (index: number, campo: "nome_escola" | "secoes_count", valor: string | number) => {
    setLocais((atual) =>
      atual.map((local, idx) =>
        idx === index
          ? {
              ...local,
              [campo]: valor,
            }
          : local
      )
    );
  };

  const removerLocal = (index: number) => {
    setLocais((atual) => atual.filter((_, idx) => idx !== index));
  };

  const validarEdicao = () => {
    if (!form?.nome?.trim()) return "O nome do PCT é obrigatório.";
    if (!form?.codigo?.trim()) return "O código do PCT é obrigatório.";
    if (!form?.logradouro?.trim()) return "O logradouro do PCT é obrigatório.";
    if (!form?.alvt_id && !form?.alvt) return "Selecione ou cadastre um responsável ALVT.";
    if (!form?.transmite_secoes_proprias && !form?.agrega_locais_satelites) {
      return "Selecione ao menos um escopo: seções próprias e/ou locais satélites.";
    }
    if (form?.agrega_locais_satelites && locais.some((local) => !local.nome_escola.trim())) {
      return "Preencha o nome de todos os locais vinculados antes de salvar.";
    }
    return null;
  };

  const salvarAlteracoes = async () => {
    try {
      setSalvando(true);
      setErro(null);

      const validacao = validarEdicao();
      if (validacao) {
        setErro(validacao);
        setToast({ type: "warning", message: validacao });
        return;
      }

      let alvtIdFinal = form.alvt_id ?? null;

      if (form.alvt_id && form.alvt) {
        const { data: outrosPcts, error: erroBuscaPcts } = await supabase
          .from("pcts")
          .select("id")
          .eq("alvt_id", form.alvt_id)
          .neq("id", form.id)
          .limit(1);

        if (erroBuscaPcts) throw erroBuscaPcts;

        if (outrosPcts && outrosPcts.length > 0) {
          const { data: novoAlvt, error: erroAlvt } = await supabase
            .from("alvts")
            .insert({
              nome: form.alvt.nome,
              matricula_eleitoral: form.alvt.matricula_eleitoral ?? "",
              cpf: form.alvt.cpf ?? "",
              telefone: form.alvt.telefone,
              treinado: Boolean(form.alvt.treinado),
              homologado: Boolean(form.alvt.homologado),
              crachao_titularidade: form.alvt.crachao_titularidade ?? "titular",
            })
            .select()
            .single();

          if (erroAlvt) throw erroAlvt;
          alvtIdFinal = novoAlvt.id;
        } else {
          const { error: erroAlvt } = await supabase
            .from("alvts")
            .update({
              nome: form.alvt.nome,
              telefone: form.alvt.telefone,
              updated_at: new Date().toISOString(),
            })
            .eq("id", form.alvt_id);

          if (erroAlvt) throw erroAlvt;
          alvtIdFinal = form.alvt_id;
        }
      }

      const payload = {
        codigo: form.codigo,
        nome: form.nome,
        logradouro: form.logradouro,
        cep: form.cep ?? null,
        ponto_referencia: form.ponto_referencia ?? null,
        status: form.status,
        alvt_id: alvtIdFinal,
        secoes_proprias: Number(form.secoes_proprias ?? 0),
        transmite_secoes_proprias: Boolean(form.transmite_secoes_proprias),
        agrega_locais_satelites: Boolean(form.agrega_locais_satelites),
        conectividade: form.conectividade ?? null,
        possui_nobreak: Boolean(form.possui_nobreak),
        ponto_rede_homologado: Boolean(form.ponto_rede_homologado),
        observacoes_tecnicas: form.observacoes_tecnicas ?? null,
        updated_at: new Date().toISOString(),
      };

      const { error: erroPct } = await supabase.from("pcts").update(payload).eq("id", form.id);
      if (erroPct) throw erroPct;

      const locaisValidos = locais.filter((local) => local.nome_escola.trim() !== "");

      const { error: erroDelete } = await supabase
        .from("locais_vinculados")
        .delete()
        .eq("pct_id", form.id);
      if (erroDelete) throw erroDelete;

      if (locaisValidos.length > 0) {
        const { error: erroInsert } = await supabase.from("locais_vinculados").insert(
          locaisValidos.map((local) => ({
            id: local.id,
            pct_id: form.id,
            nome_escola: local.nome_escola,
            secoes_count: Number(local.secoes_count ?? 0),
          }))
        );
        if (erroInsert) throw erroInsert;
      }

      onUpdated?.();
      setToast({ type: "success", message: "PCT atualizado com sucesso!" });
      setModoEdicao(false);
    } catch (err: any) {
      const mensagem = err.message ?? "Não foi possível salvar as alterações do PCT.";
      setErro(mensagem);
      setToast({ type: "error", message: mensagem });
    } finally {
      setSalvando(false);
    }
  };

  const cancelarEdicao = () => {
    setForm(pct);
    setLocais(pct?.locais_vinculados ?? []);
    setErro(null);
    setModoEdicao(false);
  };

  const excluirPct = async () => {
    if (!form) return;

    try {
      setExcluindo(true);
      setErroExclusao(null);

      const {
        data: { user },
        error: erroUsuario,
      } = await supabase.auth.getUser();

      if (erroUsuario || !user?.email) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      const { error: erroSenha } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: senhaExclusao,
      });

      if (erroSenha) {
        throw new Error("Senha inválida. Verifique a senha de login e tente novamente.");
      }

      const { error: erroExclusao } = await supabase
        .from("pcts")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", form.id);

      if (erroExclusao) throw erroExclusao;

      setToast({ type: "success", message: "PCT ocultado com sucesso. Ele permanece no banco para auditoria." });
      setConfirmarExclusao(false);
      setSenhaExclusao("");
      onUpdated?.();
      onClose();
    } catch (err: any) {
      const mensagem = err.message ?? "Não foi possível ocultar o PCT.";
      setErroExclusao(mensagem);
      setToast({ type: "error", message: mensagem });
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1px]" onClick={onClose} />

      {toast && (
        <div
          className={[
            "pointer-events-none absolute right-6 top-6 z-[60] max-w-sm rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-sm",
            toast.type === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
            toast.type === "error" && "border-red-200 bg-red-50 text-red-700",
            toast.type === "warning" && "border-amber-200 bg-amber-50 text-amber-700",
          ]
            .filter(Boolean)
            .join(" ")}
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      )}

      <div className="teams-modal relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden bg-slate-50/95">
        {confirmarExclusao && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1px]" onClick={() => setConfirmarExclusao(false)} />

            <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Confirmação
                  </p>
                  <h3 className="text-lg font-semibold text-slate-800">Excluir PCT</h3>
                </div>
              </div>

              <p className="mb-4 text-sm text-slate-600">
                Esta ação remove o PCT da visualização do app e da listagem do sistema.
              </p>

              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                Senha de login
              </label>
              <input
                type="password"
                name="pct-delete-password"
                value={senhaExclusao}
                onChange={(event) => setSenhaExclusao(event.target.value)}
                className="teams-input mb-3 w-full"
                placeholder="Digite sua senha"
                autoComplete="new-password"
                data-lpignore="true"
                data-form-type="password"
                autoFocus
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    excluirPct();
                  }
                }}
              />

              {erroExclusao && (
                <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{erroExclusao}</p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmarExclusao(false);
                    setSenhaExclusao("");
                    setErroExclusao(null);
                    onDeleteStateChange?.(false);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={excluirPct}
                  disabled={excluindo || !senhaExclusao.trim()}
                  className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {excluindo ? "Validando..." : "Confirmar exclusão"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-pct-border bg-slate-50/80 px-6 py-4 backdrop-blur-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-pct-muted">
              PCT
            </p>
            <h2 className="text-lg font-semibold text-pct-text">
              {modoEdicao ? "Editar PCT" : `${form.codigo} · ${form.nome}`}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-pct-muted transition hover:bg-slate-100"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/70 px-6 py-5">
          <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-4">
              <section className="rounded-2xl border border-pct-border bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-pct-muted">
                      Visão geral
                    </p>
                    {modoEdicao ? (
                      <input
                        value={form.nome}
                        onChange={(e) => atualizarCampo("nome", e.target.value)}
                        className="teams-input mt-2"
                      />
                    ) : (
                      <h3 className="mt-1 text-xl font-semibold text-pct-text">{form.nome}</h3>
                    )}
                  </div>
                  <StatusBadge status={form.status} />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-pct-border bg-white p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-pct-muted">
                      Código
                    </p>
                    {modoEdicao ? (
                      <input
                        value={form.codigo}
                        onChange={(e) => atualizarCampo("codigo", e.target.value)}
                        className="teams-input mt-2"
                      />
                    ) : (
                      <p className="mt-1 font-semibold text-pct-text">{form.codigo}</p>
                    )}
                  </div>
                  <div className="rounded-xl border border-pct-border bg-white p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-pct-muted">
                      Seções totais
                    </p>
                    <p className="mt-1 font-semibold text-pct-text">{secoesTotais}</p>
                  </div>
                  <div className="rounded-xl border border-pct-border bg-white p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-pct-muted">
                      Locais vinculados
                    </p>
                    <p className="mt-1 font-semibold text-pct-text">{form.locais_vinculados?.length ?? 0}</p>
                  </div>
                  <div className="rounded-xl border border-pct-border bg-white p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-pct-muted">
                      ALVT
                    </p>
                    <p className="mt-1 font-semibold text-pct-text">{form.alvt?.nome ?? "Não atribuído"}</p>
                  </div>
                </div>
              </section>

              <section className="space-y-3 rounded-2xl border border-pct-border bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-pct-text">
                  <MapPin className="h-4 w-4 text-pct-accent" />
                  Endereço
                </div>

                <div className="space-y-3 text-sm text-pct-muted">
                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-pct-muted">
                      Logradouro
                    </span>
                    {modoEdicao ? (
                      <input
                        value={form.logradouro}
                        onChange={(e) => atualizarCampo("logradouro", e.target.value)}
                        className="teams-input mt-2"
                      />
                    ) : (
                      <span className="mt-1 block text-pct-text">{form.logradouro}</span>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-pct-muted">
                        CEP
                      </span>
                      {modoEdicao ? (
                        <input
                          value={form.cep ?? ""}
                          onChange={(e) => atualizarCampo("cep", e.target.value || null)}
                          className="teams-input mt-2"
                        />
                      ) : (
                        <span className="mt-1 block text-pct-text">{form.cep ?? "—"}</span>
                      )}
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-pct-muted">
                        Referência
                      </span>
                      {modoEdicao ? (
                        <input
                          value={form.ponto_referencia ?? ""}
                          onChange={(e) => atualizarCampo("ponto_referencia", e.target.value || null)}
                          className="teams-input mt-2"
                        />
                      ) : (
                        <span className="mt-1 block text-pct-text">{form.ponto_referencia ?? "—"}</span>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-3 rounded-2xl border border-pct-border bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-pct-text">
                  <ClipboardList className="h-4 w-4 text-pct-accent" />
                  Detalhes do escopo
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-3 text-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-pct-muted">
                      Seções próprias
                    </p>
                    {modoEdicao ? (
                      <input
                        type="number"
                        min={0}
                        value={form.secoes_proprias}
                        onChange={(e) => atualizarCampo("secoes_proprias", Number(e.target.value) || 0)}
                        className="teams-input mt-2"
                      />
                    ) : (
                      <p className="mt-1 font-semibold text-pct-text">{form.secoes_proprias}</p>
                    )}
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 text-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-pct-muted">
                      Transmissão próprias
                    </p>
                    {modoEdicao ? (
                      <select
                        value={form.transmite_secoes_proprias ? "sim" : "nao"}
                        onChange={(e) =>
                          atualizarCampo("transmite_secoes_proprias", e.target.value === "sim")
                        }
                        className="teams-input mt-2"
                      >
                        <option value="sim">Sim</option>
                        <option value="nao">Não</option>
                      </select>
                    ) : (
                      <p className="mt-1 font-semibold text-pct-text">
                        {form.transmite_secoes_proprias ? "Sim" : "Não"}
                      </p>
                    )}
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 text-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-pct-muted">
                      Conectividade
                    </p>
                    {modoEdicao ? (
                      <input
                        value={form.conectividade ?? ""}
                        onChange={(e) => atualizarCampo("conectividade", e.target.value || null)}
                        className="teams-input mt-2"
                      />
                    ) : (
                      <p className="mt-1 font-semibold text-pct-text">
                        {form.conectividade ?? "Não informada"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-pct-border bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-pct-muted">
                      Locais vinculados
                    </p>
                    {modoEdicao && (
                      <button
                        type="button"
                        onClick={adicionarLocal}
                        className="inline-flex items-center gap-1 rounded-lg border border-pct-border bg-white px-2 py-1 text-[11px] font-medium text-pct-text hover:bg-slate-50"
                      >
                        <Plus className="h-3.5 w-3.5" /> Adicionar
                      </button>
                    )}
                  </div>

                  {locais.length === 0 ? (
                    <p className="mt-3 text-sm text-pct-muted">Nenhum local vinculado.</p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {locais.map((local, index) => (
                        <div key={local.id ?? `local-${index}`} className="rounded-lg border border-pct-border bg-white p-2">
                          {modoEdicao ? (
                            <div className="flex gap-2">
                              <input
                                value={local.nome_escola}
                                onChange={(e) => atualizarLocal(index, "nome_escola", e.target.value)}
                                placeholder="Nome do local"
                                className="teams-input flex-1"
                              />
                              <input
                                type="number"
                                min={0}
                                value={local.secoes_count}
                                onChange={(e) =>
                                  atualizarLocal(index, "secoes_count", Number(e.target.value) || 0)
                                }
                                placeholder="Seções"
                                className="teams-input w-24"
                              />
                              <button
                                type="button"
                                onClick={() => removerLocal(index)}
                                className="rounded-lg p-2 text-pct-muted hover:bg-slate-100"
                                aria-label="Remover local vinculado"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <span className="font-medium text-pct-text">{local.nome_escola}</span>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-pct-muted">
                                {local.secoes_count} seções
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {modoEdicao && (
                  <div className="mt-4 rounded-xl border border-pct-border bg-slate-50 p-3">
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-pct-muted">
                      Observações técnicas
                    </label>
                    <textarea
                      value={form.observacoes_tecnicas ?? ""}
                      onChange={(e) => atualizarCampo("observacoes_tecnicas", e.target.value || null)}
                      rows={4}
                      className="teams-input mt-2 min-h-[100px] resize-none"
                    />
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-4">
              <section className="rounded-2xl border border-pct-border bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-pct-text">
                  <Building2 className="h-4 w-4 text-pct-accent" />
                  Status
                </div>

                {modoEdicao ? (
                  <>
                    <label className="mt-3 block text-xs font-medium text-pct-muted">
                      Alterar situação do PCT
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => atualizarCampo("status", e.target.value as StatusProntidao)}
                      className="teams-input mt-2"
                    >
                      <option value="pronto_transmissao">Pronto para Transmissão</option>
                      <option value="em_teste_link">Em Teste de Link</option>
                    </select>
                  </>
                ) : (
                  <div className="mt-3">
                    <StatusBadge status={form.status} />
                  </div>
                )}

                <div className="mt-4 rounded-xl border border-pct-border bg-slate-50 p-3 text-sm text-pct-muted">
                  <p className="font-medium text-pct-text">Resumo do status</p>
                  <p className="mt-1">
                    {form.status === "pronto_transmissao"
                      ? "PCT disponível para transmissão e operação ativa."
                      : "PCT em validação técnica e ajuste de link antes da abertura operacional."}
                  </p>
                </div>
              </section>

              <section className="space-y-3 rounded-2xl border border-pct-border bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-pct-text">
                  <UserRound className="h-4 w-4 text-pct-accent" />
                  Responsável
                </div>

                <div className="space-y-3 text-sm text-pct-muted">
                  {modoEdicao ? (
                    <div className="space-y-3">
                      <div>
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-pct-muted">
                          ALVT
                        </span>
                        <select
                          value={form.alvt_id ?? ""}
                          onChange={(e) => {
                            const alvtSelecionado = alvts.find((alvt) => alvt.id === e.target.value) ?? null;
                            atualizarCampo("alvt_id", e.target.value || null);
                            atualizarCampo("alvt", alvtSelecionado);
                          }}
                          className="teams-input mt-2"
                        >
                          <option value="">Não atribuído</option>
                          {alvts.map((alvt) => (
                            <option key={alvt.id} value={alvt.id}>
                              {alvt.nome}
                            </option>
                          ))}
                        </select>
                      </div>

                      {form.alvt && (
                        <div className="space-y-3 rounded-xl border border-pct-border bg-slate-50 p-3">
                          <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-pct-muted">
                              Nome do ALVT
                            </label>
                            <input
                              value={form.alvt.nome}
                              onChange={(e) =>
                                atualizarCampo("alvt", { ...form.alvt!, nome: e.target.value })
                              }
                              className="teams-input mt-2"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-pct-muted">
                              Telefone
                            </label>
                            <input
                              value={form.alvt.telefone}
                              onChange={(e) =>
                                atualizarCampo("alvt", { ...form.alvt!, telefone: e.target.value })
                              }
                              className="teams-input mt-2"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-pct-muted">
                        ALVT
                      </span>
                      <span className="mt-1 block text-pct-text">{form.alvt?.nome ?? "Não informado"}</span>
                    </div>
                  )}

                  {!modoEdicao && (
                    <div>
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-pct-muted">
                        Telefone
                      </span>
                      <span className="mt-1 block text-pct-text">{form.alvt?.telefone ?? "—"}</span>
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-3 rounded-2xl border border-pct-border bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-pct-text">
                  <ShieldCheck className="h-4 w-4 text-pct-accent" />
                  Infraestrutura
                </div>

                <div className="space-y-2 text-sm text-pct-muted">
                  <div className="flex items-center justify-between gap-2">
                    <span>No-break</span>
                    {modoEdicao ? (
                      <select
                        value={form.possui_nobreak ? "sim" : "nao"}
                        onChange={(e) => atualizarCampo("possui_nobreak", e.target.value === "sim")}
                        className="teams-input w-auto min-w-[90px]"
                      >
                        <option value="sim">Sim</option>
                        <option value="nao">Não</option>
                      </select>
                    ) : (
                      <span className="font-medium text-pct-text">{form.possui_nobreak ? "Sim" : "Não"}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Ponto de rede homologado</span>
                    {modoEdicao ? (
                      <select
                        value={form.ponto_rede_homologado ? "sim" : "nao"}
                        onChange={(e) => atualizarCampo("ponto_rede_homologado", e.target.value === "sim")}
                        className="teams-input w-auto min-w-[90px]"
                      >
                        <option value="sim">Sim</option>
                        <option value="nao">Não</option>
                      </select>
                    ) : (
                      <span className="font-medium text-pct-text">{form.ponto_rede_homologado ? "Sim" : "Não"}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Conectividade</span>
                    <span className="font-medium text-pct-text">{form.conectividade ?? "—"}</span>
                  </div>
                </div>
              </section>

              <section className="space-y-3 rounded-2xl border border-pct-border bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-pct-text">
                  <FileText className="h-4 w-4 text-pct-accent" />
                  Observações técnicas
                </div>

                {linhasObservacoes.length > 0 ? (
                  <ul className="list-disc space-y-1.5 pl-4 text-sm text-pct-text">
                    {linhasObservacoes.map((linha, index) => (
                      <li key={`observacao-${index}`}>{linha}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-pct-muted">Nenhuma observação registrada.</p>
                )}
              </section>

              <section className="rounded-2xl border border-pct-border bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-pct-text">
                  <Clock3 className="h-4 w-4 text-pct-accent" />
                  Atualização
                </div>
                <p className="mt-3 text-sm text-pct-muted">
                  {new Date(form.updated_at).toLocaleString("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              </section>
            </aside>
          </div>

          {erro && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {erro}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-pct-border bg-slate-50/80 px-6 py-4">
          {modoEdicao ? (
            <>
              <button type="button" className="teams-button-secondary" onClick={cancelarEdicao}>
                <RotateCcw className="mr-1.5 h-4 w-4" /> Cancelar
              </button>
              <button type="button" className="teams-button-primary" onClick={salvarAlteracoes} disabled={salvando}>
                <Save className="mr-1.5 h-4 w-4" />
                {salvando ? "Salvando..." : "Salvar alterações"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="teams-button-primary disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => !carregandoDetalhes && setEditDrawerAberto(true)}
                disabled={carregandoDetalhes}
              >
                <Pencil className="mr-1.5 h-4 w-4" />
                {carregandoDetalhes ? "Carregando..." : "Editar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmarExclusao(true);
                  setErroExclusao(null);
                  setSenhaExclusao("");
                  onDeleteStateChange?.(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </button>
              <button type="button" className="teams-button-secondary" onClick={onClose}>
                Fechar
              </button>
            </>
          )}
        </div>
      </div>

      <NewPctDrawer
        open={editDrawerAberto}
        onClose={() => setEditDrawerAberto(false)}
        onCreated={() => {
          onUpdated?.();
          setEditDrawerAberto(false);
        }}
        mode="edit"
        pctToEdit={form ?? pct}
      />
    </div>
  );
}