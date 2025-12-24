import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Camera, Save, Loader2 } from "lucide-react";

const funcoes = [
  { value: "administrador", label: "Administrador" },
  { value: "advogado", label: "Advogado(a)" },
  { value: "assessor_financeiro", label: "Assessor Financeiro" },
  { value: "assessor_juridico", label: "Assessor Juridico" },
];

export default function UserProfile() {
  const navigate = useNavigate();
  const { user, refetch } = useAuth();
  const { toast } = useToast();
  
  const [nome, setNome] = useState("");
  const [funcao, setFuncao] = useState("advogado");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser?.user_metadata) {
        setNome(authUser.user_metadata.nome || authUser.user_metadata.full_name || "");
        setFuncao(authUser.user_metadata.funcao || "advogado");
        setAvatarUrl(authUser.user_metadata.avatar_url || null);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: "O avatar deve ter no maximo 2MB.",
        variant: "destructive",
      });
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Formato invalido",
        description: "Use imagens JPG, PNG, GIF ou WebP.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        if (uploadError.message.includes("Bucket not found")) {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64 = reader.result as string;
            setAvatarUrl(base64);
            toast({
              title: "Avatar atualizado",
              description: "Clique em Salvar para confirmar.",
            });
          };
          reader.readAsDataURL(file);
        } else {
          throw uploadError;
        }
      } else {
        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        setAvatarUrl(urlData.publicUrl);
        toast({
          title: "Avatar carregado",
          description: "Clique em Salvar para confirmar.",
        });
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast({
        title: "Erro no upload",
        description: "Nao foi possivel carregar a imagem.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          nome: nome,
          full_name: nome,
          funcao: funcao,
          avatar_url: avatarUrl,
        },
      });

      if (error) throw error;

      await refetch();

      toast({
        title: "Perfil atualizado",
        description: "Suas informacoes foram salvas com sucesso.",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      toast({
        title: "Erro ao salvar",
        description: "Nao foi possivel atualizar o perfil.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getFuncaoLabel = (value: string) => {
    return funcoes.find((f) => f.value === value)?.label || value;
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
      <header className="w-full bg-slate-900 text-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="text-white"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-lg">Meu Perfil</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informacoes do Perfil
            </CardTitle>
            <CardDescription>
              Atualize suas informacoes pessoais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={avatarUrl || undefined} alt={nome} />
                  <AvatarFallback className="text-2xl bg-amber-500 text-white">
                    {nome ? getInitials(nome) : <User className="w-10 h-10" />}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-amber-500 text-white p-2 rounded-full cursor-pointer hover:bg-amber-600 transition-colors"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploading}
                  data-testid="input-avatar"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Clique no icone para alterar a foto
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-muted"
                data-testid="input-email"
              />
              <p className="text-xs text-muted-foreground">
                O email nao pode ser alterado
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome completo"
                data-testid="input-nome"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="funcao">Funcao</Label>
              <Select value={funcao} onValueChange={setFuncao}>
                <SelectTrigger id="funcao" data-testid="select-funcao">
                  <SelectValue placeholder="Selecione sua funcao" />
                </SelectTrigger>
                <SelectContent>
                  {funcoes.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-amber-500 hover:bg-amber-600"
                data-testid="button-save"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alteracoes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
