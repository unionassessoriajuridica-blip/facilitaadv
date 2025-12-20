import * as React from "react";
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast.ts";
import { supabase } from "@/integrations/supabase/client.ts";

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      validateInvitation();
    } else {
      setError("Token de convite não encontrado");
      setLoading(false);
    }
  }, [token]);

  const validateInvitation = async () => {
    try {
      const { data, error: validationError } = await supabase
        .from("user_invitations")
        .select("*")
        .eq("token", token);

      if (validationError) {
        console.error("Supabase error:", validationError);
        throw validationError;
      }

      if (!data || data.length === 0) {
        setError("Convite não encontrado");
        setLoading(false);
        return;
      }

      if (data.length > 1) {
        setError("Múltiplos convites encontrados. Contate o administrador.");
        setLoading(false);
        return;
      }

      const invitationData = data[0];

      // Check if invitation is expired
      if (new Date(invitationData.expires_at) < new Date()) {
        setError("Este convite expirou. Peça um novo convite.");
        setLoading(false);
        return;
      }

      // Check if already accepted
      if (invitationData.status === "ACCEPTED") {
        setError("Este convite já foi aceito");
        setLoading(false);
        return;
      }

      setInvitation(invitationData);
      setLoading(false);
    } catch (err: any) {
      console.error("Error validating invitation:", err);
      setError(err.message || "Erro ao validar convite");
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    setValidating(true);
    try {
      // First check if user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Redirect to signup with invitation token and pre-filled data
        navigate(
          `/auth?invitation_token=${token}&signup=true&email=${encodeURIComponent(
            invitation.email
          )}&name=${encodeURIComponent(invitation.nome)}`
        );
        return;
      }

      // Verificar se o convite já foi aceito (para evitar duplicação)
      const { data: currentInvitation, error: checkError } = await supabase
        .from("user_invitations")
        .select("status")
        .eq("token", token)
        .single();

      if (checkError) throw checkError;

      if (currentInvitation.status === "ACCEPTED") {
        toast({
          title: "Convite já aceito",
          description: "Este convite já foi aceito anteriormente.",
        });
        navigate("/dashboard");
        return;
      }

      // Atualizar status do convite para ACCEPTED
      const { error: acceptError } = await supabase
        .from("user_invitations")
        .update({
          status: "ACCEPTED",
          accepted_at: new Date().toISOString(),
          user_id: user.id,
        })
        .eq("token", token);

      if (acceptError) throw acceptError;

      // Adicionar permissões ao usuário
      if (invitation.permissions && invitation.permissions.length > 0) {
        const permissionsToInsert = invitation.permissions.map(
          (permission: string) => ({
            user_id: user.id,
            permission: permission,
            granted_by: invitation.invited_by,
          })
        );

        // Adiciona permissão de ver todos processos se tiver permissões de modificação
        const hasModificationPermissions = invitation.permissions.some(
          (p: string) => ["excluir_processo", "modificar_clientes"].includes(p)
        );

        if (
          hasModificationPermissions &&
          !invitation.permissions.includes("ver_todos_processos")
        ) {
          permissionsToInsert.push({
            user_id: user.id,
            permission: "ver_todos_processos",
            granted_by: invitation.invited_by,
          });
        }

        const { error: permissionError } = await supabase
          .from("user_permissions")
          .insert(permissionsToInsert);

        if (permissionError) {
          console.error("Erro ao adicionar permissões:", permissionError);
        }
      }

      toast({
        title: "Convite aceito!",
        description: "Suas permissões foram concedidas com sucesso.",
      });

      navigate("/dashboard");
    } catch (err: any) {
      console.error("Error accepting invitation:", err);
      toast({
        title: "Erro",
        description: err.message || "Falha ao aceitar convite",
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Validando convite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">
              <XCircle className="w-12 h-12 mx-auto mb-4" />
              Erro no Convite
            </CardTitle>
            <CardDescription className="text-center">{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para o início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            Convite Recebido
          </CardTitle>
          <CardDescription className="text-center">
            Você foi convidado para acessar o FacilitaAdv
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="font-semibold">{invitation.nome}</p>
            <p className="text-muted-foreground">{invitation.email}</p>
          </div>

          {invitation.permissions && invitation.permissions.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Permissões concedidas:</h4>
              <div className="flex flex-wrap gap-1">
                {invitation.permissions.map((permission: string) => (
                  <Badge key={permission} variant="secondary">
                    {permission}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button
            className="w-full"
            onClick={acceptInvitation}
            disabled={validating}
          >
            {validating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processando...
              </>
            ) : (
              "Aceitar Convite"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitation;
