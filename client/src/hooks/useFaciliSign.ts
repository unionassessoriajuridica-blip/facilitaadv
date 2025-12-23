import { useState } from "react";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";

export interface Signatario {
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
}

export interface DocumentoFaciliSign {
  id: string;
  nome: string;
  status: "pending" | "signed" | "refused" | "expired" | "canceled";
  zapsign_token: string;
  zapsign_open_id?: string;
  original_file_url?: string;
  signed_file_url?: string;
  signatarios?: any[];
  created_at: string;
  updated_at?: string;
}

interface ZapSignDocResponse {
  token: string;
  open_id: string;
  status: string;
  name: string;
  original_file: string;
  signed_file?: string;
  signers: any[];
}

export const useFaciliSign = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const getAuthHeader = async (): Promise<string> => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) throw new Error("Usuario nao autenticado");
    return `Bearer ${token}`;
  };

  const uploadAndCreateDocument = async (
    file: File,
    title: string,
    signatarios: Signatario[],
    options?: {
      sendEmail?: boolean;
      sendWhatsapp?: boolean;
      dateLimitToSign?: string;
    }
  ): Promise<ZapSignDocResponse> => {
    setUploading(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64Pdf = await base64Promise;

      const signers = signatarios.map((sig) => ({
        name: sig.nome,
        email: sig.email,
        phone_country: "55",
        phone_number: sig.telefone?.replace(/\D/g, "").slice(-11) || "",
        cpf: sig.cpf?.replace(/\D/g, "") || "",
        auth_mode: "assinaturaTela",
        send_automatic_email: options?.sendEmail ?? true,
        send_automatic_whatsapp: options?.sendWhatsapp ?? false,
        require_cpf: true,
      }));

      const authHeader = await getAuthHeader();

      const response = await fetch("/api/zapsign/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          name: title,
          base64_pdf: base64Pdf,
          signers,
          lang: "pt-br",
          date_limit_to_sign: options?.dateLimitToSign,
          folder_path: "/facilita-adv/",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao criar documento: ${errorText}`);
      }

      const result = await response.json();

      await saveDocumentToDatabase({
        nome: title,
        zapsign_token: result.token,
        zapsign_open_id: result.open_id,
        status: result.status || "pending",
        original_file_url: result.original_file,
        signatarios: result.signers,
      });

      toast({
        title: "Documento enviado",
        description: "Documento enviado para assinatura com sucesso!",
      });

      return result;
    } catch (error) {
      console.error("Erro no upload:", error);
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const createDocumentFromUrl = async (
    pdfUrl: string,
    title: string,
    signatarios: Signatario[],
    options?: {
      sendEmail?: boolean;
      sendWhatsapp?: boolean;
      dateLimitToSign?: string;
    }
  ): Promise<ZapSignDocResponse> => {
    setUploading(true);
    try {
      const signers = signatarios.map((sig) => ({
        name: sig.nome,
        email: sig.email,
        phone_country: "55",
        phone_number: sig.telefone?.replace(/\D/g, "").slice(-11) || "",
        cpf: sig.cpf?.replace(/\D/g, "") || "",
        auth_mode: "assinaturaTela",
        send_automatic_email: options?.sendEmail ?? true,
        send_automatic_whatsapp: options?.sendWhatsapp ?? false,
        require_cpf: true,
      }));

      const authHeader = await getAuthHeader();

      const response = await fetch("/api/zapsign/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          name: title,
          url_pdf: pdfUrl,
          signers,
          lang: "pt-br",
          date_limit_to_sign: options?.dateLimitToSign,
          folder_path: "/facilita-adv/",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao criar documento: ${errorText}`);
      }

      const result = await response.json();

      await saveDocumentToDatabase({
        nome: title,
        zapsign_token: result.token,
        zapsign_open_id: result.open_id,
        status: result.status || "pending",
        original_file_url: result.original_file,
        signatarios: result.signers,
      });

      toast({
        title: "Documento enviado",
        description: "Documento enviado para assinatura com sucesso!",
      });

      return result;
    } catch (error) {
      console.error("Erro ao criar documento:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const saveDocumentToDatabase = async (doc: {
    nome: string;
    zapsign_token: string;
    zapsign_open_id?: string;
    status: string;
    original_file_url?: string;
    signatarios?: any[];
  }) => {
    const session = await supabase.auth.getSession();
    const userId = session.data.session?.user?.id;

    if (!userId) {
      console.error("Usuario nao autenticado");
      return;
    }

    const { error } = await supabase.from("documentos_digitais").insert({
      user_id: userId,
      nome: doc.nome,
      tipo: "application/pdf",
      status: mapZapSignStatus(doc.status),
      docuseal_template_id: doc.zapsign_token,
      docuseal_submission_id: doc.zapsign_open_id || null,
      signatarios: doc.signatarios,
      webhook_data: {
        original_file_url: doc.original_file_url,
        provider: "zapsign",
      },
    });

    if (error) {
      console.error("Erro ao salvar documento:", error);
    }
  };

  const mapZapSignStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: "ENVIADO_PARA_ASSINATURA",
      signed: "ASSINADO",
      refused: "RECUSADO",
      expired: "EXPIRADO",
      canceled: "RECUSADO",
    };
    return statusMap[status] || "ENVIADO_PARA_ASSINATURA";
  };

  const getDocument = async (token: string): Promise<ZapSignDocResponse> => {
    setLoading(true);
    try {
      const authHeader = await getAuthHeader();

      const response = await fetch(`/api/zapsign/documents/${token}`, {
        headers: {
          Authorization: authHeader,
        },
      });

      if (!response.ok) {
        throw new Error("Falha ao buscar documento");
      }

      return await response.json();
    } catch (error) {
      console.error("Erro ao buscar documento:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getDocuments = async (
    page: number = 1,
    pageSize: number = 10
  ): Promise<DocumentoFaciliSign[]> => {
    try {
      const { data, error } = await supabase
        .from("documentos_digitais")
        .select("*")
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) {
        console.error("Erro ao buscar documentos:", error);
        return [];
      }

      return data.map((doc: any) => {
        const webhookData = doc.webhook_data || {};
        return {
          id: doc.id,
          nome: doc.nome,
          status: reverseMapStatus(doc.status),
          zapsign_token: doc.docuseal_template_id || "",
          zapsign_open_id: doc.docuseal_submission_id,
          original_file_url: webhookData.original_file_url,
          signed_file_url: webhookData.signed_file_url,
          signatarios: doc.signatarios,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
        };
      });
    } catch (error) {
      console.error("Erro ao buscar documentos:", error);
      return [];
    }
  };

  const reverseMapStatus = (status: string): DocumentoFaciliSign["status"] => {
    const statusMap: Record<string, DocumentoFaciliSign["status"]> = {
      ENVIADO_PARA_ASSINATURA: "pending",
      TEMPLATE_CRIADO: "pending",
      ASSINADO: "signed",
      RECUSADO: "refused",
      EXPIRADO: "expired",
    };
    return statusMap[status] || "pending";
  };

  const refreshDocumentStatus = async (token: string): Promise<void> => {
    try {
      const docData = await getDocument(token);

      const { data: existingDoc } = await supabase
        .from("documentos_digitais")
        .select("webhook_data")
        .eq("docuseal_template_id", token)
        .single();

      const existingWebhookData = (typeof existingDoc?.webhook_data === 'object' && existingDoc?.webhook_data !== null) 
        ? existingDoc.webhook_data as Record<string, unknown>
        : {};

      const { error } = await supabase
        .from("documentos_digitais")
        .update({
          status: mapZapSignStatus(docData.status),
          webhook_data: {
            ...existingWebhookData,
            signed_file_url: docData.signed_file,
            original_file_url: docData.original_file,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("docuseal_template_id", token);

      if (error) {
        console.error("Erro ao atualizar status:", error);
      }
    } catch (error) {
      console.error("Erro ao atualizar documento:", error);
    }
  };

  const deleteDocument = async (token: string): Promise<boolean> => {
    setLoading(true);
    try {
      const authHeader = await getAuthHeader();

      const response = await fetch(`/api/zapsign/documents/${token}`, {
        method: "DELETE",
        headers: {
          Authorization: authHeader,
        },
      });

      if (!response.ok) {
        throw new Error("Falha ao excluir documento");
      }

      await supabase
        .from("documentos_digitais")
        .delete()
        .eq("docuseal_template_id", token);

      toast({
        title: "Documento excluido",
        description: "Documento removido com sucesso",
      });

      return true;
    } catch (error) {
      console.error("Erro ao excluir documento:", error);
      toast({
        title: "Erro",
        description: "Falha ao excluir documento",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case "signed":
      case "ASSINADO":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
      case "ENVIADO_PARA_ASSINATURA":
      case "TEMPLATE_CRIADO":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "expired":
      case "EXPIRADO":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "refused":
      case "RECUSADO":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: "Pendente",
      signed: "Assinado",
      refused: "Recusado",
      expired: "Expirado",
      canceled: "Cancelado",
      ENVIADO_PARA_ASSINATURA: "Pendente",
      TEMPLATE_CRIADO: "Aguardando",
      ASSINADO: "Assinado",
      RECUSADO: "Recusado",
      EXPIRADO: "Expirado",
    };
    return labels[status] || status;
  };

  return {
    loading,
    uploading,
    uploadAndCreateDocument,
    createDocumentFromUrl,
    getDocument,
    getDocuments,
    refreshDocumentStatus,
    deleteDocument,
    getStatusBadgeColor,
    getStatusLabel,
  };
};
