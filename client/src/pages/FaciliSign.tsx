import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import {
  Upload,
  Shield,
  Clock,
  Download,
  Eye,
  Users,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  Trash2,
  ArrowLeft,
  FileSignature,
  RefreshCw,
  Mail,
  MessageCircle,
  ExternalLink,
  FolderPlus,
} from "lucide-react";
import {
  useFaciliSign,
  type DocumentoFaciliSign,
  type Signatario,
} from "@/hooks/useFaciliSign.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { supabase } from "@/integrations/supabase/client.ts";

const FaciliSign = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentoFaciliSign[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [usePdfUrl, setUsePdfUrl] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [sendWhatsapp, setSendWhatsapp] = useState(false);
  const [ordemAssinatura, setOrdemAssinatura] = useState(false); // OneClick: signature order
  const [signatarios, setSignatarios] = useState<Signatario[]>([
    {
      nome: "",
      email: "",
      telefone: "",
      cpf: "",
      qualificacao: "parte",
      enviarEmail: false, // Default: sistema envia email customizado
      enviarWhatsApp: false
    },
  ]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [refreshingDoc, setRefreshingDoc] = useState<string | null>(null);
  const [selectedSigners, setSelectedSigners] = useState<Record<string, string[]>>({});
  const [resendingDoc, setResendingDoc] = useState<string | null>(null);


  const {
    uploadAndCreateDocument,
    createDocumentFromUrl,
    getDocuments,
    refreshDocumentStatus,
    deleteDocument,
    getStatusBadgeColor,
    getStatusLabel,
    loading,
    uploading,
  } = useFaciliSign();
  const { toast } = useToast();

  const loadDocuments = useCallback(async () => {
    const result = await getDocuments(currentPage, pageSize);
    setDocuments(result.documents);
    setTotalPages(result.totalPages);
  }, [getDocuments, currentPage, pageSize]);

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (!session || error) {
        navigate("/login");
        return;
      }
      await loadDocuments();
    };

    checkAuthAndLoadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, currentPage]); // Removido loadDocuments para evitar loop

  const getStats = () => {
    const assinados = documents.filter(
      (doc) => doc.status === "signed"
    ).length;
    const pendentes = documents.filter(
      (doc) => doc.status === "pending"
    ).length;
    const total = documents.length;

    return [
      {
        title: "Documentos Assinados",
        value: assinados.toString(),
        icon: FileSignature,
        color: "text-green-600",
      },
      {
        title: "Pendentes",
        value: pendentes.toString(),
        icon: Clock,
        color: "text-yellow-600",
      },
      {
        title: "Total de Documentos",
        value: total.toString(),
        icon: Shield,
        color: "text-blue-600",
      },
    ];
  };

  const stats = getStats();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "signed":
        return CheckCircle;
      case "pending":
        return Clock;
      case "expired":
        return AlertCircle;
      case "refused":
        return XCircle;
      default:
        return Clock;
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setDocumentTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const addSignatario = () => {
    setSignatarios([...signatarios, {
      nome: "",
      email: "",
      telefone: "",
      cpf: "",
      qualificacao: "parte",
      enviarEmail: false,
      enviarWhatsApp: false
    }]);
  };

  const removeSignatario = (index: number) => {
    if (signatarios.length > 1) {
      setSignatarios(signatarios.filter((_, i) => i !== index));
    }
  };

  const updateSignatario = (
    index: number,
    field: keyof Signatario,
    value: string | boolean
  ) => {
    const updated = [...signatarios];
    (updated[index] as any)[field] = value === "true" ? true : value === "false" ? false : value;
    setSignatarios(updated);
  };

  const resetForm = () => {
    setShowUploadDialog(false);
    setSelectedFile(null);
    setDocumentTitle("");
    setPdfUrl("");
    setUsePdfUrl(false);
    setSendEmail(true);
    setSendWhatsapp(false);
    setOrdemAssinatura(false);
    setSignatarios([{
      nome: "",
      email: "",
      telefone: "",
      cpf: "",
      qualificacao: "parte",
      enviarEmail: false,
      enviarWhatsApp: false
    }]);
  };

  const handleSubmit = async () => {
    if (!documentTitle.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Titulo do documento e obrigatorio.",
      });
      return;
    }

    const validSignatarios = signatarios.filter(
      (sig) => sig.nome.trim() && sig.email.trim()
    );

    if (validSignatarios.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Adicione pelo menos um signatario com nome e email.",
      });
      return;
    }

    if (!usePdfUrl && !selectedFile) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um arquivo PDF ou informe uma URL.",
      });
      return;
    }

    if (usePdfUrl && !pdfUrl.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Informe a URL do PDF.",
      });
      return;
    }

    try {
      const options = {
        sendEmail: true, // Sempre true - ZapSign envia emails automáticos
        sendWhatsapp: false, // Sempre false
        ordemAssinatura: false, // Sempre false - sem ordem sequencial
      };

      if (usePdfUrl) {
        await createDocumentFromUrl(pdfUrl, documentTitle, validSignatarios, options);
      } else if (selectedFile) {
        await uploadAndCreateDocument(selectedFile, documentTitle, validSignatarios, options);
      }

      resetForm();
      await loadDocuments();
    } catch (error: any) {
      console.error("Erro ao enviar documento:", error);
    }
  };

  const handleRefreshStatus = async (token: string) => {
    setRefreshingDoc(token);
    try {
      await refreshDocumentStatus(token);
      await loadDocuments();
      toast({
        title: "Status atualizado",
        description: "Status do documento atualizado com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao atualizar status do documento.",
      });
    } finally {
      setRefreshingDoc(null);
    }
  };

  const handleDelete = async (doc: DocumentoFaciliSign) => {
    const result = await Swal.fire({
      title: "Excluir documento?",
      text: "Esta acao nao pode ser desfeita.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sim, excluir",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      const success = await deleteDocument(doc.zapsign_token);
      if (success) {
        await loadDocuments();
      }
    }
  };

  const handleViewDocument = async (doc: DocumentoFaciliSign) => {
    if (!doc.zapsign_token) {
      toast({
        title: "Erro",
        description: "Token do documento nao encontrado.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Buscar dados atualizados do ZapSign para obter URLs validas
      const response = await fetch(`/api/zapsign/documents/${doc.zapsign_token}`);

      if (!response.ok) {
        throw new Error("Falha ao buscar documento");
      }

      const zapsignDoc = await response.json();

      // Usar URL assinada se disponivel, senao usar original
      const viewUrl = zapsignDoc.signed_file || zapsignDoc.original_file;

      if (viewUrl) {
        window.open(viewUrl, "_blank");
      } else {
        toast({
          title: "Informacao",
          description: "Documento nao disponivel para visualizacao.",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar documento:", error);
      toast({
        title: "Erro",
        description: "Nao foi possivel obter o documento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadDocument = async (doc: DocumentoFaciliSign) => {
    if (!doc.zapsign_token) {
      toast({
        title: "Erro",
        description: "Token do documento nao encontrado.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Buscar dados atualizados do ZapSign para obter URLs validas
      const response = await fetch(`/api/zapsign/documents/${doc.zapsign_token}`);

      if (!response.ok) {
        throw new Error("Falha ao buscar documento");
      }

      const zapsignDoc = await response.json();
      const url = zapsignDoc.signed_file || zapsignDoc.original_file;

      if (url) {
        const link = document.createElement("a");
        link.href = url;
        link.download = `${doc.nome}.pdf`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast({
          title: "Informacao",
          description: "Documento nao disponivel para download.",
        });
      }
    } catch (error) {
      console.error("Erro ao baixar documento:", error);
      toast({
        title: "Erro",
        description: "Nao foi possivel baixar o documento. Tente novamente.",
        variant: "destructive",
      });
    }
  };
  // Adicionar estas funções após linha 419 (após handleDownloadDocument)

  const isFullySigned = (doc: DocumentoFaciliSign) => {
    return doc.status === "signed" && doc.signed_file_url;
  };

  const handleLinkToProcess = async (doc: DocumentoFaciliSign) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast({ variant: "destructive", title: "Erro", description: "Usuário não autenticado" });
        return;
      }

      const { data: processos, error: processosError } = await supabase
        .from("processos")
        .select("id, numero_processo, clientes(nome)")
        .order("created_at", { ascending: false })
        .limit(50);

      if (processosError || !processos || processos.length === 0) {
        toast({ variant: "destructive", title: "Erro", description: "Nenhum processo encontrado" });
        return;
      }

      const options = processos.map((p) => ({
        value: p.id,
        label: `${p.numero_processo} - ${p.clientes?.nome || "Sem cliente"}`,
      }));

      const { value: processoId } = await Swal.fire({
        title: "Vincular ao Processo",
        html: `
          <div style="text-align: left; padding: 10px;">
            <div style="position: relative; margin-bottom: 16px;">
              <svg style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #6b7280;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <input 
                type="text" 
                id="processo-search" 
                class="swal2-input" 
                placeholder="Digite o número do processo ou nome do cliente..." 
                style="
                  width: 100%; 
                  padding-left: 40px;
                  border: 2px solid #e5e7eb;
                  border-radius: 8px;
                  font-size: 14px;
                  transition: all 0.2s;
                "
                onfocus="this.style.borderColor='#6366f1'; this.style.boxShadow='0 0 0 3px rgba(99, 102, 241, 0.1)';"
                onblur="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none';"
              />
            </div>
            
            <div style="
              background: #f9fafb; 
              border-radius: 8px; 
              border: 2px solid #e5e7eb;
              overflow: hidden;
            ">
              <select 
                id="processo-select" 
                class="swal2-input" 
                size="8"
                style="
                  width: 100%; 
                  height: 280px;
                  border: none;
                  background: white;
                  font-size: 14px;
                  padding: 8px;
                  margin: 0;
                "
              >
                ${options.map(opt => `<option value="${opt.value}">📁 ${opt.label}</option>`).join("")}
              </select>
            </div>
            
            <p style="
              margin-top: 12px; 
              font-size: 12px; 
              color: #6b7280;
              display: flex;
              align-items: center;
              gap: 6px;
            ">
              <svg style="width: 14px; height: 14px;" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
              </svg>
              Dica: Clique duas vezes para selecionar rapidamente
            </p>
          </div>
        `,
        didOpen: () => {
          const searchInput = document.getElementById("processo-search") as HTMLInputElement;
          const select = document.getElementById("processo-select") as HTMLSelectElement;
          const allOptions = Array.from(select.options);

          searchInput.focus();

          const styleOptions = () => {
            Array.from(select.options).forEach((opt, index) => {
              opt.style.padding = "12px 16px";
              opt.style.margin = "4px 8px";
              opt.style.borderRadius = "6px";
              opt.style.backgroundColor = index % 2 === 0 ? "#f9fafb" : "white";
            });
          };
          styleOptions();

          select.addEventListener("mouseover", (e) => {
            const target = e.target as HTMLOptionElement;
            if (target.tagName === "OPTION" && !target.disabled) {
              target.style.backgroundColor = "#eef2ff";
              target.style.color = "#4f46e5";
              target.style.fontWeight = "500";
            }
          });

          select.addEventListener("mouseout", (e) => {
            const target = e.target as HTMLOptionElement;
            if (target.tagName === "OPTION" && !target.disabled) {
              const index = Array.from(select.options).indexOf(target);
              target.style.backgroundColor = index % 2 === 0 ? "#f9fafb" : "white";
              target.style.color = "#111827";
              target.style.fontWeight = "normal";
            }
          });

          searchInput.addEventListener("input", (e) => {
            const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
            select.innerHTML = "";

            const filtered = allOptions.filter(opt =>
              opt.text.toLowerCase().includes(searchTerm)
            );

            if (filtered.length > 0) {
              filtered.forEach(opt => select.add(opt.cloneNode(true) as HTMLOptionElement));
              styleOptions();
            } else {
              const noResult = document.createElement("option");
              noResult.text = "🔍 Nenhum processo encontrado";
              noResult.disabled = true;
              noResult.style.padding = "24px";
              noResult.style.textAlign = "center";
              noResult.style.color = "#9ca3af";
              select.add(noResult);
            }
          });

          select.addEventListener("dblclick", () => {
            if (select.value) {
              Swal.clickConfirm();
            }
          });
        },
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "✓ Vincular",
        cancelButtonText: "✕ Cancelar",
        confirmButtonColor: "#6366f1",
        cancelButtonColor: "#6b7280",
        preConfirm: () => {
          const select = document.getElementById("processo-select") as HTMLSelectElement;
          if (!select.value) {
            Swal.showValidationMessage("Por favor, selecione um processo");
            return null;
          }
          return select.value;
        },
      });

      if (!processoId) return;

      const response = await fetch(`/api/zapsign/documents/${doc.zapsign_token}/link-to-process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ processoId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao vincular documento");
      }

      const result = await response.json();
      toast({ title: "Sucesso!", description: result.message || "Documento vinculado ao processo" });

      // Atualizar documento local para mostrar processo vinculado
      setDocuments(prev => prev.map(d => {
        if (d.id === doc.id) {
          return {
            ...d,
            linked_processes: [
              ...(d.linked_processes || []),
              { id: result.processoId, numero: result.numeroProcesso }
            ]
          };
        }
        return d;
      }));
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message || "Erro ao vincular documento ao processo" });
    }
  };

  // Helper: Badge de status do signatário individual
  const getSignerStatusBadge = (status: string, signedAt?: string | null, parentDocStatus?: string) => {
    // Se documento pai está assinado, assumir que signatário também assinou
    // (dados podem estar desatualizados no banco)
    if (parentDocStatus === 'signed') {
      return (
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Assinado
          </Badge>
          {signedAt && (
            <span className="text-xs text-muted-foreground">
              {new Date(signedAt).toLocaleString('pt-BR')}
            </span>
          )}
        </div>
      );
    }

    // Caso contrário, usar status individual
    switch (status) {
      case 'signed':
        return (
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Assinado
            </Badge>
            {signedAt && (
              <span className="text-xs text-muted-foreground">
                {new Date(signedAt).toLocaleString('pt-BR')}
              </span>
            )}
          </div>
        );
      case 'new':
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'link-opened':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Eye className="w-3 h-3 mr-1" />
            Link Aberto
          </Badge>
        );
      case 'refused':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Recusado
          </Badge>
        );
      case 'link_expired':
        return (
          <Badge variant="secondary">
            <AlertCircle className="w-3 h-3 mr-1" />
            Expirado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Helper: Badge geral do documento
  const getOverallStatusBadge = (doc: DocumentoFaciliSign) => {
    // SEMPRE priorizar o status global do documento
    // (o array signatarios pode estar desatualizado no banco)

    if (doc.status === 'signed') {
      return (
        <Badge className="bg-green-600 text-white">
          <CheckCircle className="w-3 h-3 mr-1" />
          Assinado
        </Badge>
      );
    }

    if (doc.status === 'refused') {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Recusado
        </Badge>
      );
    }

    if (doc.status === 'expired') {
      return (
        <Badge variant="secondary">
          <AlertCircle className="w-3 h-3 mr-1" />
          Expirado
        </Badge>
      );
    }

    // Se status é 'pending' e tem signatários, verificar detalhes
    if (doc.signatarios && doc.signatarios.length > 0) {
      const allSigned = doc.signatarios.every((s: any) => s.status === 'signed');
      const someSigned = doc.signatarios.some((s: any) => s.status === 'signed');
      const anyRefused = doc.signatarios.some((s: any) => s.status === 'refused');

      if (allSigned) {
        return (
          <Badge className="bg-green-600 text-white">
            <CheckCircle className="w-3 h-3 mr-1" />
            Todos Assinaram
          </Badge>
        );
      }
      if (anyRefused) {
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Assinatura Recusada
          </Badge>
        );
      }
      if (someSigned) {
        return (
          <Badge className="bg-blue-500 text-white">
            <Users className="w-3 h-3 mr-1" />
            Parcialmente Assinado
          </Badge>
        );
      }
    }

    // Default: Aguardando
    return (
      <Badge className="bg-yellow-500 text-white">
        <Clock className="w-3 h-3 mr-1" />
        Aguardando Assinaturas
      </Badge>
    );
  };

  // Helper: Tem signatários pendentes?
  const hasPendingSigners = (doc: DocumentoFaciliSign) => {
    // Se documento já está assinado globalmente, não há pendentes
    if (doc.status === 'signed') return false;

    // Se não tem signatários, verificar status do documento
    if (!doc.signatarios || doc.signatarios.length === 0) {
      return doc.status === 'pending';
    }

    // Se tem signatários, verificar se algum está pendente
    // Status válidos: new, pending, link-opened
    return doc.signatarios.some((s: any) =>
      s.status === 'new' || s.status === 'pending' || s.status === 'link-opened'
    );
  };
  // Adicionar APÓS a função hasPendingSigners() (linha ~712) e ANTES do return (

  // Handler: Toggle seleção de signatário
  const toggleSignerSelection = (docId: string, email: string, checked: boolean) => {
    setSelectedSigners(prev => {
      const current = prev[docId] || [];
      if (checked) {
        return { ...prev, [docId]: [...current, email] };
      } else {
        return { ...prev, [docId]: current.filter(e => e !== email) };
      }
    });
  };

  // Handler: Reenviar emails para signatários selecionados
  const handleResendEmails = async (doc: DocumentoFaciliSign) => {
    const emails = selectedSigners[doc.id];

    if (!emails || emails.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione ao menos um signatário",
      });
      return;
    }

    setResendingDoc(doc.id);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Usuário não autenticado",
        });
        return;
      }

      const response = await fetch(`/api/zapsign/documents/${doc.zapsign_token}/resend-emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ signerEmails: emails }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao reenviar emails");
      }

      const result = await response.json();

      toast({
        title: "Emails Reenviados!",
        description: `${result.emailsSent} email(s) enviado(s) com sucesso`,
      });

      // Limpar seleção
      setSelectedSigners(prev => ({ ...prev, [doc.id]: [] }));

    } catch (error: any) {
      console.error("Error resending emails:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao reenviar emails",
      });
    } finally {
      setResendingDoc(null);
    }
  };

  // Handler: Deletar Documento
  const handleDeleteDocument = async (doc: DocumentoFaciliSign) => {
    const result = await Swal.fire({
      title: "Deletar Documento?",
      html: `
        <p>Tem certeza que deseja deletar:</p>
        <p class="font-semibold text-lg mt-2">${doc.nome}</p>
        <p class="text-sm text-gray-500 mt-2">Esta ação não pode ser desfeita.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sim, deletar!",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      const success = await deleteDocument(doc.zapsign_token);

      if (success) {
        // Remover documento da lista local (sem depender de cache)
        setDocuments(prev => prev.filter(d => d.id !== doc.id));

        toast({
          title: "Documento Deletado",
          description: "O documento foi removido com sucesso"
        });
      }
    } catch (error: any) {
      console.error("Error deleting document:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Deletar",
        description: error.message || "Falha ao deletar documento"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/dashboard")} data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-2">
              <FileSignature className="w-6 h-6 text-indigo-600" />
              <h1 className="text-2xl font-bold">FaciliSign</h1>
              <Badge className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
                ZapSign
              </Badge>
            </div>
          </div>

          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" data-testid="button-new-document">
                <Plus className="w-4 h-4 mr-2" />
                Novo Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Enviar Documento para Assinatura</DialogTitle>
                <DialogDescription>
                  Faca upload de um documento PDF e adicione os signatarios.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Titulo do Documento *</Label>
                  <Input
                    id="title"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    placeholder="Digite o titulo do documento"
                    data-testid="input-document-title"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="use-url"
                    checked={usePdfUrl}
                    onCheckedChange={setUsePdfUrl}
                  />
                  <Label htmlFor="use-url">Usar URL do PDF ao inves de upload</Label>
                </div>

                {usePdfUrl ? (
                  <div>
                    <Label htmlFor="pdf-url">URL do PDF *</Label>
                    <Input
                      id="pdf-url"
                      value={pdfUrl}
                      onChange={(e) => setPdfUrl(e.target.value)}
                      placeholder="https://exemplo.com/documento.pdf"
                      data-testid="input-pdf-url"
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="file">Arquivo PDF *</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      data-testid="input-file"
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Arquivo selecionado: {selectedFile.name}
                      </p>
                    )}
                  </div>
                )}

                <div className="border rounded-md p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Signatarios</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSignatario}
                      data-testid="button-add-signer"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>

                  {signatarios.map((sig, index) => (
                    <div key={index} className="border rounded-md p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Signatario {index + 1}
                        </span>
                        {signatarios.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSignatario(index)}
                            data-testid={`button-remove-signer-${index}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Nome *</Label>
                          <Input
                            value={sig.nome}
                            onChange={(e) =>
                              updateSignatario(index, "nome", e.target.value)
                            }
                            placeholder="Nome completo"
                            data-testid={`input-signer-name-${index}`}
                          />
                        </div>
                        <div>
                          <Label>Email *</Label>
                          <Input
                            type="email"
                            value={sig.email}
                            onChange={(e) =>
                              updateSignatario(index, "email", e.target.value)
                            }
                            placeholder="email@exemplo.com"
                            data-testid={`input-signer-email-${index}`}
                          />
                        </div>
                        <div>
                          <Label>Telefone</Label>
                          <Input
                            value={sig.telefone || ""}
                            onChange={(e) =>
                              updateSignatario(index, "telefone", e.target.value)
                            }
                            placeholder="(11) 99999-9999"
                            data-testid={`input-signer-phone-${index}`}
                          />
                        </div>
                        <div>
                          <Label>CPF</Label>
                          <Input
                            value={sig.cpf || ""}
                            onChange={(e) =>
                              updateSignatario(index, "cpf", e.target.value)
                            }
                            placeholder="000.000.000-00"
                            data-testid={`input-signer-cpf-${index}`}
                          />
                        </div>
                      </div>

                      {/* OneClick: Qualificação */}
                      <div>
                        <Label>Qualificação</Label>
                        <Select
                          value={sig.qualificacao || "parte"}
                          onValueChange={(value) =>
                            updateSignatario(index, "qualificacao", value)
                          }
                        >
                          <SelectTrigger data-testid={`select-signer-qualification-${index}`}>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="parte">Parte</SelectItem>
                            <SelectItem value="testemunha">Testemunha</SelectItem>
                            <SelectItem value="advogado">Advogado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                    </div>
                  ))}
                </div>


                {/* Info: Emails automáticos sempre ativos */}
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <p className="text-sm text-blue-800">
                    <strong>Email automático:</strong> ZapSign enviará notificações por email para todos os signatários
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="send-email"
                      checked={sendEmail}
                      onCheckedChange={setSendEmail}
                    />
                    <Label htmlFor="send-email" className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      Enviar por email
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="send-whatsapp"
                      checked={sendWhatsapp}
                      onCheckedChange={setSendWhatsapp}
                    />
                    <Label htmlFor="send-whatsapp" className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      Enviar por WhatsApp
                    </Label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={uploading}
                    className="flex-1"
                    data-testid="button-submit-document"
                  >
                    {uploading ? "Enviando..." : "Enviar para Assinatura"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    className="flex-1"
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card
            className="cursor-pointer hover-elevate"
            onClick={() => setShowUploadDialog(true)}
          >
            <CardContent className="p-6 text-center">
              <Upload className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Enviar Documento</h3>
              <p className="text-sm text-muted-foreground">
                Faca upload de documentos para assinatura digital
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Assinatura Segura</h3>
              <p className="text-sm text-muted-foreground">
                Assinaturas digitais com validade juridica via ZapSign
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Acompanhamento</h3>
              <p className="text-sm text-muted-foreground">
                Monitore o status das assinaturas em tempo real
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="w-5 h-5" />
                Documentos para Assinatura
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={loadDocuments}
                disabled={loading}
                data-testid="button-refresh-list"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-12">
                <FileSignature className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Nenhum documento</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Comece enviando seu primeiro documento para assinatura.
                </p>
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Documento
                </Button>
              </div>
            ) : (
              <>
                {/* Cards expandidos com status detalhado */}
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <Card key={doc.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileSignature className="w-5 h-5 text-indigo-600" />
                            <div>
                              <CardTitle className="text-base">{doc.nome}</CardTitle>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {new Date(doc.created_at).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          {getOverallStatusBadge(doc)}
                        </div>
                      </CardHeader>

                      {doc.signatarios && doc.signatarios.length > 0 && (
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <p className="text-sm font-medium text-muted-foreground">
                              Signatários ({doc.signatarios.length}):
                            </p>

                            {doc.signatarios.map((signer: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-start justify-between p-3 rounded-lg bg-muted/30 border"
                              >
                                <div className="flex items-start gap-3 flex-1">
                                  {/* Checkbox apenas para documentos pendentes com signatários pendentes */}
                                  {doc.status !== 'signed' && (signer.status === 'new' || signer.status === 'pending' || signer.status === 'link-opened') && (
                                    <Checkbox
                                      id={`signer-${doc.id}-${idx}`}
                                      checked={selectedSigners[doc.id]?.includes(signer.email) || false}
                                      onCheckedChange={(checked) => {
                                        toggleSignerSelection(doc.id, signer.email, checked as boolean);
                                      }}
                                      className="mt-1"
                                    />
                                  )}

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                      <p className="text-sm font-medium truncate">{signer.name}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                      {signer.email}
                                    </p>
                                  </div>
                                </div>
                                <div className="ml-2 flex-shrink-0">
                                  {getSignerStatusBadge(signer.status, signer.signed_at, doc.status)}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Processos Vinculados */}
                          {doc.linked_processes && doc.linked_processes.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-sm font-medium text-muted-foreground mb-2">
                                Vinculado aos Processos:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {doc.linked_processes?.map((processo, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200"
                                  >
                                    <FolderPlus className="w-3 h-3 mr-1" />
                                    {processo.numero}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRefreshStatus(doc.zapsign_token)}
                              disabled={refreshingDoc === doc.zapsign_token}
                              data-testid={`button-refresh-${doc.id}`}
                            >
                              <RefreshCw className={`w-4 h-4 mr-2 ${refreshingDoc === doc.zapsign_token ? 'animate-spin' : ''}`} />
                              Atualizar
                            </Button>

                            {hasPendingSigners(doc) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResendEmails(doc)}
                                disabled={!selectedSigners[doc.id] || selectedSigners[doc.id].length === 0 || resendingDoc === doc.id}
                              >
                                <Mail className="w-4 h-4 mr-2" />
                                {resendingDoc === doc.id
                                  ? 'Enviando...'
                                  : `Reenviar${selectedSigners[doc.id]?.length ? ` (${selectedSigners[doc.id].length})` : ''}`
                                }
                              </Button>
                            )}

                            {isFullySigned(doc) && (
                              <Button
                                size="sm"
                                onClick={() => handleLinkToProcess(doc)}
                                className="bg-indigo-600 hover:bg-indigo-700"
                                data-testid={`button-link-${doc.id}`}
                              >
                                <FolderPlus className="w-4 h-4 mr-2" />
                                Vincular
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDocument(doc)}
                              data-testid={`button-view-${doc.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            {doc.status === "signed" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDownloadDocument(doc)}
                                data-testid={`button-download-${doc.id}`}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteDocument(doc)}
                              data-testid={`button-delete-${doc.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Pagina {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Proxima
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FaciliSign;
