import * as React from "react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Upload, FileText, Trash2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast.ts";
import { supabase } from "@/integrations/supabase/client.ts";
import { useAuth } from "@/hooks/useAuth.ts";

interface Documento {
  id: string;
  nome_arquivo: string;
  tipo_arquivo: string;
  tamanho_arquivo: number;
  url_arquivo: string;
  descricao?: string;
  created_at: string;
}

interface DocumentUploadProps {
  clienteNome: string;
  documentos: Documento[];
  onDocumentosChange: (documentos: Documento[]) => void;
}

const DocumentUpload = ({ clienteNome, documentos, onDocumentosChange }: DocumentUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [descricao, setDescricao] = useState("");

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Verificar tamanho máximo (10MB)
      if (file.size > 100 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 100MB.",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    try {
      // Criar nome único para o arquivo (remover acentos e caracteres especiais)
      const cleanFileName = selectedFile.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-zA-Z0-9._-]/g, '_'); // Substitui caracteres especiais por underscore

      const fileExtension = cleanFileName.split('.').pop();
      const uniqueFileName = `${Date.now()}_${cleanFileName}`;
      const filePath = `${user.id}/${uniqueFileName}`;

      console.log('Fazendo upload do arquivo:', filePath);

      // Upload para Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('processo-documentos')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw uploadError;
      }

      console.log('Upload realizado com sucesso:', uploadData);

      // Obter URL pública do arquivo
      const { data: urlData } = supabase.storage
        .from('processo-documentos')
        .getPublicUrl(filePath);

      console.log('URL pública:', urlData);

      // Salvar informações do documento no banco
      const { data: documentoData, error: dbError } = await supabase
        .from('documentos_processo')
        .insert([
          {
            user_id: user.id,
            cliente_nome: clienteNome,
            nome_arquivo: selectedFile.name, // Nome original
            tipo_arquivo: selectedFile.type || 'application/octet-stream',
            tamanho_arquivo: selectedFile.size,
            url_arquivo: urlData.publicUrl,
            descricao: descricao || null
          }
        ])
        .select()
        .single();

      if (dbError) {
        console.error('Erro ao salvar no banco:', dbError);
        throw dbError;
      }

      // Atualizar lista de documentos
      onDocumentosChange([...documentos, documentoData]);

      // Limpar campos
      setSelectedFile(null);
      setDescricao("");
      
      // Limpar input file
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      toast({
        title: "Documento enviado!",
        description: "O documento foi salvo com sucesso.",
      });

    } catch (error: any) {
      console.error('Erro completo:', error);
      toast({
        variant: "destructive",
        title: "Erro ao enviar documento",
        description: error.message || "Erro desconhecido ao fazer upload",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveDocument = async (documento: Documento) => {
    try {
      // Extrair caminho do arquivo da URL
      const url = new URL(documento.url_arquivo);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(-2).join('/'); // user_id/filename

      console.log('Removendo arquivo:', filePath);

      // Remover arquivo do storage
      const { error: storageError } = await supabase.storage
        .from('processo-documentos')
        .remove([filePath]);

      if (storageError) {
        console.error('Erro ao remover do storage:', storageError);
        throw storageError;
      }

      // Remover registro do banco
      const { error: dbError } = await supabase
        .from('documentos_processo')
        .delete()
        .eq('id', documento.id);

      if (dbError) {
        console.error('Erro ao remover do banco:', dbError);
        throw dbError;
      }

      // Atualizar lista
      onDocumentosChange(documentos.filter(doc => doc.id !== documento.id));

      toast({
        title: "Documento removido",
        description: "O documento foi excluído com sucesso.",
      });

    } catch (error: any) {
      console.error('Erro ao remover:', error);
      toast({
        variant: "destructive",
        title: "Erro ao remover documento",
        description: error.message || "Erro desconhecido",
      });
    }
  };

  const handleDownload = (documento: Documento) => {
    window.open(documento.url_arquivo, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Documentos do Processo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Selecionar Arquivo</Label>
              <Input
                id="file-upload"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.zip,.rar"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Tipos aceitos: PDF, DOC, DOCX, JPG, PNG, TXT, ZIP, RAR. Máximo: 100MB
              </p>
            </div>

            {selectedFile && (
              <div>
                <Label htmlFor="descricao">Descrição (opcional)</Label>
                <Input
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva o conteúdo do documento..."
                  className="mt-1"
                />
              </div>
            )}

            {selectedFile && (
              <div className="bg-muted p-3 rounded">
                <p className="text-sm">
                  <span className="font-medium">Arquivo selecionado:</span> {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Tamanho: {formatFileSize(selectedFile.size)}
                </p>
              </div>
            )}

            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || uploading}
              className="w-full"
            >
              {uploading ? "Enviando..." : "Enviar Documento"}
            </Button>
          </div>
        </div>

        {/* Lista de Documentos */}
        {documentos.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Documentos Anexados ({documentos.length})</h4>
            {documentos.map((documento) => (
              <div key={documento.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{documento.nome_arquivo}</p>
                      {documento.descricao && (
                        <p className="text-xs text-muted-foreground">{documento.descricao}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {formatFileSize(documento.tamanho_arquivo)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(documento.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(documento)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveDocument(documento)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {documentos.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum documento anexado ainda.</p>
            <p className="text-xs">Anexe documentos relacionados ao processo.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;