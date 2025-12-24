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
  const [signatarios, setSignatarios] = useState<Signatario[]>([
    { nome: "", email: "", telefone: "", cpf: "" },
  ]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [refreshingDoc, setRefreshingDoc] = useState<string | null>(null);

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
  }, [navigate, loadDocuments]);

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
    setSignatarios([...signatarios, { nome: "", email: "", telefone: "", cpf: "" }]);
  };

  const removeSignatario = (index: number) => {
    if (signatarios.length > 1) {
      setSignatarios(signatarios.filter((_, i) => i !== index));
    }
  };

  const updateSignatario = (
    index: number,
    field: keyof Signatario,
    value: string
  ) => {
    const updated = [...signatarios];
    updated[index][field] = value;
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
    setSignatarios([{ nome: "", email: "", telefone: "", cpf: "" }]);
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
        sendEmail,
        sendWhatsapp,
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
                    </div>
                  ))}
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Documento</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => {
                      const StatusIcon = getStatusIcon(doc.status);
                      return (
                        <TableRow key={doc.id} data-testid={`row-document-${doc.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileSignature className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{doc.nome}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {doc.source === "processo" ? (
                              <div className="flex flex-col">
                                <Badge variant="outline" className="w-fit text-xs">Processo</Badge>
                                {doc.numero_processo && (
                                  <span className="text-xs text-muted-foreground mt-1">
                                    {doc.numero_processo.length > 20 
                                      ? doc.numero_processo.slice(0, 20) + "..." 
                                      : doc.numero_processo}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <Badge variant="secondary" className="w-fit text-xs">FaciliSign</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusBadgeColor(doc.status)} flex items-center gap-1 w-fit`}>
                              <StatusIcon className="w-3 h-3" />
                              {getStatusLabel(doc.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRefreshStatus(doc.zapsign_token)}
                                disabled={refreshingDoc === doc.zapsign_token}
                                title="Atualizar status"
                                data-testid={`button-refresh-${doc.id}`}
                              >
                                <RefreshCw className={`w-4 h-4 ${refreshingDoc === doc.zapsign_token ? "animate-spin" : ""}`} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewDocument(doc)}
                                title="Visualizar"
                                data-testid={`button-view-${doc.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {doc.status === "signed" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDownloadDocument(doc)}
                                  title="Download"
                                  data-testid={`button-download-${doc.id}`}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(doc)}
                                title="Excluir"
                                data-testid={`button-delete-${doc.id}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

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
