import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { UserCircle, Edit, Save, X } from 'lucide-react';

interface ResponsavelFinanceiroData {
  id?: string;
  nome: string;
  rg: string;
  cpf: string;
  data_nascimento: string;
  telefone: string;
  email: string;
  endereco_completo: string;
  cep: string;
}

export function ResponsavelFinanceiro() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<ResponsavelFinanceiroData>({
    nome: '',
    rg: '',
    cpf: '',
    data_nascimento: '',
    telefone: '',
    email: '',
    endereco_completo: '',
    cep: ''
  });

  useEffect(() => {
    if (user) {
      fetchResponsavelFinanceiro();
    }
  }, [user]);

  const fetchResponsavelFinanceiro = async () => {
    if (!user) return;

    try {
      // Sistema GLOBAL: Todos usuários veem TODOS os responsáveis financeiros
      const { data: responsavel, error } = await supabase
        .from('responsavel_financeiro')
        .select('*')
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (responsavel) {
        setData(responsavel);
      } else {
        setEditing(true); // Se não existe, já entra em modo de edição
      }
    } catch (error) {
      console.error('Erro ao buscar responsável financeiro:', error);
      toast.error('Erro ao carregar dados do responsável financeiro');
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const payload = {
        ...data,
        user_id: user.id
      };

      if (data.id) {
        // Atualizar
        const { error } = await supabase
          .from('responsavel_financeiro')
          .update(payload)
          .eq('id', data.id);

        if (error) throw error;
        toast.success('Dados atualizados com sucesso!');
      } else {
        // Inserir
        const { data: inserted, error } = await supabase
          .from('responsavel_financeiro')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        setData(inserted);
        toast.success('Responsável financeiro cadastrado com sucesso!');
      }

      setEditing(false);
    } catch (error) {
      console.error('Erro ao salvar responsável financeiro:', error);
      toast.error('Erro ao salvar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (data.id) {
      fetchResponsavelFinanceiro(); // Recarrega os dados originais
      setEditing(false);
    } else {
      // Se é um novo cadastro, limpa os dados
      setData({
        nome: '',
        rg: '',
        cpf: '',
        data_nascimento: '',
        telefone: '',
        email: '',
        endereco_completo: '',
        cep: ''
      });
      setEditing(false);
    }
  };

  const handleInputChange = (field: keyof ResponsavelFinanceiroData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <UserCircle className="h-5 w-5" />
          Responsável Financeiro
        </CardTitle>
        {!editing && data.id && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}
        {editing && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <Input
              id="nome"
              value={data.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              disabled={!editing}
              placeholder="Digite o nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rg">RG</Label>
            <Input
              id="rg"
              value={data.rg}
              onChange={(e) => handleInputChange('rg', e.target.value)}
              disabled={!editing}
              placeholder="Digite o RG"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={data.cpf}
              onChange={(e) => handleInputChange('cpf', e.target.value)}
              disabled={!editing}
              placeholder="Digite o CPF"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_nascimento">Data de Nascimento</Label>
            <Input
              id="data_nascimento"
              type="date"
              value={data.data_nascimento}
              onChange={(e) => handleInputChange('data_nascimento', e.target.value)}
              disabled={!editing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={data.telefone}
              onChange={(e) => handleInputChange('telefone', e.target.value)}
              disabled={!editing}
              placeholder="Digite o telefone"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={!editing}
              placeholder="Digite o e-mail"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
            <Input
              id="cep"
              value={data.cep}
              onChange={(e) => handleInputChange('cep', e.target.value)}
              disabled={!editing}
              placeholder="Digite o CEP"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="endereco_completo">Endereço Completo</Label>
          <Textarea
            id="endereco_completo"
            value={data.endereco_completo}
            onChange={(e) => handleInputChange('endereco_completo', e.target.value)}
            disabled={!editing}
            placeholder="Digite o endereço completo"
            rows={3}
          />
        </div>

        {!data.id && !editing && (
          <div className="flex justify-center">
            <Button onClick={() => setEditing(true)}>
              <UserCircle className="h-4 w-4 mr-2" />
              Cadastrar Responsável Financeiro
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}