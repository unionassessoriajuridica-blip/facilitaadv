import * as React from "react";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.tsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx';
import { ArrowLeft, Plus, Users, Mail, Settings, Trash2, Shield, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast.ts';
import { supabase } from '@/integrations/supabase/client.ts';
import { useAuth } from '@/hooks/useAuth.ts';

interface UserInvitation {
  id: string;
  email: string;
  nome: string;
  permissions: string[];
  status: string;
  created_at: string;
  expires_at: string;
}

interface Permission {
  key: string;
  label: string;
  description: string;
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  { key: 'financeiro', label: 'Financeiro', description: 'Acesso ao módulo financeiro' },
  { key: 'ia_facilita', label: 'IA Facilita', description: 'Acesso ao assistente de IA' },
  { key: 'facilisign', label: 'FaciliSign', description: 'Acesso à assinatura digital' },
  { key: 'novo_processo', label: 'Novo Processo', description: 'Criar novos processos' },
  { key: 'google_integration', label: 'Integração Google', description: 'Acessar integrações Google' },
  { key: 'agenda', label: 'Agenda', description: 'Gerenciar agenda e calendário' },
  { key: 'modificar_clientes', label: 'Modificar Clientes', description: 'Editar dados de clientes' },
  { key: 'excluir_processo', label: 'Excluir Processo', description: 'Excluir processos do sistema' },
  { key: 'ver_todos_processos', label: 'Ver Todos Processos', description: 'Acesso a todos os processos do sistema' }
];

const UserManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    permissions: [] as string[]
  });

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('user_invitations' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations((data || []) as unknown as UserInvitation[]);
    } catch (error) {
      console.error('Error loading invitations:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar convites',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.email || formData.permissions.length === 0) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos e selecione pelo menos uma permissão',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Adiciona automaticamente ver_todos_processos se tiver permissões de modificação
      let finalPermissions = [...formData.permissions];
      const hasModificationPermissions = formData.permissions.some(p => 
        ['excluir_processo', 'modificar_clientes'].includes(p)
      );
      
      if (hasModificationPermissions && !formData.permissions.includes('ver_todos_processos')) {
        finalPermissions.push('ver_todos_processos');
      }

      const { data: invitation, error } = await supabase
        .from('user_invitations' as any)
        .insert({
          nome: formData.nome,
          email: formData.email,
          permissions: finalPermissions,
          invited_by: user?.id,
          token: generateToken(), // Função para gerar token único
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
          status: 'PENDING'
        })
        .select()
        .single();

      if (error) throw error;

      // Send invitation email
      try {
        await supabase.functions.invoke('send-invitation-email', {
          body: {
            invitationId: (invitation as any).id,
            email: formData.email,
            nome: formData.nome,
            inviterName: user?.email
          }
        });
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
        // Don't fail the invitation creation if email fails
      }

      toast({
        title: 'Convite enviado',
        description: `Convite enviado para ${formData.email}`,
      });

      setFormData({ nome: '', email: '', permissions: [] });
      setShowInviteDialog(false);
      loadInvitations();
    } catch (error: any) {
      console.error('Error creating invitation:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao enviar convite',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para gerar token único
  const generateToken = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  const handlePermissionChange = (permissionKey: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permissionKey]
        : prev.permissions.filter(p => p !== permissionKey)
    }));
  };

  const deleteInvitation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_invitations' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Convite removido',
        description: 'Convite removido com sucesso',
      });

      loadInvitations();
    } catch (error: any) {
      console.error('Error deleting invitation:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao remover convite',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    
    if (isExpired) {
      return (
        <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Expirado
        </Badge>
      );
    }

    switch (status) {
      case 'ACCEPTED':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Aceito
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pendente
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  const getPermissionLabel = (key: string) => {
    return AVAILABLE_PERMISSIONS.find(p => p.key === key)?.label || key;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
              <Badge className="bg-primary/10 text-primary">MASTER</Badge>
            </div>
          </div>

          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Convidar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Convidar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Convide um novo usuário e defina suas permissões no sistema.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Digite o nome completo"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="usuario@exemplo.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Permissões do Sistema</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Selecione quais funcionalidades o usuário poderá acessar.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {AVAILABLE_PERMISSIONS.map((permission) => (
                      <div key={permission.key} className="flex items-start space-x-2 p-3 border rounded-lg">
                        <Checkbox
                          id={permission.key}
                          checked={formData.permissions.includes(permission.key)}
                          onCheckedChange={(checked) => handlePermissionChange(permission.key, checked as boolean)}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label
                            htmlFor={permission.key}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {permission.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {permission.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Enviando...' : 'Enviar Convite'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowInviteDialog(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Convites</p>
                  <p className="text-3xl font-bold">{invitations.length}</p>
                </div>
                <Mail className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-3xl font-bold">
                    {invitations.filter(inv => inv.status === 'PENDING').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aceitos</p>
                  <p className="text-3xl font-bold">
                    {invitations.filter(inv => inv.status === 'ACCEPTED').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invitations Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Convites de Usuários
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Permissões</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data do Convite</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">{invitation.nome}</TableCell>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {invitation.permissions.slice(0, 3).map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {getPermissionLabel(permission)}
                          </Badge>
                        ))}
                        {invitation.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{invitation.permissions.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invitation.status, invitation.expires_at)}
                    </TableCell>
                    <TableCell>
                      {new Date(invitation.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteInvitation(invitation.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {invitations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Nenhum convite enviado ainda. Clique em "Convidar Usuário" para começar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserManagement;