import * as React from "react";
import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import {
  useDocuSeal,
  type DocumentoDigital,
  type Signatario,
  type DocuSealField,
} from "@/hooks/useDocuSeal.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { supabase } from "@/integrations/supabase/client.ts";

const FaciliSign = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentoDigital[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState("");
  const [camposAssinatura, setCamposAssinatura] = useState<DocuSealField[]>([]);
  // Adicione esta função para adicionar campos padrão
  // No FaciliSign.tsx - Adicione estas funções
  const modelosAssinatura = {
    SIMPLES: [
      {
        name: "assinatura",
        type: "signature" as const,
        required: true,
        page: 0,
        x: 100,
        y: 700,
        width: 200,
        height: 80,
      },
      {
        name: "data",
        type: "date" as const,
        required: true,
        page: 0,
        x: 450,
        y: 700,
        width: 150,
        height: 30,
      },
    ],
    COMPLETO: [
      // CONTRATANTE (Parte 1)
      {
        name: "rubrica_contratante",
        type: "initial" as const,
        required: true,
        page: 0,
        x: 515,
        y: 660,
        width: 60,
        height: 50,
      },
      {
        name: "assinatura_contratante",
        type: "signature" as const,
        required: true,
        page: 0,
        x: 100,
        y: 95,
        width: 250,
        height: 80,
      },
      {
        name: "data_contratante",
        type: "date" as const,
        required: true,
        page: 0,
        x: 400,
        y: 95,
        width: 150,
        height: 30,
      },

      // CONTRATADO (Parte 2)
      {
        name: "rubrica_contratado",
        type: "initial" as const,
        required: true,
        page: 0,
        x: 515,
        y: 720,
        width: 60,
        height: 50,
      },
      {
        name: "assinatura_contratado",
        type: "signature" as const,
        required: true,
        page: 0,
        x: 100,
        y: 240,
        width: 250,
        height: 80,
      },
      {
        name: "data_contratado",
        type: "date" as const,
        required: true,
        page: 0,
        x: 400,
        y: 240,
        width: 150,
        height: 30,
      },
    ],
  };

  // Substitua a função adicionarCamposPadrao por:
  const selecionarModelo = (modelo: "SIMPLES" | "COMPLETO") => {
    setCamposAssinatura(modelosAssinatura[modelo]);
  };

  const [signatarios, setSignatarios] = useState<Signatario[]>([
    { nome: "", email: "" },
  ]);

  const [selectedDocument, setSelectedDocument] =
    useState<DocumentoDigital | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);

  const {
    uploadDocument,
    sendForSignature,
    getDocuments,
    getDocumentDownloadUrl,
    getDocumentViewUrl,
    loading,
    uploading,
  } = useDocuSeal();
  const { toast } = useToast();

  const loadDocuments = useCallback(async () => {
    const docs = await getDocuments(currentPage, pageSize);
    setDocuments(docs);
    const { count, error } = await supabase
      .from("documentos_digitais")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    setTotalPages(Math.ceil(count / pageSize));
  }, [getDocuments, currentPage, pageSize]);

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      // 1. Verifica o token
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (!session || error) {
        navigate("/login");
        return;
      }

      // 2. Debug (opcional)
      console.log("Token JWT válido:", session.access_token); // Só aparece 1x

      // 3. Carrega os documentos
      try {
        const docs = await getDocuments();
        setDocuments(docs);
      } catch (err) {
        console.error("Erro ao carregar documentos:", err);
      }
    };

    checkAuthAndLoadData();
  }, []);

  const getStats = () => {
    const assinados = documents.filter(
      (doc) => doc.status === "ASSINADO"
    ).length;
    const pendentes = documents.filter(
      (doc) => doc.status === "ENVIADO_PARA_ASSINATURA"
    ).length;
    const templates = documents.filter(
      (doc) => doc.status === "TEMPLATE_CRIADO"
    ).length;

    return [
      {
        title: "Documentos Assinados",
        value: assinados.toString(),
        icon: FileSignature,
        color: "text-success",
      },
      {
        title: "Pendentes",
        value: pendentes.toString(),
        icon: Clock,
        color: "text-warning",
      },
      {
        title: "Templates",
        value: templates.toString(),
        icon: Shield,
        color: "text-primary",
      },
    ];
  };

  const stats = getStats();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ASSINADO: {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
        label: "Assinado",
      },
      ENVIADO_PARA_ASSINATURA: {
        color: "bg-blue-100 text-blue-800",
        icon: Clock,
        label: "Pendente",
      },
      TEMPLATE_CRIADO: {
        color: "bg-yellow-100 text-yellow-800",
        icon: AlertCircle,
        label: "Template",
      },
      EXPIRADO: {
        color: "bg-red-100 text-red-800",
        icon: XCircle,
        label: "Expirado",
      },
      RECUSADO: {
        color: "bg-red-100 text-red-800",
        icon: XCircle,
        label: "Recusado",
      },
      UPLOAD_SUPABASE: {
        color: "bg-gray-500",
        icon: Upload,
        label: "Processando",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig["TEMPLATE_CRIADO"];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setDocumentTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Swal.fire({
        title: "Erro",
        text: "Nenhum arquivo selecionado",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (!session || sessionError) throw new Error("Usuário não autenticado");

      console.log("Iniciando upload - Dados do arquivo:", {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
      });

      // Inserir no Supabase
      const { data, error } = await supabase
        .from("documentos_digitais")
        .insert({
          user_id: session.user.id,
          nome: documentTitle || selectedFile.name,
          tipo: selectedFile.type,
          tamanho: selectedFile.size,
          status: "UPLOAD_SUPABASE",
          metadata: {
            original_filename: selectedFile.name,
            campos_predefinidos: camposAssinatura.length > 0,
          },
        })
        .select()
        .single();

      if (error) throw error;
      console.log("Documento criado no Supabase:", data.id);

      // Upload para DocuSeal com campos
      const uploadResponse = await uploadDocument(
        selectedFile,
        documentTitle,
        data.id,
        camposAssinatura.length > 0 ? camposAssinatura : undefined
      );
      console.log("Resposta do upload:", uploadResponse);

      if (!uploadResponse?.success) {
        throw new Error("Falha ao criar template no DocuSeal");
      }

      toast({ title: "Sucesso", description: "Template criado com sucesso!" });
      await loadDocuments();
      setShowUploadDialog(false);
      setSelectedFile(null);
      setDocumentTitle("");
      setCamposAssinatura([]);
    } catch (error) {
      console.error("Erro no upload completo:", error);
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Falha no processo de upload",
        variant: "destructive",
      });
    }
  };

  const addSignatario = () => {
    setSignatarios([...signatarios, { nome: "", email: "" }]);
  };

  const removeSignatario = (index: number) => {
    setSignatarios(signatarios.filter((_, i) => i !== index));
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

  const handleSendForSignature = async () => {
    if (!selectedDocument) return;

    const validSignatarios = signatarios.filter((sig) => sig.nome && sig.email);
    if (validSignatarios.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um signatário válido",
        variant: "destructive",
      });
      return;
    }

    // Mapear campos específicos para cada signatário baseado no modelo COMPLETO
    const signatariosComCampos = validSignatarios.map((signatario, index) => {
      let camposEspecificos = [];

      if (selectedDocument.metadata?.campos_predefinidos) {
        if (index === 0) {
          // Primeiro signatário - campos do CONTRATANTE
          camposEspecificos = [
            { name: "rubrica_contratante", required: true },
            { name: "assinatura_contratante", required: true },
            { name: "data_contratante", required: true },
          ];
        } else if (index === 1) {
          // Segundo signatário - campos do CONTRATADO
          camposEspecificos = [
            { name: "rubrica_contratado", required: true },
            { name: "assinatura_contratado", required: true },
            { name: "data_contratado", required: true },
          ];
        }
      }

      return {
        ...signatario,
        campos: camposEspecificos,
      };
    });

    const success = await sendForSignature(
      selectedDocument.docuseal_template_id,
      signatariosComCampos,
      selectedDocument.id
    );

    if (success) {
      await loadDocuments();
      setShowSignatureDialog(false);
      setSelectedDocument(null);
      setSignatarios([{ nome: "", email: "" }]);
    }
  };

  // Função para visualizar documento
  const handleViewDocument = async (document: DocumentoDigital) => {
    try {
      if (document.status === "ASSINADO" && document.docuseal_submission_id) {
        // Para documentos assinados
        const url = await getDocumentDownloadUrl(
          document.docuseal_template_id,
          document.docuseal_submission_id
        );
        window.open(url, "_blank");
      } else if (document.docuseal_template_id) {
        // Para templates
        const url = await getDocumentViewUrl(document.docuseal_template_id);
        window.open(url, "_blank");
      } else {
        toast({
          title: "Informação",
          description: "Documento ainda não está disponível para visualização",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Erro ao visualizar documento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível abrir o documento",
        variant: "destructive",
      });
    }
  };

  // Função para download
  const handleDownloadDocument = async (document: DocumentoDigital) => {
    try {
      if (document.status === "ASSINADO" && document.docuseal_submission_id) {
        const url = await getDocumentDownloadUrl(
          document.docuseal_template_id,
          document.docuseal_submission_id
        );

        // Criar link temporário para download
        const link = document.createElement("a");
        link.href = url;
        link.download = `${document.nome}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast({
          title: "Informação",
          description: "Apenas documentos assinados podem ser baixados",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Erro ao baixar documento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível baixar o documento",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-2">
              <FileSignature className="w-6 h-6 text-indigo-600" />
              <h1 className="text-2xl font-bold">FaciliSign ID</h1>
              <span className="bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full text-xs font-medium">
                DIGITAL
              </span>
            </div>
          </div>

          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Novo Documento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload de Documento</DialogTitle>
                <DialogDescription>
                  Faça upload de um documento para criar um template de
                  assinatura.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file">Arquivo PDF</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                  />
                </div>
                <div>
                  <Label htmlFor="title">Título do Documento</Label>
                  <Input
                    id="title"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    placeholder="Digite o título do documento"
                  />
                </div>
                <div className="border rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Modelo de Assinatura</Label>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <Button
                      type="button"
                      variant={
                        camposAssinatura === modelosAssinatura.SIMPLES
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => selecionarModelo("SIMPLES")}
                    >
                      <FileSignature className="w-4 h-4 mr-1" />
                      Procuração
                    </Button>
                    <Button
                      type="button"
                      variant={
                        camposAssinatura === modelosAssinatura.COMPLETO
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => selecionarModelo("COMPLETO")}
                    >
                      <Users className="w-4 h-4 mr-1" />
                      Contrato
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">
                    {camposAssinatura.length > 0
                      ? `Documento terá ${camposAssinatura.length} campos de assinatura`
                      : "Selecione um modelo ou configure manualmente no DocuSeal"}
                  </p>

                  {camposAssinatura.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium">Campos incluídos:</p>
                      <ul className="list-disc pl-4 mt-1 space-y-1">
                        {camposAssinatura.map((campo, index) => (
                          <li key={index}>
                            <span className="font-medium">{campo.name}</span>
                            <span className="text-muted-foreground">
                              {" "}
                              ({campo.type})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className="flex-1"
                  >
                    {uploading ? "Enviando..." : "Fazer Upload"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowUploadDialog(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
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

        {/* Features Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setShowUploadDialog(true)}
          >
            <CardContent className="p-6 text-center">
              <Upload className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Enviar Documento</h3>
              <p className="text-sm text-muted-foreground">
                Faça upload de documentos para assinatura digital
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Shield className="w-12 h-12 text-success mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Assinatura Segura</h3>
              <p className="text-sm text-muted-foreground">
                Assinaturas digitais com validade jurídica
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Clock className="w-12 h-12 text-warning mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Acompanhamento</h3>
              <p className="text-sm text-muted-foreground">
                Monitore o status das assinaturas em tempo real
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="w-5 h-5" />
                Documentos para Assinatura
              </CardTitle>
              <Input placeholder="Buscar documentos..." className="w-80" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Datas</TableHead>
                  <TableHead>Signatários</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.nome}</TableCell>
                    <TableCell>{doc.tipo || "PDF"}</TableCell>
                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      Criado:{" "}
                      {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                      <br />
                      {doc.updated_at !== doc.created_at &&
                        `Atualizado: ${new Date(
                          doc.updated_at
                        ).toLocaleDateString("pt-BR")}`}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">
                          {doc.signatarios?.length || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {doc.status === "TEMPLATE_CRIADO" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDocument(doc);
                              setShowSignatureDialog(true);
                            }}
                          >
                            <Upload className="w-4 h-4 mr-1" />
                            Enviar
                          </Button>
                        )}
                        {doc.status === "ASSINADO" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDocument(doc)}
                          disabled={!doc.docuseal_template_id}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {documents.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Nenhum documento encontrado. Clique em "Novo Documento"
                      para começar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {/* Controles de Paginação */}
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Anterior
              </Button>
              <span>
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Próximo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para envio de assinatura */}
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enviar para Assinatura</DialogTitle>
            <DialogDescription>
              Configure os signatários para o documento:{" "}
              {selectedDocument?.nome}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Signatários</Label>
              {signatarios.map((signatario, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder="Nome completo"
                    value={signatario.nome}
                    onChange={(e) =>
                      updateSignatario(index, "nome", e.target.value)
                    }
                    className="flex-1"
                  />
                  <Input
                    placeholder="email@exemplo.com"
                    type="email"
                    value={signatario.email}
                    onChange={(e) =>
                      updateSignatario(index, "email", e.target.value)
                    }
                    className="flex-1"
                  />
                  {signatarios.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeSignatario(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addSignatario}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Signatário
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSendForSignature}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Enviando..." : "Enviar para Assinatura"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSignatureDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FaciliSign;
