import * as React from "react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";

export interface Signatario {
  nome: string;
  email: string;
  role?: string;
}

export interface DocumentoDigital {
  id: string;
  nome: string;
  tipo: string;
  status:
    | "TEMPLATE_CRIADO"
    | "ENVIADO_PARA_ASSINATURA"
    | "ASSINADO"
    | "EXPIRADO"
    | "RECUSADO";
  docuseal_template_id: string;
  docuseal_submission_id?: string;
  signatarios?: Signatario[];
  created_at: string;
  updated_at: string;
}

interface Template {
  id: number;
  name: string;
  slug: string;
  documents: Array<{
    url: string;
    filename: string;
  }>;
}

export interface DocuSealField {
  name: string;
  type: "signature" | "text" | "date" | "checkbox" | "initial";
  required?: boolean;
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export const useDocuSeal = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const getTemplates = async (): Promise<Template[]> => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("Usuário não autenticado");

      const response = await fetch(`${supabaseUrl}/templates`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
        },
      });

      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Erro",
        description: "Falha ao buscar templates",
        variant: "destructive",
      });
      return [];
    }
  };

  const getTemplateDetails = async (id: number): Promise<Template | null> => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("Usuário não autenticado");

      const response = await fetch(`${supabaseUrl}/templates/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
        },
      });

      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching template details:", error);
      toast({
        title: "Erro",
        description: "Falha ao buscar detalhes do template",
        variant: "destructive",
      });
      return null;
    }
  };

  const uploadDocument = async (
    file: File,
    title: string = "",
    documentId?: string,
    fields?: DocuSealField[] // Novo parâmetro opcional
  ) => {
    setUploading(true);
    try {
      console.log("Preparando upload para DocuSeal:", {
        fileName: file.name,
        title,
        documentId,
        fields,
      });

      const formData = new FormData();
      formData.append("file", file);
      if (title) formData.append("title", title);
      if (documentId) formData.append("documentId", documentId);
      if (fields) formData.append("fields", JSON.stringify(fields));

      const { data, error } = await supabase.functions.invoke(
        "docuseal-upload",
        {
          body: formData,
        }
      );

      if (error) {
        console.error("Erro na função de upload:", error);
        toast({
          title: "Erro no Upload",
          description: "Falha ao processar upload no DocuSeal. Verifique logs.",
          variant: "destructive",
        });
        throw error;
      }

      if (!data?.success) {
        throw new Error("Falha ao criar template no DocuSeal");
      }

      console.log("Upload concluído com sucesso:", data);
      return data;
    } catch (error) {
      console.error("Erro detalhado no upload:", error);
      toast({
        title: "Erro no Upload",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const sendForSignature = async (
    templateId: string,
    signatarios: Signatario[],
    documentoId: string // ← Adicione este parâmetro
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase.functions.invoke(
        "docuseal-send-signature",
        {
          body: {
            templateId,
            signatarios: signatarios.map((s) => ({
              nome: s.nome,
              email: s.email,
              role: s.role,
            })),
            documentoId, // ← Adicione esta linha
          },
          headers: {
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
        }
      );

      if (error) throw error;

      toast({
        title: "Documento enviado",
        description: "Documento enviado para assinatura com sucesso",
      });
      return true;
    } catch (error) {
      console.error("Send signature error:", error);
      toast({
        title: "Erro ao enviar",
        description:
          error instanceof Error
            ? error.message
            : "Falha ao enviar documento para assinatura",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getDocumentViewUrl = async (templateId: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "docuseal-get-view-url",
        {
          body: { templateId },
        }
      );

      if (error) throw error;
      return data.url;
    } catch (error) {
      console.error("Erro ao obter URL de visualização:", error);
      throw error;
    }
  };

  const getDocumentDownloadUrl = async (
    templateId: string,
    submissionId?: string
  ): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "docuseal-get-download-url",
        {
          body: { templateId, submissionId },
        }
      );

      if (error) throw error;
      return data.url;
    } catch (error) {
      console.error("Erro ao obter URL de download:", error);
      throw error;
    }
  };

  const getDocuments = async (
    page: number = 1,
    pageSize: number = 10
  ): Promise<DocumentoDigital[]> => {
    try {
      const { data, error } = await supabase
        .from("documentos_digitais")
        .select("*")
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) {
        console.error("Error fetching documents:", error);
        return [];
      }

      return data.map(
        (doc: {
          id: string;
          nome: string;
          tipo: string | null;
          status: string;
          docuseal_template_id: string;
          docuseal_submission_id: string | null;
          signatarios?: unknown;
          created_at: string;
          updated_at: string;
        }) => ({
          id: doc.id,
          nome: doc.nome,
          tipo: doc.tipo || "", // Converte null para string vazia
          status: doc.status as DocumentoDigital["status"],
          docuseal_template_id: doc.docuseal_template_id,
          docuseal_submission_id: doc.docuseal_submission_id || undefined,
          signatarios: doc.signatarios
            ? (doc.signatarios as Signatario[])
            : undefined,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
        })
      );
    } catch (error) {
      console.error("Error fetching documents:", error);
      return [];
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "ASSINADO":
        return "bg-green-100 text-green-800";
      case "ENVIADO_PARA_ASSINATURA":
        return "bg-blue-100 text-blue-800";
      case "EXPIRADO":
        return "bg-red-100 text-red-800";
      case "RECUSADO":
        return "bg-red-100 text-red-800";
      case "TEMPLATE_CRIADO":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return {
    loading,
    uploading,
    getTemplates,
    getTemplateDetails,
    uploadDocument,
    sendForSignature,
    getDocuments,
    getStatusBadgeColor,
    getDocumentViewUrl,
    getDocumentDownloadUrl,
  };
};
