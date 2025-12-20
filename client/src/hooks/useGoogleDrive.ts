import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  size?: string;
}

interface UploadResult {
  fileId: string;
  webViewLink: string;
  folderId: string;
}

export function useGoogleDrive() {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/drive/status');
      const data = await response.json();
      setIsConnected(data.connected);
      return data.connected;
    } catch (error) {
      console.error('Failed to check Drive connection:', error);
      setIsConnected(false);
      return false;
    }
  }, []);

  const getOrCreateRootFolder = useCallback(async (): Promise<string | null> => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/drive/root-folder');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get root folder');
      }
      
      const data = await response.json();
      return data.folderId;
    } catch (error: any) {
      console.error('Failed to get/create root folder:', error);
      toast({
        title: 'Erro no Google Drive',
        description: error.message || 'Falha ao acessar pasta raiz',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getOrCreateProcessFolder = useCallback(async (numeroProcesso: string): Promise<string | null> => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/drive/process-folder/${encodeURIComponent(numeroProcesso)}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get process folder');
      }
      
      const data = await response.json();
      return data.folderId;
    } catch (error: any) {
      console.error('Failed to get/create process folder:', error);
      toast({
        title: 'Erro no Google Drive',
        description: error.message || 'Falha ao acessar pasta do processo',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const uploadFile = useCallback(async (
    file: File,
    numeroProcesso: string,
    customFileName?: string
  ): Promise<UploadResult | null> => {
    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('numeroProcesso', numeroProcesso);
      if (customFileName) {
        formData.append('fileName', customFileName);
      }

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 80));
      }, 200);

      const response = await fetch('/api/drive/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload file');
      }

      const result = await response.json();

      toast({
        title: 'Arquivo enviado ao Drive',
        description: `${customFileName || file.name} foi sincronizado com o Google Drive`,
      });

      return result;
    } catch (error: any) {
      console.error('Failed to upload file to Drive:', error);
      toast({
        title: 'Erro ao enviar para o Drive',
        description: error.message || 'Falha ao sincronizar arquivo',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [toast]);

  const uploadFromUrl = useCallback(async (
    fileUrl: string,
    fileName: string,
    numeroProcesso: string
  ): Promise<UploadResult | null> => {
    try {
      setUploading(true);
      setUploadProgress(0);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 80));
      }, 200);

      const response = await fetch('/api/drive/upload-from-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileUrl, fileName, numeroProcesso }),
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload file from URL');
      }

      const result = await response.json();

      toast({
        title: 'Arquivo enviado ao Drive',
        description: `${fileName} foi sincronizado com o Google Drive`,
      });

      return result;
    } catch (error: any) {
      console.error('Failed to upload file from URL to Drive:', error);
      toast({
        title: 'Erro ao enviar para o Drive',
        description: error.message || 'Falha ao sincronizar arquivo',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [toast]);

  const listFolderFiles = useCallback(async (folderId: string): Promise<DriveFile[]> => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/drive/folder/${folderId}/files`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to list files');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Failed to list folder files:', error);
      toast({
        title: 'Erro ao listar arquivos',
        description: error.message || 'Falha ao carregar arquivos do Drive',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const listProcessFolders = useCallback(async (): Promise<DriveFile[]> => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/drive/process-folders');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to list folders');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Failed to list process folders:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteFile = useCallback(async (fileId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/drive/files/${fileId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete file');
      }
      
      toast({
        title: 'Arquivo removido',
        description: 'Arquivo removido do Google Drive',
      });
      
      return true;
    } catch (error: any) {
      console.error('Failed to delete file:', error);
      toast({
        title: 'Erro ao remover arquivo',
        description: error.message || 'Falha ao remover arquivo do Drive',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const getFileDetails = useCallback(async (fileId: string): Promise<DriveFile | null> => {
    try {
      const response = await fetch(`/api/drive/files/${fileId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get file details');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Failed to get file details:', error);
      return null;
    }
  }, []);

  return {
    isConnected,
    isLoading,
    uploading,
    uploadProgress,
    checkConnection,
    getOrCreateRootFolder,
    getOrCreateProcessFolder,
    uploadFile,
    uploadFromUrl,
    listFolderFiles,
    listProcessFolders,
    deleteFile,
    getFileDetails,
  };
}
