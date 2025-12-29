import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Upload,
  FileText,
  Image,
  File,
  Trash2,
  ExternalLink,
  Loader2,
  Cloud,
  CloudOff,
  FolderSync,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useGoogleDrive } from "@/hooks/useGoogleDrive";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Documento {
  id: string;
  processo_id: string;
  nome_arquivo: string;
  tipo_arquivo: string;
  tamanho_arquivo: number;
  url_arquivo: string;
  descricao?: string;
  google_drive_file_id?: string;
  google_drive_folder_id?: string;
  google_drive_link?: string;
  assinado_digitalmente?: boolean;  // Badge "Assinado Digitalmente"
  created_at: string;
}

interface ProcessoArquivosProps {
  processoId: string;
  clienteNome: string;
  numeroProcesso: string;
  documentos: Documento[];
  onDocumentosChange?: () => void;
}

export function ProcessoArquivos({
  processoId,
  clienteNome,
  numeroProcesso,
  documentos,
  onDocumentosChange,
}: ProcessoArquivosProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [descricao, setDescricao] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [syncingTodriveId, setSyncingToDriveId] = useState<string | null>(null);

  const {
    isConnected,
    uploading: driveUploading,
    uploadProgress: driveProgress,
    checkConnection,
    uploadFile: uploadToDrive,
    uploadFromUrl,
  } = useGoogleDrive();

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo é 100MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setIsDialogOpen(true);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      if (!isConnected) {
        toast({
          title: "Drive não conectado",
          description: "O Google Drive é obrigatório para o armazenamento de documentos.",
          variant: "destructive",
        });
        return;
      }

      setUploadProgress(10);

      // 1. Upload DIRETO para o Google Drive
      const driveResult = await uploadToDrive(selectedFile, numeroProcesso, selectedFile.name);

      if (!driveResult) {
        throw new Error("Falha ao sincronizar arquivo com o Google Drive");
      }

      setUploadProgress(70);

      // 2. Salvar metadados na NOVA tabela do Supabase
      const insertData = {
        user_id: user.id,
        processo_id: processoId,
        nome_arquivo: selectedFile.name,
        tipo_arquivo: selectedFile.type,
        tamanho_arquivo: selectedFile.size,
        google_drive_file_id: driveResult.fileId,
        google_drive_folder_id: driveResult.folderId,
        google_drive_link: driveResult.webViewLink,
        descricao: descricao || null,
      };

      const { error: dbError } = await supabase
        .from("processo_documentos_drive")
        .insert(insertData as any);

      if (dbError) throw dbError;

      setUploadProgress(100);

      toast({
        title: "Arquivo enviado",
        description: "Arquivo salvo e sincronizado com Google Drive",
      });

      setIsDialogOpen(false);
      setSelectedFile(null);
      setDescricao("");
      onDocumentosChange?.();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Erro no upload",
        description: error.message || "Falha ao enviar arquivo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSyncToDrive = async (doc: Documento) => {
    if (!isConnected) {
      toast({
        title: "Drive não conectado",
        description: "Conecte o Google Drive para sincronizar arquivos",
        variant: "destructive",
      });
      return;
    }

    setSyncingToDriveId(doc.id);

    try {
      const result = await uploadFromUrl(doc.url_arquivo, doc.nome_arquivo, numeroProcesso);

      if (result) {
        const updateData: Record<string, any> = {
          google_drive_file_id: result.fileId,
          google_drive_folder_id: result.folderId,
          google_drive_link: result.webViewLink,
        };

        await supabase
          .from("processo_documentos_drive")
          .update(updateData)
          .eq("id", doc.id);

        toast({
          title: "Sincronizado",
          description: "Arquivo enviado para o Google Drive",
        });

        onDocumentosChange?.();
      }
    } catch (error: any) {
      console.error("Sync error:", error);
      toast({
        title: "Erro na sincronização",
        description: error.message || "Falha ao sincronizar com Drive",
        variant: "destructive",
      });
    } finally {
      setSyncingToDriveId(null);
    }
  };

  const handleDelete = async (doc: Documento) => {
    if (!confirm("Tem certeza que deseja remover este arquivo?")) return;

    try {
      const { error } = await supabase
        .from("processo_documentos_drive")
        .delete()
        .eq("id", doc.id);

      if (error) throw error;

      toast({
        title: "Arquivo removido",
        description: "Arquivo excluído com sucesso",
      });

      onDocumentosChange?.();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        title: "Erro ao remover",
        description: error.message || "Falha ao remover arquivo",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="w-5 h-5" />;
    if (type.includes("pdf") || type.includes("document"))
      return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3 className="text-lg font-semibold">Arquivos</h3>
        <div className="flex items-center gap-2">
          {isConnected === null ? (
            <Badge variant="outline" className="gap-1" data-testid="badge-drive-checking">
              <Loader2 className="w-3 h-3 animate-spin" />
              Verificando Drive...
            </Badge>
          ) : isConnected ? (
            <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-600 border-green-500/20" data-testid="badge-drive-connected">
              <Cloud className="w-3 h-3" />
              Drive conectado
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/20" data-testid="badge-drive-disconnected">
              <CloudOff className="w-3 h-3" />
              Drive desconectado
            </Badge>
          )}
          <Button
            onClick={handleFileSelect}
            data-testid="button-upload-arquivo"
          >
            <Upload className="w-4 h-4 mr-2" />
            Enviar Arquivo
          </Button>
        </div>
      </div>

      {!isConnected && isConnected !== null && (
        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-700">Google Drive não conectado</p>
              <p className="text-sm text-muted-foreground">
                Conecte o Google Drive nas Configurações do Sistema para sincronizar
                automaticamente os arquivos.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {documentos.length > 0 ? (
        <div className="space-y-3">
          {documentos.map((doc) => (
            <Card key={doc.id} data-testid={`card-documento-${doc.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {getFileIcon(doc.tipo_arquivo)}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate" data-testid={`text-filename-${doc.id}`}>{doc.nome_arquivo}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                        <span data-testid={`text-filesize-${doc.id}`}>{formatFileSize(doc.tamanho_arquivo)}</span>
                        {doc.descricao && (
                          <>
                            <span>-</span>
                            <span className="truncate" data-testid={`text-description-${doc.id}`}>{doc.descricao}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {doc.assinado_digitalmente && (
                      <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-600 border-green-500/20 flex-shrink-0" data-testid={`badge-digital-signature-${doc.id}`}>
                        <CheckCircle className="w-3 h-3" />
                        Assinado Digitalmente
                      </Badge>
                    )}
                    {doc.google_drive_file_id && (
                      <Badge variant="outline" className="gap-1 bg-blue-500/10 text-blue-600 border-blue-500/20 flex-shrink-0" data-testid={`badge-drive-synced-${doc.id}`}>
                        <Cloud className="w-3 h-3" />
                        Drive
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!doc.google_drive_file_id && isConnected && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncToDrive(doc)}
                        disabled={syncingTodriveId === doc.id}
                        data-testid={`button-sync-drive-${doc.id}`}
                      >
                        {syncingTodriveId === doc.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FolderSync className="w-4 h-4" />
                        )}
                        <span className="ml-2 hidden sm:inline">Sincronizar</span>
                      </Button>
                    )}
                    {doc.google_drive_link && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        data-testid={`button-drive-link-${doc.id}`}
                      >
                        <a
                          href={doc.google_drive_link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Cloud className="w-4 h-4" />
                          <span className="ml-2 hidden sm:inline">Ver no Drive</span>
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      data-testid={`button-view-${doc.id}`}
                    >
                      <a
                        href={doc.google_drive_link || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="ml-2 hidden sm:inline">Visualizar</span>
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(doc)}
                      className="text-muted-foreground hover:text-destructive"
                      data-testid={`button-delete-${doc.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Nenhum arquivo anexado.</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xlsx,.xls,.zip,.rar"
        data-testid="input-file-hidden"
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Arquivo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedFile && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                {getFileIcon(selectedFile.type)}
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Adicione uma descrição para o arquivo..."
                rows={3}
                data-testid="input-descricao"
              />
            </div>

            {isConnected && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Cloud className="w-4 h-4 text-green-600" />
                <span>O arquivo será sincronizado automaticamente com o Google Drive</span>
              </div>
            )}

            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Enviando arquivo...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedFile(null);
                  setDescricao("");
                }}
                disabled={uploading}
                data-testid="button-cancel-upload"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                data-testid="button-confirm-upload"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
