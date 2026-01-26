import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  ArrowLeft,
  FileText,
  User,
  DollarSign,
  StickyNote,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast.ts";
import { supabase } from "@/integrations/supabase/client.ts";
import { useAuth } from "@/hooks/useAuth.ts";
import {
  formatCurrencyInput,
  parseCurrency,
  formatCurrency,
} from "@/utils/currency.ts";
import DocumentUpload from "@/components/DocumentUpload.tsx";
import ProcessNotes from "@/components/ProcessNotes.tsx";
import {
  formatCPF,
  formatRG,
  formatPhone,
  formatCEP,
  formatProcessNumber,
  removeMask,
} from "@/utils/masks.ts";
import { useGlobalAccess } from "@/utils/accessUtils.ts";

const NewProcess = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [processoId, setProcessoId] = useState<string | null>(null);

  const [responsavelId, setResponsavelId] = useState<string | null>(null);

  const {
    canViewAllProcesses: hasGlobalProcessAccess,
    permissionsLoading: globalAccessLoading,
  } = useGlobalAccess();

  const [clienteData, setClienteData] = useState({
    nomeCompleto: "",
    rg: "",
    cpf: "",
    dataNascimento: "",
    telefone: "",
    email: "",
    endereco: "",
    bairro: "",
    cidade: "",
    cep: "",
  });

  const [processoData, setProcessoData] = useState({
    numeroProcesso: "",
    tipoProcesso: "",
    temPrazo: false,
    prazo: "",
    clientePreso: false,
  });

  const [financeiroData, setFinanceiroData] = useState({
    valorHonorarios: "",
    valorEntrada: "",
    dataEntrada: "",
    quantidadeParcelas: "",
    dataPrimeiroVencimento: "",
    incluirTMP: false,
    valorTMP: "",
    vencimentoTMP: "",
    quantidadeMesesTMP: "",
  });

  const [documentos, setDocumentos] = useState<any[]>([]);
  const [observacoes, setObservacoes] = useState<any[]>([]);

  const [responsavelData, setResponsavelData] = useState({
    nome: "",
    rg: "",
    cpf: "",
    data_nascimento: "",
    telefone: "",
    email: "",
    endereco_completo: "",
    cep: "",
  });

 // --- INÍCIO DA LÓGICA DE RASCUNHO INTELIGENTE (CRIAR E EDITAR) ---

  // Função auxiliar para gerar a chave única do rascunho
  const getStorageKey = (id: string | null, isEdit: boolean) => {
    if (isEdit && id) return `rascunho_edit_${id}`; // Chave única para cada edição
    return "rascunho_novo_processo"; // Chave fixa para criação
  };

  // 1. SALVAR: Monitora mudanças e salva no navegador
  useEffect(() => {
    // Não salva se estiver carregando os dados iniciais do banco
    if (loading) return;

    const key = getStorageKey(processoId, isEditMode);
    
    const rascunho = {
      clienteData,
      processoData,
      financeiroData,
      responsavelData,
      currentStep,
      timestamp: new Date().getTime() // Para saber quando foi salvo
    };

    // Salva apenas se houver algum dado preenchido
    if (clienteData.nomeCompleto || processoData.numeroProcesso) {
      localStorage.setItem(key, JSON.stringify(rascunho));
    }
  }, [
    clienteData, 
    processoData, 
    financeiroData, 
    responsavelData, 
    currentStep, 
    isEditMode, 
    processoId,
    loading
  ]);

  // 2. RECUPERAR (Criação): Roda apenas ao abrir a página "Novo Processo"
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId) {
      const saved = localStorage.getItem("rascunho_novo_processo");
      if (saved) aplicarRascunho(saved, "Você tinha um novo cadastro não finalizado.");
    }
  }, []);

  // 3. RECUPERAR (Edição): Roda DEPOIS de carregar os dados do banco
  // Adicionamos isso para sobrepor os dados do banco com o rascunho mais recente
  useEffect(() => {
    if (isEditMode && processoId && !loading) {
      const key = `rascunho_edit_${processoId}`;
      const saved = localStorage.getItem(key);
      
      if (saved) {
        const dadosRascunho = JSON.parse(saved);
        // Só aplica se o rascunho for recente (opcional, mas seguro)
        aplicarRascunho(saved, "Recuperamos suas alterações não salvas nesta edição.");
      }
    }
  }, [loading, isEditMode, processoId]);

  // Função auxiliar para aplicar os dados na tela
  const aplicarRascunho = (jsonString: string, mensagem: string) => {
    try {
      const dados = JSON.parse(jsonString);
      if (dados.clienteData) setClienteData(dados.clienteData);
      if (dados.processoData) setProcessoData(dados.processoData);
      if (dados.financeiroData) setFinanceiroData(dados.financeiroData);
      if (dados.responsavelData) setResponsavelData(dados.responsavelData);
      // Opcional: restaurar o passo em que estava
      // if (dados.currentStep) setCurrentStep(dados.currentStep);

      toast({
        title: "Dados recuperados",
        description: mensagem,
        duration: 3000,
      });
    } catch (e) {
      console.error("Erro ao restaurar rascunho", e);
    }
  };
  // --- FIM DA LÓGICA DE RASCUNHO ---
  
  const tiposProcesso = [
    "Criminal",
    "Cível",
    "Trabalhista",
    "Família",
    "Previdenciário",
    "Tributário",
    "Administrativo",
    "Consumidor",
  ];

  // Funções para aplicar máscaras
  const handleCpfChange = (value: string) => {
    setClienteData({ ...clienteData, cpf: formatCPF(value) });
  };

  const handleRgChange = (value: string) => {
    setClienteData({ ...clienteData, rg: formatRG(value) });
  };

  const handleTelefoneChange = (value: string) => {
    setClienteData({ ...clienteData, telefone: formatPhone(value) });
  };

  const handleCepChange = (value: string) => {
    setClienteData({ ...clienteData, cep: formatCEP(value) });
  };

  const handleResponsavelCpfChange = (value: string) => {
    setResponsavelData({ ...responsavelData, cpf: formatCPF(value) });
  };

  const handleResponsavelRgChange = (value: string) => {
    setResponsavelData({ ...responsavelData, rg: formatRG(value) });
  };

  const handleResponsavelTelefoneChange = (value: string) => {
    setResponsavelData({ ...responsavelData, telefone: formatPhone(value) });
  };

  const handleResponsavelCepChange = (value: string) => {
    setResponsavelData({ ...responsavelData, cep: formatCEP(value) });
  };

  const handleNumeroProcessoChange = (value: string) => {
    setProcessoData({ ...processoData, numeroProcesso: formatProcessNumber(value) });
  };

  // Verificar se está em modo de edição e carregar dados existentes
  useEffect(() => {
    const editId = searchParams.get("edit");
    const stepParam = searchParams.get("step");

    if (editId && user && !globalAccessLoading) {
      setIsEditMode(true);
      setProcessoId(editId);
      loadProcessData(editId);

      // Definir o passo inicial baseado no parâmetro da URL
      if (stepParam) {
        const step = parseInt(stepParam);
        if (step >= 1 && step <= 4) {
          setCurrentStep(step);
        }
      }
    }
  }, [searchParams, user, globalAccessLoading]);

  const loadProcessData = async (id: string) => {
    try {
      setLoading(true);

      let processoQuery = supabase
        .from("processos")
        .select(
          `
    *,
    clientes (*)
  `
        )
        .eq("id", id);

      // Sistema GLOBAL: Todos usuários veem TODOS os processos
      console.log("🔍 Visualizando todos os processos (acesso global)");

      const { data: processo, error: processoError } =
        await processoQuery.single();

      if (processoError) {
        console.error("Erro ao carregar processo:", processoError);
        toast({
          variant: "destructive",
          title: "Erro",
          description:
            "Processo não encontrado ou você não tem permissão para editá-lo.",
        });
        navigate("/dashboard");
        return;
      }

      // Garantir que o usuário tem acesso
      if (!hasGlobalProcessAccess && processo.user_id !== user?.id) {
        console.error(
          "❌ Acesso negado - usuário não tem permissão para editar este processo"
        );
        toast({
          variant: "destructive",
          title: "Acesso negado",
          description: "Você não tem permissão para editar este processo.",
        });
        navigate("/dashboard");
        return;
      }

      // Buscar cliente via rota API (usa SERVICE_ROLE_KEY para ignorar RLS)
      let clienteFromApi = null;
      if (processo.cliente_id) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData?.session?.access_token;

          const clienteRes = await fetch(`/api/clientes/${processo.cliente_id}`, {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            }
          });

          if (clienteRes.ok) {
            clienteFromApi = await clienteRes.json();
            console.log("[NewProcess] Cliente from API:", clienteFromApi);
          } else {
            console.error("[NewProcess] Erro ao buscar cliente via API - Status:", clienteRes.status);
          }
        } catch (error) {
          console.error("[NewProcess] Erro ao buscar cliente via API:", error);
        }
      } else {
        console.warn("[NewProcess] Processo sem cliente_id:", processo);
      }

      // Fallback: usar dados do join se API falhar (para processos antigos)
      const cliente = clienteFromApi || processo.clientes;
      console.log("[NewProcess] Cliente final (API ou join):", cliente);

      // Preencher dados do cliente
      if (cliente) {
        const enderecoParts = cliente.endereco?.split(", ") || ["", "", "", ""];
        console.log("[NewProcess] Endereço parts:", enderecoParts);

        setClienteData({
          nomeCompleto: cliente.nome || "",
          rg: cliente.rg || "", // <--- MUDE AQUI (Estava: rg: "")
          cpf: cliente.cpf_cnpj || "",
          dataNascimento: "",
          telefone: cliente.telefone || "",
          email: cliente.email || "",
          endereco: enderecoParts[0] || "",
          bairro: enderecoParts[1] || "",
          cidade: enderecoParts[2]?.split(" - ")[0] || "",
          cep: enderecoParts[2]?.split(" - ")[1] || "",
        });
        console.log("[NewProcess] ClienteData setado:", {
          nome: cliente.nome,
          cpf: cliente.cpf_cnpj,
          telefone: cliente.telefone,
          email: cliente.email,
          endereco: cliente.endereco
        });
      } else {
        console.warn("[NewProcess] Nenhum dado de cliente encontrado para este processo");
      }

      // Preencher dados do processo
      setProcessoData({
        numeroProcesso: processo.numero_processo || "",
        tipoProcesso: processo.tipo_processo || "",
        temPrazo: !!processo.prazo,
        prazo: processo.prazo || "",
        clientePreso: !!processo.cliente_preso,
      });

      // Carregar dados financeiros - usar nome do cliente carregado (pode ser da API ou join)
      if (cliente?.nome) {
        console.log("[NewProcess] Buscando dados financeiros para cliente:", cliente.nome);

        let financeiroQuery = supabase
          .from("financeiro")
          .select("*")
          .eq("cliente_nome", cliente.nome)
          .order("created_at", { ascending: true });

        // Sistema GLOBAL: Todos usuários veem TODOS os dados financeiros

        const { data: financeiroData, error: financeiroError } =
          await financeiroQuery;

        console.log("[NewProcess] Dados financeiros retornados:", financeiroData);

        if (!financeiroError && financeiroData && financeiroData.length > 0) {
          // Processar dados financeiros para reconstruir os valores originais
          const entrada = financeiroData.find((f) => f.tipo === "Entrada");
          const honorarios = financeiroData.filter(
            (f) => f.tipo === "Honorários"
          );
          const tmp = financeiroData.filter((f) => f.tipo === "TMP");

          const valorHonorarios =
            honorarios.reduce((total, h) => total + Number(h.valor), 0) +
            (entrada ? Number(entrada.valor) : 0);

          setFinanceiroData({
            valorHonorarios: valorHonorarios.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            }),
            valorEntrada: entrada
              ? Number(entrada.valor).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })
              : "",
            dataEntrada: entrada?.vencimento || "",
            quantidadeParcelas: honorarios.length.toString(),
            dataPrimeiroVencimento: honorarios[0]?.vencimento || "",
            incluirTMP: tmp.length > 0,
            valorTMP:
              tmp.length > 0
                ? Number(tmp[0].valor).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })
                : "",
            vencimentoTMP: tmp[0]?.vencimento || "",
            quantidadeMesesTMP: tmp.length.toString(),
          });
        }
      } else {
        console.warn("[NewProcess] Cliente sem nome - não é possível carregar dados financeiros");
      }

      // Sistema GLOBAL: Carregar TODAS as observações
      const { data: observacoesData, error: observacoesError } = await supabase
        .from("observacoes_processo")
        .select("*")
        .eq("processo_id", id);

      if (!observacoesError && observacoesData) {
        setObservacoes(
          observacoesData.map((obs) => ({
            id: obs.id, // Garantir que o ID UUID está presente
            titulo: obs.titulo,
            conteudo: obs.conteudo,
          }))
        );
      }

      // Sistema GLOBAL: Carregar TODOS os documentos
      const { data: documentosData, error: documentosError } = await supabase
        .from("documentos_processo")
        .select("*")
        .eq("processo_id", id);

      if (!documentosError && documentosData) {
        setDocumentos(documentosData);
      }

      const { data: responsavelData, error: responsavelError } = await supabase
        .from("responsavel_financeiro")
        .select("*")
        .eq("processo_id", id)
        .single();

      if (!responsavelError && responsavelData) {
        setResponsavelId(responsavelData.id);
        setResponsavelData({
          nome: responsavelData.nome || "",
          rg: responsavelData.rg || "",
          cpf: responsavelData.cpf || "",
          data_nascimento: responsavelData.data_nascimento || "",
          telefone: responsavelData.telefone || "",
          email: responsavelData.email || "",
          endereco_completo: responsavelData.endereco_completo || "",
          cep: responsavelData.cep || "",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar dados do processo:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar dados do processo.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    console.log("=== INICIANDO SALVAMENTO ===");
    console.log("User:", user);
    console.log("Cliente Data:", clienteData);
    console.log("Processo Data:", processoData);
    console.log("Financeiro data:", financeiroData);
    console.log("Responsável data:", responsavelData);
    console.log("User ID:", user?.id);

    // Verifique se os valores estão sendo convertidos corretamente:
    console.log(
      "Valor honorários convertido:",
      parseCurrency(financeiroData.valorHonorarios)
    );
    console.log(
      "Valor entrada convertido:",
      parseCurrency(financeiroData.valorEntrada || "0")
    );
    console.log("Dados financeiros processados:", {
      valorHonorarios: parseCurrency(financeiroData.valorHonorarios),
      valorEntrada: parseCurrency(financeiroData.valorEntrada || "0"),
      quantidadeParcelas: parseInt(financeiroData.quantidadeParcelas || "1"),
      dataPrimeiroVencimento: financeiroData.dataPrimeiroVencimento,
      incluirTMP: financeiroData.incluirTMP,
      valorTMP: parseCurrency(financeiroData.valorTMP || "0"),
      quantidadeMesesTMP: parseInt(financeiroData.quantidadeMesesTMP || "0"),
    });
    // Validação da parte financeira
    if (parseCurrency(financeiroData.valorHonorarios) <= 0) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Valor dos honorários deve ser maior que zero.",
      });
      return;
    }

    if (
      financeiroData.dataPrimeiroVencimento &&
      !financeiroData.quantidadeParcelas
    ) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description:
          "Quantidade de parcelas é obrigatória quando há data de vencimento.",
      });
      return;
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Usuário não autenticado.",
      });
      return;
    }

    // Validação básica
    if (!clienteData.nomeCompleto) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Nome do cliente é obrigatório.",
      });
      return;
    }

    if (!processoData.numeroProcesso) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Número do processo é obrigatório.",
      });
      return;
    }

    if (!processoData.tipoProcesso) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Tipo do processo é obrigatório.",
      });
      return;
    }

    setLoading(true);

    try {
      let clienteId = "";
      let processoCreatedId = "";

      if (isEditMode && processoId) {
        // MODO DE EDIÇÃO - Atualizar dados existentes
        console.log("=== ATUALIZANDO PROCESSO ===");

        // Primeiro buscar o processo existente
        const { data: processoExistente, error: processoExistenteError } =
          await supabase
            .from("processos")
            .select("*, clientes(*)")
            .eq("id", processoId)
            .single();

        if (processoExistenteError) throw processoExistenteError;

        clienteId = processoExistente.cliente_id;
        processoCreatedId = processoId;

        // 🔥 ADICIONE ESTA PARTE - LIMPAR E RECRIAR DADOS FINANCEIROS
        console.log("=== ATUALIZANDO REGISTROS FINANCEIROS ===");

        // Sistema GLOBAL: Limpar registros financeiros do cliente
        const { error: deleteFinanceError } = await supabase
          .from("financeiro")
          .delete()
          .eq("cliente_nome", clienteData.nomeCompleto);

        if (deleteFinanceError) {
          console.error("Erro ao limpar financeiro:", deleteFinanceError);
          throw deleteFinanceError;
        }
        console.log("✅ Registros financeiros antigos removidos");

        try {
          if (financeiroData.valorHonorarios) {
            const valorHonorarios = parseCurrency(
              financeiroData.valorHonorarios
            );
            const valorEntrada = parseCurrency(
              financeiroData.valorEntrada || "0"
            );
            const quantidadeParcelas = parseInt(
              financeiroData.quantidadeParcelas || "1"
            );

            console.log("Valores financeiros:", {
              valorHonorarios,
              valorEntrada,
              quantidadeParcelas,
            });

            if (valorEntrada > 0 && financeiroData.dataEntrada) {
              console.log("Criando entrada...");
              const { error: entradaError } = await supabase
                .from("financeiro")
                .insert([
                  {
                    user_id: user.id,
                    cliente_nome: clienteData.nomeCompleto,
                    processo_id: processoCreatedId,
                    valor: valorEntrada,
                    tipo: "Entrada",
                    status: "PENDENTE",
                    vencimento: financeiroData.dataEntrada,
                  },
                ]);

              if (entradaError) {
                console.error("Erro ao criar entrada:", entradaError);
                throw entradaError;
              }
              console.log("✅ Entrada criada com sucesso");
            }

            const valorRestante = valorHonorarios - valorEntrada;
            const valorParcela = valorRestante / quantidadeParcelas;

            if (financeiroData.dataPrimeiroVencimento) {
              const dataBase = new Date(financeiroData.dataPrimeiroVencimento);

              console.log("Criando parcelas de honorários...", {
                valorRestante,
                valorParcela,
              });

              for (let i = 0; i < quantidadeParcelas; i++) {
                const dataVencimento = new Date(dataBase);
                dataVencimento.setMonth(dataVencimento.getMonth() + i);

                const { error: parcelaError } = await supabase
                  .from("financeiro")
                  .insert([
                    {
                      user_id: user.id,
                      cliente_nome: clienteData.nomeCompleto,
                      valor: valorParcela,
                      processo_id: processoCreatedId,
                      tipo: "Honorários",
                      status: "PENDENTE",
                      vencimento: dataVencimento.toISOString(),
                    },
                  ]);

                if (parcelaError) {
                  console.error(
                    `Erro ao criar parcela ${i + 1}:`,
                    parcelaError
                  );
                  throw parcelaError;
                }
              }
              console.log("✅ Parcelas de honorários criadas com sucesso");
            }

            if (
              financeiroData.incluirTMP &&
              financeiroData.valorTMP &&
              financeiroData.vencimentoTMP
            ) {
              console.log("Criando parcelas de TMP...");
              const valorTMP = parseCurrency(financeiroData.valorTMP);
              const quantidadeMesesTMP = parseInt(
                financeiroData.quantidadeMesesTMP || "1"
              );
              const dataBaseTMP = new Date(financeiroData.vencimentoTMP);

              for (let i = 0; i < quantidadeMesesTMP; i++) {
                const dataVencimentoTMP = new Date(dataBaseTMP);
                dataVencimentoTMP.setMonth(dataVencimentoTMP.getMonth() + i);

                const { error: tmpError } = await supabase
                  .from("financeiro")
                  .insert([
                    {
                      user_id: user.id,
                      cliente_nome: clienteData.nomeCompleto,
                      processo_id: processoCreatedId,
                      valor: valorTMP,
                      tipo: "TMP",
                      status: "PENDENTE",
                      vencimento: dataVencimentoTMP.toISOString(),
                    },
                  ]);

                if (tmpError) {
                  console.error(`Erro ao criar TMP ${i + 1}:`, tmpError);
                  throw tmpError;
                }
              }
              console.log("✅ Parcelas de TMP criadas com sucesso");
            }
          }
        } catch (financeError) {
          console.error(
            "Erro específico na atualização financeira:",
            financeError
          );
          throw financeError;
        }

        // 🔥 TAMBÉM ATUALIZE O RESPONSÁVEL FINANCEIRO
        console.log("=== ATUALIZANDO RESPONSÁVEL FINANCEIRO ===");

        if (responsavelData.nome && responsavelData.cpf) {
          if (responsavelId) {
            // Atualizar responsável existente
            const { error: respError } = await supabase
              .from("responsavel_financeiro")
              .update({
                nome: responsavelData.nome,
                rg: removeMask(responsavelData.rg),
                cpf: removeMask(responsavelData.cpf),
                data_nascimento: responsavelData.data_nascimento,
                telefone: removeMask(responsavelData.telefone),
                email: responsavelData.email,
                endereco_completo: responsavelData.endereco_completo,
                cep: removeMask(responsavelData.cep),
                processo_id: processoId, // Vincular ao processo específico
              })
              .eq("id", responsavelId);

            if (respError) {
              console.error(
                "Erro ao atualizar responsável financeiro:",
                respError
              );
              throw respError;
            }
          } else {
            // Criar novo responsável para o processo
            const { error: respError } = await supabase
              .from("responsavel_financeiro")
              .insert([
                {
                  user_id: user.id,
                  nome: responsavelData.nome,
                  rg: removeMask(responsavelData.rg),
                  cpf: removeMask(responsavelData.cpf),
                  data_nascimento: responsavelData.data_nascimento,
                  telefone: removeMask(responsavelData.telefone),
                  email: responsavelData.email,
                  endereco_completo: responsavelData.endereco_completo,
                  cep: removeMask(responsavelData.cep),
                  processo_id: processoId, // Vincular ao processo específico
                },
              ]);

            if (respError) {
              console.error(
                "Erro ao salvar responsável financeiro:",
                respError
              );
              throw respError;
            }
          }
          console.log("✅ Responsável financeiro atualizado com sucesso");
        }

        toast({
          title: "Processo atualizado!",
          description: "Os dados do processo foram atualizados com sucesso.",
        });

        // Atualizar dados do cliente
        const { error: clienteError } = await supabase
          .from("clientes")
          .update({
            nome: clienteData.nomeCompleto,
            rg: removeMask(clienteData.rg), // <--- ADICIONE ESTA LINHA AQUI
            email: clienteData.email,
            telefone: clienteData.telefone,
            cpf_cnpj: removeMask(clienteData.cpf),
            endereco: `${clienteData.endereco}, ${clienteData.bairro}, ${clienteData.cidade} - ${clienteData.cep}`,
          })
          .eq("id", processoExistente.cliente_id);

        if (clienteError) throw clienteError;

        // Atualizar dados do processo
        const { error: processoError } = await supabase
          .from("processos")
          .update({
            numero_processo: processoData.numeroProcesso,
            tipo_processo: processoData.tipoProcesso,
            prazo: processoData.temPrazo ? processoData.prazo : null,
            cliente_preso: processoData.clientePreso,
          })
          .eq("id", processoId);

        if (processoError) throw processoError;

        // Sistema GLOBAL: Limpar observações do processo
        const { error: deleteObsError } = await supabase
          .from("observacoes_processo")
          .delete()
          .eq("processo_id", processoId);

        if (deleteObsError)
          console.error("Erro ao limpar observações:", deleteObsError);

        // Sistema GLOBAL: Limpar documentos do processo
        const { error: deleteDocsError } = await supabase
          .from("documentos_processo")
          .delete()
          .eq("processo_id", processoId);

        if (deleteDocsError)
          console.error("Erro ao limpar documentos:", deleteDocsError);

        toast({
          title: "Processo atualizado!",
          description: "Os dados do processo foram atualizados com sucesso.",
        });
      } else {
        // MODO DE CRIAÇÃO - Criar novos registros
        console.log("=== CRIANDO CLIENTE ===");
        const { data: clienteCreated, error: clienteError } = await supabase
          .from("clientes")
          .insert([
            {
              user_id: user.id,
              nome: clienteData.nomeCompleto,
              rg: removeMask(clienteData.rg), // <--- ADICIONE ESTA LINHA
              email: clienteData.email,
              telefone: clienteData.telefone,
              cpf_cnpj: removeMask(clienteData.cpf),
              endereco: `${clienteData.endereco}, ${clienteData.bairro}, ${clienteData.cidade} - ${clienteData.cep}`,
            },
          ])
          .select()
          .single();

        if (clienteError) {
          console.error("Erro ao criar cliente:", clienteError);
          throw clienteError;
        }

        console.log("Cliente criado com sucesso:", clienteCreated);
        clienteId = clienteCreated.id;

        console.log("=== CRIANDO PROCESSO ===");
        const { data: processoCreated, error: processoError } = await supabase
          .from("processos")
          .insert([
            {
              user_id: user.id,
              numero_processo: processoData.numeroProcesso,
              cliente_id: clienteCreated.id,
              tipo_processo: processoData.tipoProcesso,
              prazo: processoData.temPrazo ? processoData.prazo : null,
              cliente_preso: processoData.clientePreso,
              status: "ATIVO",
            },
          ])
          .select()
          .single();

        if (processoError) {
          console.error("Erro ao criar processo:", processoError);
          throw processoError;
        }

        console.log("Processo criado com sucesso:", processoCreated);
        processoCreatedId = processoCreated.id;

        console.log("=== CRIANDO REGISTROS FINANCEIROS ===");
        try {
          if (financeiroData.valorHonorarios) {
            const valorHonorarios = parseCurrency(
              financeiroData.valorHonorarios
            );
            const valorEntrada = parseCurrency(
              financeiroData.valorEntrada || "0"
            );
            const quantidadeParcelas = parseInt(
              financeiroData.quantidadeParcelas || "1"
            );

            console.log("Valores financeiros:", {
              valorHonorarios,
              valorEntrada,
              quantidadeParcelas,
            });

            if (valorEntrada > 0 && financeiroData.dataEntrada) {
              console.log("Criando entrada...");
              const { error: entradaError } = await supabase
                .from("financeiro")
                .insert([
                  {
                    user_id: user.id,
                    cliente_nome: clienteData.nomeCompleto,
                    processo_id: processoCreatedId,
                    valor: valorEntrada,
                    tipo: "Entrada",
                    status: "PENDENTE",
                    vencimento: financeiroData.dataEntrada,
                  },
                ]);

              if (entradaError) {
                console.error("Erro ao criar entrada:", entradaError);
                throw entradaError;
              }
              console.log("Entrada criada com sucesso");
            }

            const valorRestante = valorHonorarios - valorEntrada;
            const valorParcela = valorRestante / quantidadeParcelas;

            if (financeiroData.dataPrimeiroVencimento) {
              const dataBase = new Date(financeiroData.dataPrimeiroVencimento);

              console.log("Criando parcelas de honorários...", {
                valorRestante,
                valorParcela,
              });

              for (let i = 0; i < quantidadeParcelas; i++) {
                const dataVencimento = new Date(dataBase);
                dataVencimento.setMonth(dataVencimento.getMonth() + i);

                const { error: parcelaError } = await supabase
                  .from("financeiro")
                  .insert([
                    {
                      user_id: user.id,
                      cliente_nome: clienteData.nomeCompleto,
                      valor: valorParcela,
                      processo_id: processoCreatedId,
                      tipo: "Honorários",
                      status: "PENDENTE",
                      vencimento: dataVencimento.toISOString(),
                    },
                  ]);

                if (parcelaError) {
                  console.error(
                    `Erro ao criar parcela ${i + 1}:`,
                    parcelaError
                  );
                  throw parcelaError;
                }
              }
              console.log("Parcelas de honorários criadas com sucesso");
            }

            if (
              financeiroData.incluirTMP &&
              financeiroData.valorTMP &&
              financeiroData.vencimentoTMP
            ) {
              console.log("Criando parcelas de TMP...");
              const valorTMP = parseCurrency(financeiroData.valorTMP);
              const quantidadeMesesTMP = parseInt(
                financeiroData.quantidadeMesesTMP || "1"
              );
              const dataBaseTMP = new Date(financeiroData.vencimentoTMP);

              for (let i = 0; i < quantidadeMesesTMP; i++) {
                const dataVencimentoTMP = new Date(dataBaseTMP);
                dataVencimentoTMP.setMonth(dataVencimentoTMP.getMonth() + i);

                const { error: tmpError } = await supabase
                  .from("financeiro")
                  .insert([
                    {
                      user_id: user.id,
                      cliente_nome: clienteData.nomeCompleto,
                      processo_id: processoCreatedId,
                      valor: valorTMP,
                      tipo: "TMP",
                      status: "PENDENTE",
                      vencimento: dataVencimentoTMP.toISOString(),
                    },
                  ]);

                if (tmpError) {
                  console.error(`Erro ao criar TMP ${i + 1}:`, tmpError);
                  throw tmpError;
                }
              }
              console.log("Parcelas de TMP criadas com sucesso");
            }
          }
        } catch (financeError) {
          console.error("Erro específico na criação financeira:", financeError);
          throw financeError;
        }

        console.log("=== SALVANDO RESPONSÁVEL FINANCEIRO ===");
        if (responsavelData.nome && responsavelData.cpf) {
          if (isEditMode && responsavelId) {
            // Atualizar responsável existente
            const { error: respError } = await supabase
              .from("responsavel_financeiro")
              .update({
                nome: responsavelData.nome,
                rg: removeMask(responsavelData.rg),
                cpf: removeMask(responsavelData.cpf),
                data_nascimento: responsavelData.data_nascimento,
                telefone: removeMask(responsavelData.telefone),
                email: responsavelData.email,
                endereco_completo: responsavelData.endereco_completo,
                cep: removeMask(responsavelData.cep),
                processo_id: processoCreatedId, // Vincular ao processo
              })
              .eq("id", responsavelId);

            if (respError) {
              console.error(
                "Erro ao atualizar responsável financeiro:",
                respError
              );
              throw respError;
            }
          } else {
            // Criar novo responsável
            const { error: respError } = await supabase
              .from("responsavel_financeiro")
              .insert([
                {
                  user_id: user.id,
                  nome: responsavelData.nome,
                  rg: removeMask(responsavelData.rg),
                  cpf: removeMask(responsavelData.cpf),
                  data_nascimento: responsavelData.data_nascimento,
                  telefone: removeMask(responsavelData.telefone),
                  email: responsavelData.email,
                  endereco_completo: responsavelData.endereco_completo,
                  cep: removeMask(responsavelData.cep),
                  processo_id: processoCreatedId, // Vincular ao processo
                },
              ]);

            if (respError) {
              console.error(
                "Erro ao salvar responsável financeiro:",
                respError
              );
              throw respError;
            }
          }
          console.log("✅ Responsável financeiro salvo com sucesso");
        }
        toast({
          title: "Processo criado!",
          description: "O processo foi cadastrado com sucesso.",
        });
      }

      // SALVAR OBSERVAÇÕES (para ambos os modos)
      console.log("=== SALVANDO OBSERVAÇÕES ===");
      if (observacoes.length > 0 && processoCreatedId) {
        for (const observacao of observacoes) {
          // Inserir nova observação (não tentar atualizar para evitar problemas com UUID)
          const { error: obsError } = await supabase
            .from("observacoes_processo")
            .insert([
              {
                user_id: user.id,
                processo_id: processoCreatedId,
                cliente_nome: clienteData.nomeCompleto,
                titulo: observacao.titulo,
                conteudo: observacao.conteudo,
              },
            ]);

          if (obsError) {
            console.error("Erro ao salvar observação:", obsError);
            throw obsError;
          }
        }
        console.log("Observações salvas com sucesso");
      }

      // SALVAR DOCUMENTOS (para ambos os modos)
      console.log("=== VINCULANDO DOCUMENTOS ===");
      if (documentos.length > 0 && processoCreatedId) {
        for (const documento of documentos) {
          // Apenas atualiza o processo_id dos documentos que já foram enviados pelo DocumentUpload
          const { error: docError } = await supabase
            .from("documentos_processo")
            .update({
              processo_id: processoCreatedId,
              cliente_nome: clienteData.nomeCompleto, // Garante que o nome esteja correto
            })
            .eq("id", documento.id);

          if (docError) {
            console.error("Erro ao vincular documento:", docError);
            throw docError;
          }
        }
        console.log("Documentos vinculados com sucesso");
      }

      // LIMPEZA DO RASCUNHO CORRETA
      const storageKey = getStorageKey(processoId, isEditMode);
      localStorage.removeItem(storageKey); // Remove o rascunho específico

      Swal.fire({
        title: "Sucesso!",
        text: "Processo salvo com sucesso. Redirecionando para o dashboard...",
        icon: "success",
        timer: 2000, // Display for 2 seconds
        timerProgressBar: true, // Show a progress bar
        showConfirmButton: false, // Hide the confirm button
        willClose: () => {
          navigate("/dashboard"); // Redirect when the popup closes
        },
      });
    } catch (error: any) {
      console.error("=== ERRO GERAL ===", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar processo",
        description: error.message || "Erro desconhecido ao salvar o processo",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <User className="w-16 h-16 text-primary mx-auto" />
        </div>
        <CardTitle className="text-2xl">Dados do Cliente</CardTitle>
        <p className="text-muted-foreground">Informações pessoais do cliente</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="nomeCompleto">Nome Completo *</Label>
          <Input
            id="nomeCompleto"
            value={clienteData.nomeCompleto}
            onChange={(e) =>
              setClienteData({ ...clienteData, nomeCompleto: e.target.value })
            }
            placeholder="Nome completo do cliente"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="rg">RG</Label>
            <Input
              id="rg"
              value={clienteData.rg}
              onChange={(e) => handleRgChange(e.target.value)}
              placeholder="Número do RG"
              maxLength={12}
            />
          </div>

          <div>
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={clienteData.cpf}
              onChange={(e) => handleCpfChange(e.target.value)}
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="dataNascimento">Data de Nascimento</Label>
            <Input
              id="dataNascimento"
              type="date"
              value={clienteData.dataNascimento}
              onChange={(e) =>
                setClienteData({
                  ...clienteData,
                  dataNascimento: e.target.value,
                })
              }
            />
          </div>

          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={clienteData.telefone}
              onChange={(e) => handleTelefoneChange(e.target.value)}
              placeholder="(00) 00000-0000"
              maxLength={15}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={clienteData.email}
            onChange={(e) =>
              setClienteData({ ...clienteData, email: e.target.value })
            }
            placeholder="email@cliente.com"
          />
        </div>

        <div>
          <Label htmlFor="endereco">Endereço</Label>
          <Input
            id="endereco"
            value={clienteData.endereco}
            onChange={(e) =>
              setClienteData({ ...clienteData, endereco: e.target.value })
            }
            placeholder="Rua, número, complemento"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="bairro">Bairro</Label>
            <Input
              id="bairro"
              value={clienteData.bairro}
              onChange={(e) =>
                setClienteData({ ...clienteData, bairro: e.target.value })
              }
              placeholder="Bairro"
            />
          </div>

          <div>
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              value={clienteData.cidade}
              onChange={(e) =>
                setClienteData({ ...clienteData, cidade: e.target.value })
              }
              placeholder="Cidade"
            />
          </div>
        </div>

        <div className="w-1/2">
          <Label htmlFor="cep">CEP</Label>
          <Input
            id="cep"
            value={clienteData.cep}
            onChange={(e) => handleCepChange(e.target.value)}
            placeholder="00000-000"
            maxLength={9}
          />
        </div>

        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleNextStep}
            className="bg-primary hover:bg-primary/90"
          >
            Próximo
            <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <FileText className="w-16 h-16 text-primary mx-auto" />
        </div>
        <CardTitle className="text-2xl">Dados do Processo</CardTitle>
        <p className="text-muted-foreground">
          Informações sobre o processo judicial
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="numeroProcesso">Número do Processo *</Label>
          <Input
            id="numeroProcesso"
            value={processoData.numeroProcesso}
            onChange={(e) => handleNumeroProcessoChange(e.target.value)}
            placeholder="0000000-00.0000.0.00.0000"
            required
          />
        </div>

        <div>
          <Label htmlFor="tipoProcesso">Tipo do Processo *</Label>
          <Select
            value={processoData.tipoProcesso}
            onValueChange={(value) =>
              setProcessoData({ ...processoData, tipoProcesso: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {tiposProcesso.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {processoData.tipoProcesso === "Criminal" && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="clientePreso"
              checked={processoData.clientePreso}
              onCheckedChange={(checked) =>
                setProcessoData({ ...processoData, clientePreso: checked as boolean })
              }
            />
            <Label htmlFor="clientePreso">Cliente Preso</Label>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Checkbox
            id="temPrazo"
            checked={processoData.temPrazo}
            onCheckedChange={(checked) =>
              setProcessoData({ ...processoData, temPrazo: checked as boolean })
            }
          />
          <Label htmlFor="temPrazo">Este processo tem prazo</Label>
        </div>

        {processoData.temPrazo && (
          <div>
            <Label htmlFor="prazo">Data do Prazo</Label>
            <Input
              id="prazo"
              type="date"
              value={processoData.prazo}
              onChange={(e) =>
                setProcessoData({ ...processoData, prazo: e.target.value })
              }
            />
          </div>
        )}

        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={handlePrevStep}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          <Button
            onClick={handleNextStep}
            className="bg-primary hover:bg-primary/90"
          >
            Próximo
            <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => {
    const handleCurrencyChange = (field: string, value: string) => {
      const cleanValue = value.replace(/[^\d,]/g, "").replace(",", ".");
      const formattedValue = formatCurrencyInput(value);
      setFinanceiroData({ ...financeiroData, [field]: formattedValue });
    };

    const calcularResumo = () => {
      if (!financeiroData.valorHonorarios) {
        return {
          valorRestante: 0,
          valorParcela: 0,
          totalHonorarios: 0,
        };
      }

      const honorarios = parseCurrency(financeiroData.valorHonorarios);
      const entrada = parseCurrency(financeiroData.valorEntrada || "0");
      const parcelas = parseInt(financeiroData.quantidadeParcelas || "1");

      const valorRestante = honorarios - entrada;
      const valorParcela = valorRestante / parcelas;

      return {
        valorRestante,
        valorParcela,
        totalHonorarios: honorarios,
      };
    };

    const resumo = calcularResumo();

    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <DollarSign className="w-16 h-16 text-primary mx-auto" />
          </div>
          <CardTitle className="text-2xl">Configuração Financeira</CardTitle>
          <p className="text-muted-foreground">
            Configure os valores e formas de pagamento
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="valorHonorarios">Valor dos Honorários *</Label>
            <Input
              id="valorHonorarios"
              value={financeiroData.valorHonorarios}
              onChange={(e) =>
                handleCurrencyChange("valorHonorarios", e.target.value)
              }
              placeholder="R$ 0,00"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="valorEntrada">Valor da Entrada</Label>
              <Input
                id="valorEntrada"
                value={financeiroData.valorEntrada}
                onChange={(e) =>
                  handleCurrencyChange("valorEntrada", e.target.value)
                }
                placeholder="R$ 0,00"
              />
            </div>

            <div>
              <Label htmlFor="dataEntrada">Data da Entrada</Label>
              <Input
                id="dataEntrada"
                type="date"
                value={financeiroData.dataEntrada}
                onChange={(e) =>
                  setFinanceiroData({
                    ...financeiroData,
                    dataEntrada: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="quantidadeParcelas">Quantidade de Parcelas</Label>
              <Input
                id="quantidadeParcelas"
                type="number"
                min="1"
                value={financeiroData.quantidadeParcelas}
                onChange={(e) =>
                  setFinanceiroData({
                    ...financeiroData,
                    quantidadeParcelas: e.target.value,
                  })
                }
                placeholder="Ex: 12"
              />
            </div>

            <div>
              <Label htmlFor="dataPrimeiroVencimento">
                Data do Primeiro Vencimento
              </Label>
              <Input
                id="dataPrimeiroVencimento"
                type="date"
                value={financeiroData.dataPrimeiroVencimento}
                onChange={(e) =>
                  setFinanceiroData({
                    ...financeiroData,
                    dataPrimeiroVencimento: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {/* Resumo do parcelamento */}
          {financeiroData.valorHonorarios &&
            financeiroData.quantidadeParcelas && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Resumo do Parcelamento:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total dos Honorários:</span>
                    <span className="font-medium">
                      {financeiroData.valorHonorarios}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor da Entrada:</span>
                    <span className="font-medium">
                      {financeiroData.valorEntrada || "R$ 0,00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor a Parcelar:</span>
                    <span className="font-medium">
                      {formatCurrency(resumo.valorRestante)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor por Parcela:</span>
                    <span className="font-medium">
                      {formatCurrency(resumo.valorParcela)}
                    </span>
                  </div>
                </div>
              </div>
            )}

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="incluirTMP"
                checked={financeiroData.incluirTMP}
                onCheckedChange={(checked) =>
                  setFinanceiroData({
                    ...financeiroData,
                    incluirTMP: checked as boolean,
                  })
                }
              />
              <Label htmlFor="incluirTMP">
                Incluir TMP (Taxa de Manutenção Processual)
              </Label>
            </div>

            {financeiroData.incluirTMP && (
              <div className="bg-muted p-4 rounded-lg space-y-4">
                <h4 className="font-medium">Configuração da TMP:</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="valorTMP">Valor da TMP *</Label>
                    <Input
                      id="valorTMP"
                      value={financeiroData.valorTMP}
                      onChange={(e) =>
                        handleCurrencyChange("valorTMP", e.target.value)
                      }
                      placeholder="R$ 0,00"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="vencimentoTMP">
                      Primeiro Vencimento da TMP *
                    </Label>
                    <Input
                      id="vencimentoTMP"
                      type="date"
                      value={financeiroData.vencimentoTMP}
                      onChange={(e) =>
                        setFinanceiroData({
                          ...financeiroData,
                          vencimentoTMP: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="quantidadeMesesTMP">
                    Quantidade de Meses da TMP *
                  </Label>
                  <Input
                    id="quantidadeMesesTMP"
                    type="number"
                    min="1"
                    value={financeiroData.quantidadeMesesTMP}
                    onChange={(e) =>
                      setFinanceiroData({
                        ...financeiroData,
                        quantidadeMesesTMP: e.target.value,
                      })
                    }
                    placeholder="Ex: 12"
                    required
                  />
                </div>

                {financeiroData.valorTMP &&
                  financeiroData.quantidadeMesesTMP && (
                    <div className="bg-background p-3 rounded border">
                      <p className="text-sm">
                        <span className="font-medium">Total TMP:</span>{" "}
                        {formatCurrency(
                          parseCurrency(financeiroData.valorTMP) *
                          parseInt(financeiroData.quantidadeMesesTMP)
                        )}
                        <br />
                        <span className="font-medium">Valor Mensal:</span>{" "}
                        {financeiroData.valorTMP}
                        <br />
                        <span className="font-medium">Duração:</span>{" "}
                        {financeiroData.quantidadeMesesTMP} meses
                      </p>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Seção do Responsável Financeiro */}
          <div className="space-y-4">
            <h4 className="font-medium text-lg border-t pt-6">
              Responsável Financeiro
            </h4>
            <p className="text-sm text-muted-foreground">
              Cadastre os dados da pessoa responsável pelo financeiro
            </p>

            <div className="bg-muted p-4 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="responsavelNome">Nome Completo *</Label>
                  <Input
                    id="responsavelNome"
                    value={responsavelData.nome}
                    onChange={(e) =>
                      setResponsavelData({
                        ...responsavelData,
                        nome: e.target.value,
                      })
                    }
                    placeholder="Digite o nome completo"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="responsavelRG">RG *</Label>
                  <Input
                    id="responsavelRG"
                    value={responsavelData.rg}
                    onChange={(e) => handleResponsavelRgChange(e.target.value)}
                    placeholder="Digite o RG"
                    maxLength={12}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="responsavelCPF">CPF *</Label>
                  <Input
                    id="responsavelCPF"
                    value={responsavelData.cpf}
                    onChange={(e) => handleResponsavelCpfChange(e.target.value)}
                    placeholder="Digite o CPF"
                    maxLength={14}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="responsavelDataNascimento">
                    Data de Nascimento *
                  </Label>
                  <Input
                    id="responsavelDataNascimento"
                    type="date"
                    value={responsavelData.data_nascimento}
                    onChange={(e) =>
                      setResponsavelData({
                        ...responsavelData,
                        data_nascimento: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="responsavelTelefone">Telefone *</Label>
                  <Input
                    id="responsavelTelefone"
                    value={responsavelData.telefone}
                    onChange={(e) =>
                      handleResponsavelTelefoneChange(e.target.value)
                    }
                    placeholder="Digite o telefone"
                    maxLength={15}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="responsavelEmail">E-mail *</Label>
                  <Input
                    id="responsavelEmail"
                    type="email"
                    value={responsavelData.email}
                    onChange={(e) =>
                      setResponsavelData({
                        ...responsavelData,
                        email: e.target.value,
                      })
                    }
                    placeholder="Digite o e-mail"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="responsavelCEP">CEP *</Label>
                  <Input
                    id="responsavelCEP"
                    value={responsavelData.cep}
                    onChange={(e) => handleResponsavelCepChange(e.target.value)}
                    placeholder="Digite o CEP"
                    maxLength={9}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="responsavelEndereco">Endereço Completo *</Label>
                <Textarea
                  id="responsavelEndereco"
                  value={responsavelData.endereco_completo}
                  onChange={(e) =>
                    setResponsavelData({
                      ...responsavelData,
                      endereco_completo: e.target.value,
                    })
                  }
                  placeholder="Digite o endereço completo"
                  rows={3}
                  required
                />
              </div>
            </div>
          </div>

          {/* Preview das Parcelas */}
          {financeiroData.valorHonorarios &&
            financeiroData.quantidadeParcelas &&
            financeiroData.dataPrimeiroVencimento && (
              <div className="space-y-4">
                <h4 className="font-medium text-lg">Preview das Parcelas</h4>

                {/* Entrada */}
                {financeiroData.valorEntrada && financeiroData.dataEntrada && (
                  <div className="bg-background p-4 rounded-lg border">
                    <h5 className="font-medium mb-3 text-green-700">Entrada</h5>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm py-2 border-b border-muted">
                      <div>
                        <span className="font-medium">Valor:</span>
                        <p className="text-green-600 font-semibold">
                          {financeiroData.valorEntrada}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Vencimento:</span>
                        <p>
                          {new Date(
                            financeiroData.dataEntrada
                          ).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>
                        <p className="text-orange-600">Pendente</p>
                      </div>
                      <div>
                        <Button size="sm" disabled className="opacity-50">
                          Dar Baixa
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">
                          Disponível após salvar
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Honorários */}
                <div className="bg-background p-4 rounded-lg border">
                  <h5 className="font-medium mb-3 text-blue-700">
                    Honorários ({financeiroData.quantidadeParcelas} parcelas)
                  </h5>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {Array.from(
                      { length: parseInt(financeiroData.quantidadeParcelas) },
                      (_, index) => {
                        const dataBase = new Date(
                          financeiroData.dataPrimeiroVencimento
                        );
                        const dataVencimento = new Date(dataBase);
                        dataVencimento.setMonth(
                          dataVencimento.getMonth() + index
                        );

                        return (
                          <div
                            key={index}
                            className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm py-2 border-b border-muted"
                          >
                            <div>
                              <span className="font-medium">
                                Parcela {index + 1}:
                              </span>
                              <p className="text-blue-600 font-semibold">
                                {formatCurrency(resumo.valorParcela)}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium">Vencimento:</span>
                              <p>
                                {dataVencimento.toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium">Status:</span>
                              <p className="text-orange-600">Pendente</p>
                            </div>
                            <div>
                              <Button size="sm" disabled className="opacity-50">
                                Dar Baixa
                              </Button>
                              <p className="text-xs text-muted-foreground mt-1">
                                Disponível após salvar
                              </p>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* TMP */}
                {financeiroData.incluirTMP &&
                  financeiroData.valorTMP &&
                  financeiroData.quantidadeMesesTMP &&
                  financeiroData.vencimentoTMP && (
                    <div className="bg-background p-4 rounded-lg border">
                      <h5 className="font-medium mb-3 text-orange-700">
                        TMP - Taxa de Manutenção Processual (
                        {financeiroData.quantidadeMesesTMP} parcelas)
                      </h5>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {Array.from(
                          {
                            length: parseInt(financeiroData.quantidadeMesesTMP),
                          },
                          (_, index) => {
                            const dataBase = new Date(
                              financeiroData.vencimentoTMP
                            );
                            const dataVencimento = new Date(dataBase);
                            dataVencimento.setMonth(
                              dataVencimento.getMonth() + index
                            );

                            return (
                              <div
                                key={index}
                                className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm py-2 border-b border-muted"
                              >
                                <div>
                                  <span className="font-medium">
                                    TMP {index + 1}:
                                  </span>
                                  <p className="text-orange-600 font-semibold">
                                    {financeiroData.valorTMP}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium">
                                    Vencimento:
                                  </span>
                                  <p>
                                    {dataVencimento.toLocaleDateString("pt-BR")}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium">Status:</span>
                                  <p className="text-orange-600">Pendente</p>
                                </div>
                                <div>
                                  <Button
                                    size="sm"
                                    disabled
                                    className="opacity-50"
                                  >
                                    Dar Baixa
                                  </Button>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Disponível após salvar
                                  </p>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}

                {/* Resumo Total */}
                <div className="bg-muted p-4 rounded-lg">
                  <h5 className="font-medium mb-3">Resumo Total</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p>
                        <span className="font-medium">Total de Parcelas:</span>{" "}
                        {(financeiroData.valorEntrada ? 1 : 0) +
                          parseInt(financeiroData.quantidadeParcelas || "0") +
                          (financeiroData.incluirTMP
                            ? parseInt(financeiroData.quantidadeMesesTMP || "0")
                            : 0)}
                      </p>
                      <p>
                        <span className="font-medium">
                          Valor Total dos Honorários:
                        </span>{" "}
                        {financeiroData.valorHonorarios}
                      </p>
                      {financeiroData.incluirTMP && (
                        <p>
                          <span className="font-medium">
                            Valor Total da TMP:
                          </span>{" "}
                          {formatCurrency(
                            parseCurrency(financeiroData.valorTMP) *
                            parseInt(financeiroData.quantidadeMesesTMP)
                          )}
                        </p>
                      )}
                    </div>
                    <div>
                      <p>
                        <span className="font-medium">Valor Total Geral:</span>{" "}
                        {formatCurrency(
                          parseCurrency(financeiroData.valorHonorarios) +
                          (financeiroData.incluirTMP
                            ? parseCurrency(financeiroData.valorTMP) *
                            parseInt(financeiroData.quantidadeMesesTMP)
                            : 0)
                        )}
                      </p>
                      <p className="text-muted-foreground text-xs mt-2">
                        Após salvar o processo, você poderá gerenciar e dar
                        baixa nestas parcelas na seção Financeiro
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={handlePrevStep}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            <Button
              onClick={handleNextStep}
              className="bg-primary hover:bg-primary/90"
            >
              Próximo
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderStep4 = () => (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <StickyNote className="w-16 h-16 text-primary mx-auto" />
        </div>
        <CardTitle className="text-2xl">Documentos e Observações</CardTitle>
        <p className="text-muted-foreground">
          Anexe documentos e adicione observações importantes
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload de Documentos */}
        <DocumentUpload
          clienteNome={clienteData.nomeCompleto}
          documentos={documentos}
          onDocumentosChange={setDocumentos}
        />

        {/* Observações */}
        <ProcessNotes
          clienteNome={clienteData.nomeCompleto}
          observacoes={observacoes}
          onObservacoesChange={setObservacoes}
        />

        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={handlePrevStep}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-primary hover:bg-primary/90"
          >
            {loading
              ? "Salvando..."
              : isEditMode
                ? "Atualizar Processo"
                : "Finalizar Cadastro"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditMode ? "Editar Processo" : "Novo Processo"}
          </h1>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
                }`}
            >
              1
            </div>
            <div
              className={`w-16 h-1 ${currentStep >= 2 ? "bg-primary" : "bg-muted"
                }`}
            ></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
                }`}
            >
              2
            </div>
            <div
              className={`w-16 h-1 ${currentStep >= 3 ? "bg-primary" : "bg-muted"
                }`}
            ></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
                }`}
            >
              3
            </div>
            <div
              className={`w-16 h-1 ${currentStep >= 4 ? "bg-primary" : "bg-muted"
                }`}
            ></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 4
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
                }`}
            >
              4
            </div>
          </div>
        </div>

        {/* Render current step */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>
    </div>
  );
};

export default NewProcess;
