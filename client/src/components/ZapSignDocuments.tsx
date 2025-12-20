import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileSignature,
  Send,
  Eye,
  Loader2,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useZapSignCreateDocumentFromProcesso, useZapSignDocument } from "@/hooks/useZapSign";
import { supabase } from "@/integrations/supabase/client";

interface ZapSignDocumentsProps {
  processoId: string;
  cliente: {
    nome: string;
    email?: string | null;
    telefone?: string | null;
    cpf_cnpj?: string | null;
  };
  numeroProcesso: string;
  documentos?: Array<{
    id: string;
    nome_arquivo: string;
    url_arquivo: string;
    tipo_arquivo: string;
  }>;
}

interface ZapSignDocRecord {
  id: string;
  nome: string;
  zapsign_token: string;
  status: string;
  created_at: string;
  signatarios: any;
}

export function ZapSignDocuments({ processoId, cliente, numeroProcesso, documentos = [] }: ZapSignDocumentsProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string>("");
  const [documentName, setDocumentName] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [sendWhatsapp, setSendWhatsapp] = useState(false);
  const [zapsignDocs, setZapsignDocs] = useState<ZapSignDocRecord[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [selectedViewToken, setSelectedViewToken] = useState<string | null>(null);

  const createDocMutation = useZapSignCreateDocumentFromProcesso();
  const { data: viewingDoc, isLoading: loadingViewDoc } = useZapSignDocument(selectedViewToken);

  const loadZapSignDocuments = async () => {
    setLoadingDocs(true);
    try {
      const { data, error } = await (supabase as any)
        .from("zapsign_documents")
        .select("*")
        .eq("processo_id", processoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setZapsignDocs((data as ZapSignDocRecord[]) || []);
    } catch (error) {
      console.error("Error loading ZapSign documents:", error);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadZapSignDocuments();
  }, [processoId]);

  const handleSelectExistingDoc = (doc: { nome_arquivo: string; url_arquivo: string }) => {
    setDocumentName(doc.nome_arquivo);
    setPdfUrl(doc.url_arquivo);
    setSelectedDocument(doc.nome_arquivo);
  };

  const handleSubmit = async () => {
    if (!documentName.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nome do documento é obrigatório.",
      });
      return;
    }

    if (!pdfUrl.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "URL do PDF é obrigatória.",
      });
      return;
    }

    try {
      const result = await createDocMutation.mutateAsync({
        processoId,
        clienteNome: cliente.nome,
        clienteEmail: cliente.email,
        clienteTelefone: cliente.telefone,
        clienteCpfCnpj: cliente.cpf_cnpj,
        documentName: `${documentName} - ${numeroProcesso}`,
        pdfUrl,
        sendEmail,
        sendWhatsapp,
      });

      const { error: insertError } = await (supabase as any).from("zapsign_documents").insert({
        processo_id: processoId,
        nome: documentName,
        zapsign_token: result.token,
        zapsign_open_id: result.open_id,
        status: result.status,
        original_file_url: result.original_file,
        signatarios: result.signers,
        external_id: processoId,
      });

      if (insertError) {
        console.error("Error saving to database:", insertError);
      }

      toast({
        title: "Documento enviado!",
        description: "O documento foi enviado para assinatura com sucesso.",
      });

      setDialogOpen(false);
      setDocumentName("");
      setPdfUrl("");
      setSelectedDocument("");
      setSendEmail(false);
      setSendWhatsapp(false);
      loadZapSignDocuments();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar documento",
        description: error.message || "Não foi possível enviar o documento para assinatura.",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "signed":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" /> Assinado</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
      case "refused":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20"><AlertCircle className="w-3 h-3 mr-1" /> Recusado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileSignature className="w-5 h-5" />
          Assinatura Digital (ZapSign)
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadZapSignDocuments}
            disabled={loadingDocs}
            data-testid="button-refresh-zapsign"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loadingDocs ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-signature">
                <Send className="w-4 h-4 mr-2" />
                Enviar para Assinatura
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Enviar Documento para Assinatura</DialogTitle>
                <DialogDescription>
                  Envie um documento para o cliente {cliente.nome} assinar digitalmente via ZapSign.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {documentos.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selecionar documento existente</Label>
                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                      {documentos
                        .filter((d) => d.tipo_arquivo === "application/pdf" || d.nome_arquivo.endsWith(".pdf"))
                        .map((doc) => (
                          <Button
                            key={doc.id}
                            variant={selectedDocument === doc.nome_arquivo ? "default" : "outline"}
                            size="sm"
                            className="justify-start"
                            onClick={() => handleSelectExistingDoc(doc)}
                            data-testid={`button-select-doc-${doc.id}`}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            {doc.nome_arquivo}
                          </Button>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Ou insira uma URL de PDF abaixo</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="documentName">Nome do Documento *</Label>
                  <Input
                    id="documentName"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="Ex: Contrato de Honorários"
                    data-testid="input-document-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pdfUrl">URL do PDF *</Label>
                  <Input
                    id="pdfUrl"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    placeholder="https://exemplo.com/documento.pdf"
                    data-testid="input-pdf-url"
                  />
                  <p className="text-xs text-muted-foreground">
                    A URL deve ser pública e acessível. Tamanho máximo: 10MB.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enviar por E-mail</Label>
                      <p className="text-xs text-muted-foreground">
                        {cliente.email || "Cliente sem e-mail cadastrado"}
                      </p>
                    </div>
                    <Switch
                      checked={sendEmail}
                      onCheckedChange={setSendEmail}
                      disabled={!cliente.email}
                      data-testid="switch-send-email"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enviar por WhatsApp</Label>
                      <p className="text-xs text-muted-foreground">
                        {cliente.telefone || "Cliente sem telefone cadastrado"} (R$ 0,50/envio)
                      </p>
                    </div>
                    <Switch
                      checked={sendWhatsapp}
                      onCheckedChange={setSendWhatsapp}
                      disabled={!cliente.telefone}
                      data-testid="switch-send-whatsapp"
                    />
                  </div>
                </div>

                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    <p className="text-sm font-medium mb-2">Dados do Signatário:</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Nome: {cliente.nome}</p>
                      <p>E-mail: {cliente.email || "-"}</p>
                      <p>Telefone: {cliente.telefone || "-"}</p>
                      <p>CPF/CNPJ: {cliente.cpf_cnpj || "-"}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createDocMutation.isPending}
                  data-testid="button-submit-signature"
                >
                  {createDocMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loadingDocs ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : zapsignDocs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileSignature className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhum documento enviado para assinatura ainda.
            </p>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Clique em "Enviar para Assinatura" para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {zapsignDocs.map((doc) => (
            <Card key={doc.id} data-testid={`card-zapsign-doc-${doc.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <CardTitle className="text-base">{doc.nome}</CardTitle>
                  {getStatusBadge(doc.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="text-sm text-muted-foreground">
                    Enviado em: {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedViewToken(doc.zapsign_token)}
                      data-testid={`button-view-doc-${doc.id}`}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </Button>
                    {doc.signatarios && Array.isArray(doc.signatarios) && doc.signatarios[0]?.sign_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a
                          href={doc.signatarios[0].sign_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid={`link-sign-doc-${doc.id}`}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Link de Assinatura
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedViewToken && viewingDoc && (
        <Dialog open={!!selectedViewToken} onOpenChange={() => setSelectedViewToken(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Detalhes do Documento</DialogTitle>
            </DialogHeader>
            {loadingViewDoc ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Nome:</p>
                  <p className="text-sm text-muted-foreground">{viewingDoc.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status:</p>
                  {getStatusBadge(viewingDoc.status)}
                </div>
                <div>
                  <p className="text-sm font-medium">Criado em:</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(viewingDoc.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Signatários:</p>
                  <div className="space-y-2 mt-2">
                    {viewingDoc.signers.map((signer, idx) => (
                      <Card key={idx} className="bg-muted/50">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div>
                              <p className="font-medium">{signer.name}</p>
                              <p className="text-xs text-muted-foreground">{signer.email}</p>
                            </div>
                            {getStatusBadge(signer.status)}
                          </div>
                          {signer.signed_at && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Assinado em: {new Date(signer.signed_at).toLocaleString("pt-BR")}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                {viewingDoc.signed_file && (
                  <Button asChild className="w-full">
                    <a href={viewingDoc.signed_file} target="_blank" rel="noopener noreferrer">
                      <FileText className="w-4 h-4 mr-2" />
                      Baixar Documento Assinado
                    </a>
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
