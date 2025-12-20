import * as React from "react";
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client.ts';
import { useAuth } from '@/hooks/useAuth.ts';
import { useToast } from '@/hooks/use-toast.ts';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  path: string;
}

export const useFileUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = async (file: File): Promise<UploadedFile | null> => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return null;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Verificar tamanho do arquivo (máximo 10MB)
      if (file.size > 100 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. Máximo 100MB.');
      }

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('📁 Uploading file:', file.name, 'to path:', filePath);

      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 80));
      }, 200);

      // Upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      setUploadProgress(100);

      // Obter URL pública do arquivo
      const { data: urlData } = supabase.storage
        .from('chat-files')
        .getPublicUrl(filePath);

      const uploadedFile: UploadedFile = {
        id: data.path,
        name: file.name,
        size: file.size,
        type: file.type,
        url: urlData.publicUrl,
        path: data.path
      };

      console.log('✅ File uploaded successfully:', uploadedFile);

      toast({
        title: "Arquivo enviado",
        description: `${file.name} foi enviado com sucesso`,
      });

      return uploadedFile;

    } catch (error) {
      console.error('❌ Upload error:', error);
      
      let errorMessage = "Falha ao enviar arquivo";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro no upload",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteFile = async (filePath: string) => {
    try {
      const { error } = await supabase.storage
        .from('chat-files')
        .remove([filePath]);

      if (error) throw error;

      toast({
        title: "Arquivo removido",
        description: "Arquivo deletado com sucesso",
      });

      return true;
    } catch (error) {
      console.error('❌ Delete error:', error);
      
      toast({
        title: "Erro",
        description: "Falha ao deletar arquivo",
        variant: "destructive",
      });
      
      return false;
    }
  };

  return {
    uploadFile,
    deleteFile,
    uploading,
    uploadProgress
  };
};