import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth.ts";
import { supabase } from "@/integrations/supabase/client.ts";
import { Scale, AlertTriangle, CheckCircle, Clock, Search, RefreshCw, ExternalLink, BarChart2, FileText, Home } from "lucide-react";

interface ProcessoSemaforo {
  processo_id: string;
  numero_processo: string;
  tipo_processo: string;
  status_processo: string;
  cliente_nome: string;
  ultima_movimentacao_datajud: string | null;
  semaforo: string;
  score_risco: number;
  processo_criado_em: string;
  prazos_ativos: number;
  prazos_urgentes: number;
  prazos_vencidos: number;
}

type Aba = "dashboard" | "processos" | "alertas";

export default function ControladoriaProcessos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState<Aba>("dashboard");
  const [processos, setProcessos] = useState<ProcessoSemaforo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroSemaforo, setFiltroSemaforo] = useState("");

  useEffect(() => {
    if (user) carregarProcessos();
  }, [user]);

  async function carregarProcessos() {
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from("vw_semaforo_processos")
        .select("*")
        .order("score_risco", { ascending: false });
      if (error) throw error;
      setProcessos(data || []);
    } catch (e) {
      console.error("Erro ao carregar processos:", e);
    } finally {
      setCarregando(false);
    }
  }

  function diasDesdeMovimentacao(data: string | null): number {
    if (!data) return 9999;
    const diff = Date.now() - new Date(data).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  function formatarData(data: string | null): string {
    if (!data) return "Sem registro";
    return new Date(data).toLocaleDateString("pt-BR");
  }

  const totalProcessos = processos.length;
  const vermelhos = processos.filter(p => p.semaforo === "VERMELHO");
  const amarelos = processos.filter(p => p.semaforo === "AMARELO");
  const verdes = processos.filter(p => p.semaforo === "VERDE");

  const tiposUnicos = [...new Set(processos.map(p => p.tipo_processo).filter(Boolean))];

  const processosFiltrados = processos.filter(p => {
    const matchBusca = !busca || 
      p.numero_processo?.toLowerCase().includes(busca.toLowerCase()) ||
      p.cliente_nome?.toLowerCase().includes(busca.toLowerCase());
    const matchTipo = !filtroTipo || p.tipo_processo === filtroTipo;
    const matchSemaforo = !filtroSemaforo || p.semaforo === filtroSemaforo;
    return matchBusca && matchTipo && matchSemaforo;
  });

  const alertas30dias = processos
    .filter(p => diasDesdeMovimentacao(p.ultima_movimentacao_datajud) >= 30)
    .sort((a, b) => diasDesdeMovimentacao(b.ultima_movimentacao_datajud) - diasDesdeMovimentacao(a.ultima_movimentacao_datajud));

  const top10criticos = [...processos]
    .sort((a, b) => b.score_risco - a.score_risco)
    .slice(0, 10);

  function badgeSemaforo(s: string) {
    if (s === "VERMELHO") return "bg-red-100 text-red-800 border border-red-300";
    if (s === "AMARELO") return "bg-yellow-100 text-yellow-800 border border-yellow-300";
    return "bg-green-100 text-green-800 border border-green-300";
  }

  function abrirEsaj(numero: string) {
    const n = numero.replace(/[^\d]/g, "");
    window.open(`https://esaj.tjsp.jus.br/cpopg/search.do?conversationId=&cbPesquisa=NUMPROC&numeroDigitoAnoUnificado=${n}&foroNumeroUnificado=&dadosConsulta.valorConsultaNuUnificado=${numero}&dadosConsulta.valorConsulta=&dadosConsulta.tipoNuUnificado=SAJ6&pbEnviar=Pesquisar`, "_blank");
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="text-slate-400 hover:text-white transition-colors">
              <Home className="w-5 h-5" />
            </button>
            <Scale className="w-6 h-6 text-amber-400" />
            <div>
              <h1 className="text-lg font-bold text-white">Controladoria de Processos</h1>
              <p className="text-xs text-slate-400">Monitoramento e controle jurídico</p>
            </div>
          </div>
          <button
            onClick={carregarProcessos}
            disabled={carregando}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${carregando ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {([
            { id: "dashboard", label: "Dashboard", icon: BarChart2 },
            { id: "processos", label: "Processos", icon: FileText },
            { id: "alertas", label: `Alertas 30 Dias (${alertas30dias.length})`, icon: AlertTriangle },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setAbaAtiva(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                abaAtiva === id
                  ? "bg-amber-500 text-slate-900"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* ===== ABA DASHBOARD ===== */}
        {abaAtiva === "dashboard" && (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total de Processos</p>
                <p className="text-4xl font-bold text-white mt-2">{totalProcessos}</p>
                <p className="text-slate-500 text-xs mt-1">processos ativos</p>
              </div>
              <div className="bg-red-900/30 rounded-xl p-5 border border-red-800/50">
                <p className="text-red-400 text-xs font-medium uppercase tracking-wider">Processos Críticos</p>
                <p className="text-4xl font-bold text-red-400 mt-2">{vermelhos.length}</p>
                <p className="text-red-500 text-xs mt-1">sem mov. há +30 dias</p>
              </div>
              <div className="bg-yellow-900/30 rounded-xl p-5 border border-yellow-800/50">
                <p className="text-yellow-400 text-xs font-medium uppercase tracking-wider">Em Atenção</p>
                <p className="text-4xl font-bold text-yellow-400 mt-2">{amarelos.length}</p>
                <p className="text-yellow-500 text-xs mt-1">21-30 dias sem mov.</p>
              </div>
              <div className="bg-green-900/30 rounded-xl p-5 border border-green-800/50">
                <p className="text-green-400 text-xs font-medium uppercase tracking-wider">Em Dia</p>
                <p className="text-4xl font-bold text-green-400 mt-2">{verdes.length}</p>
                <p className="text-green-500 text-xs mt-1">menos de 21 dias</p>
              </div>
            </div>

            {/* Gráfico de barras por tipo */}
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-amber-400" />
                Distribuição por Tipo de Processo
              </h2>
              <div className="space-y-3">
                {tiposUnicos.map(tipo => {
                  const count = processos.filter(p => p.tipo_processo === tipo).length;
                  const pct = totalProcessos > 0 ? (count / totalProcessos) * 100 : 0;
                  return (
                    <div key={tipo}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300">{tipo}</span>
                        <span className="text-slate-400">{count} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top 10 Críticos */}
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                10 Processos Mais Críticos
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 text-xs uppercase border-b border-slate-700">
                      <th className="text-left pb-2">Nº Processo</th>
                      <th className="text-left pb-2">Cliente</th>
                      <th className="text-left pb-2">Tipo</th>
                      <th className="text-left pb-2">Última Mov.</th>
                      <th className="text-left pb-2">Dias Parado</th>
                      <th className="text-left pb-2">Status</th>
                      <th className="text-left pb-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {top10criticos.map(p => (
                      <tr key={p.processo_id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="py-2.5 text-blue-400 font-mono text-xs">{p.numero_processo}</td>
                        <td className="py-2.5 text-slate-300">{p.cliente_nome}</td>
                        <td className="py-2.5 text-slate-400">{p.tipo_processo}</td>
                        <td className="py-2.5 text-slate-400">{formatarData(p.ultima_movimentacao_datajud)}</td>
                        <td className="py-2.5">
                          <span className={diasDesdeMovimentacao(p.ultima_movimentacao_datajud) >= 30 ? "text-red-400 font-bold" : "text-yellow-400"}>
                            {diasDesdeMovimentacao(p.ultima_movimentacao_datajud) === 9999 ? "?" : diasDesdeMovimentacao(p.ultima_movimentacao_datajud)}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeSemaforo(p.semaforo)}`}>
                            {p.semaforo}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <button
                            onClick={() => abrirEsaj(p.numero_processo)}
                            className="text-slate-400 hover:text-blue-400 transition-colors"
                            title="Ver no e-SAJ"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===== ABA PROCESSOS ===== */}
        {abaAtiva === "processos" && (
          <div className="space-y-4">
            {/* Filtros */}
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por cliente ou nº processo..."
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <select
                  value={filtroTipo}
                  onChange={e => setFiltroTipo(e.target.value)}
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="">Todos os tipos</option>
                  {tiposUnicos.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select
                  value={filtroSemaforo}
                  onChange={e => setFiltroSemaforo(e.target.value)}
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="">Todos os status</option>
                  <option value="VERMELHO">🔴 Crítico</option>
                  <option value="AMARELO">🟡 Atenção</option>
                  <option value="VERDE">🟢 OK</option>
                </select>
              </div>
              <p className="text-slate-400 text-xs mt-2">{processosFiltrados.length} processo(s) encontrado(s)</p>
            </div>

            {/* Tabela */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-700/50">
                    <tr className="text-slate-400 text-xs uppercase">
                      <th className="text-left px-4 py-3">Nº Processo</th>
                      <th className="text-left px-4 py-3">Cliente</th>
                      <th className="text-left px-4 py-3">Tipo</th>
                      <th className="text-left px-4 py-3">Última Mov.</th>
                      <th className="text-left px-4 py-3">Dias</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {processosFiltrados.slice(0, 100).map(p => (
                      <tr key={p.processo_id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3 text-blue-400 font-mono text-xs">{p.numero_processo}</td>
                        <td className="px-4 py-3 text-slate-300 max-w-[180px] truncate">{p.cliente_nome}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{p.tipo_processo}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{formatarData(p.ultima_movimentacao_datajud)}</td>
                        <td className="px-4 py-3">
                          <span className={diasDesdeMovimentacao(p.ultima_movimentacao_datajud) >= 30 ? "text-red-400 font-bold" : diasDesdeMovimentacao(p.ultima_movimentacao_datajud) >= 21 ? "text-yellow-400" : "text-green-400"}>
                            {diasDesdeMovimentacao(p.ultima_movimentacao_datajud) === 9999 ? "—" : diasDesdeMovimentacao(p.ultima_movimentacao_datajud) + "d"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeSemaforo(p.semaforo)}`}>
                            {p.semaforo === "VERMELHO" ? "🔴" : p.semaforo === "AMARELO" ? "🟡" : "🟢"} {p.semaforo}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/processo/${p.processo_id}`)}
                              className="text-slate-400 hover:text-white transition-colors text-xs"
                              title="Ver processo"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => abrirEsaj(p.numero_processo)}
                              className="text-slate-400 hover:text-blue-400 transition-colors"
                              title="Ver no e-SAJ"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {processosFiltrados.length > 100 && (
                <div className="px-4 py-3 bg-slate-700/30 text-slate-400 text-xs text-center">
                  Mostrando os primeiros 100 de {processosFiltrados.length} processos
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== ABA ALERTAS ===== */}
        {abaAtiva === "alertas" && (
          <div className="space-y-4">
            <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-semibold">Processos sem movimentação há +30 dias</h3>
                  <p className="text-red-400 text-sm">{alertas30dias.length} processo(s) críticos precisam de atenção imediata</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-red-900/20">
                    <tr className="text-slate-400 text-xs uppercase">
                      <th className="text-left px-4 py-3">Nº Processo</th>
                      <th className="text-left px-4 py-3">Cliente</th>
                      <th className="text-left px-4 py-3">Tipo</th>
                      <th className="text-left px-4 py-3">Última Movimentação</th>
                      <th className="text-left px-4 py-3">Dias Parado</th>
                      <th className="text-left px-4 py-3">Ação Recomendada</th>
                      <th className="text-left px-4 py-3">Ver no e-SAJ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {alertas30dias.map(p => {
                      const dias = diasDesdeMovimentacao(p.ultima_movimentacao_datajud);
                      let acaoRecomendada = "Verificar andamento do processo";
                      if (p.tipo_processo === "Criminal") acaoRecomendada = "Verificar prescrição e prazo de recurso";
                      else if (p.tipo_processo === "Trabalhista") acaoRecomendada = "Verificar audiência e prazos CLT";
                      else if (p.tipo_processo === "Cível" || p.tipo_processo === "Civil") acaoRecomendada = "Verificar cumprimento de sentença";
                      else if (p.tipo_processo === "ExecucaoCriminal") acaoRecomendada = "Verificar benefícios e progressão";
                      return (
                        <tr key={p.processo_id} className="hover:bg-red-900/10 transition-colors">
                          <td className="px-4 py-3 text-blue-400 font-mono text-xs">{p.numero_processo}</td>
                          <td className="px-4 py-3 text-slate-300 max-w-[150px] truncate">{p.cliente_nome}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{p.tipo_processo}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{formatarData(p.ultima_movimentacao_datajud)}</td>
                          <td className="px-4 py-3">
                            <span className={`font-bold text-base ${dias >= 365 ? "text-red-300" : dias >= 90 ? "text-red-400" : "text-orange-400"}`}>
                              {dias === 9999 ? "?" : dias}d
                            </span>
                          </td>
                          <td className="px-4 py-3 text-yellow-300 text-xs max-w-[200px]">{acaoRecomendada}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => abrirEsaj(p.numero_processo)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-xs transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              e-SAJ
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {carregando && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
            <span className="ml-3 text-slate-400">Carregando dados da controladoria...</span>
          </div>
        )}
      </div>
    </div>
  );
         }
