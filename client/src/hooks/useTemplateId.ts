// src/hooks/useTemplateId.ts
import { supabase } from "@/integrations/supabase/client.ts";

export const useTemplateId = () => {
  const getTemplates = async (): Promise<Template[]> => {
    console.log("[DEBUG] Iniciando getTemplates...");
    try {
      const { data, error } = await supabase.functions.invoke(
        "docuseal-upload",
        {
          method: "GET",
          body: { path: "/templates" },
        }
      );

      console.log("[DEBUG] Resposta da Supabase Function:", { data, error });

      if (error) {
        console.error("[DEBUG] Erro na Supabase Function:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("[DEBUG] Falha crítica em getTemplates:", error);
      return [];
    }
  };

  const getTemplateDetails = async (id: number): Promise<Template | null> => {
    const { data, error } = await supabase.functions.invoke("docuseal-upload", {
      method: "POST",
      body: { action: "get_template", id },
      headers: { "Content-Type": "application/json" }, 
    });

    return error ? null : data;
  };

  return { getTemplates, getTemplateDetails };
};

interface Template {
  id: number;
  name: string;
  slug: string;
  documents: Array<{ url: string; filename: string }>;
}
