import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StickyNote, Plus, Edit, Trash2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Observacao {
  id: string;
  titulo: string;
  conteudo: string;
  created_at: string;
  updated_at: string;
}

interface ProcessNotesProps {
  clienteNome: string;
  observacoes: Observacao[];
  onObservacoesChange: (observacoes: Observacao[]) => void;
}

const ProcessNotes = ({ clienteNome, observacoes, onObservacoesChange }: ProcessNotesProps) => {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novoConteudo, setNovoConteudo] = useState("");

  const handleAddNote = () => {
    if (!novoTitulo.trim() || !novoConteudo.trim()) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Título e conteúdo são obrigatórios.",
      });
      return;
    }

    const novaObservacao: Observacao = {
      id: Date.now().toString(), // Temporário - será substituído pelo ID real do banco
      titulo: novoTitulo.trim(),
      conteudo: novoConteudo.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    onObservacoesChange([...observacoes, novaObservacao]);
    
    // Limpar formulário
    setNovoTitulo("");
    setNovoConteudo("");
    setShowAddForm(false);

    toast({
      title: "Observação adicionada!",
      description: "A observação será salva quando finalizar o cadastro.",
    });
  };

  const handleEditNote = (id: string) => {
    const observacao = observacoes.find(obs => obs.id === id);
    if (observacao) {
      setNovoTitulo(observacao.titulo);
      setNovoConteudo(observacao.conteudo);
      setEditingId(id);
      setShowAddForm(true);
    }
  };

  const handleUpdateNote = () => {
    if (!novoTitulo.trim() || !novoConteudo.trim()) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Título e conteúdo são obrigatórios.",
      });
      return;
    }

    const observacoesAtualizadas = observacoes.map(obs => 
      obs.id === editingId 
        ? { 
            ...obs, 
            titulo: novoTitulo.trim(), 
            conteudo: novoConteudo.trim(),
            updated_at: new Date().toISOString()
          }
        : obs
    );

    onObservacoesChange(observacoesAtualizadas);
    
    // Limpar formulário
    setNovoTitulo("");
    setNovoConteudo("");
    setShowAddForm(false);
    setEditingId(null);

    toast({
      title: "Observação atualizada!",
      description: "As alterações serão salvas quando finalizar o cadastro.",
    });
  };

  const handleRemoveNote = (id: string) => {
    const observacoesAtualizadas = observacoes.filter(obs => obs.id !== id);
    onObservacoesChange(observacoesAtualizadas);

    toast({
      title: "Observação removida",
      description: "A observação foi excluída.",
    });
  };

  const handleCancelEdit = () => {
    setNovoTitulo("");
    setNovoConteudo("");
    setShowAddForm(false);
    setEditingId(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StickyNote className="w-5 h-5" />
            Observações e Anotações
          </div>
          {!showAddForm && (
            <Button size="sm" onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Nova Observação
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulário de Nova/Editar Observação */}
        {showAddForm && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <h4 className="font-medium mb-4">
              {editingId ? "Editar Observação" : "Nova Observação"}
            </h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  placeholder="Ex: Documentos pendentes, Estratégia processual..."
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {novoTitulo.length}/100 caracteres
                </p>
              </div>

              <div>
                <Label htmlFor="conteudo">Conteúdo *</Label>
                <Textarea
                  id="conteudo"
                  value={novoConteudo}
                  onChange={(e) => setNovoConteudo(e.target.value)}
                  placeholder="Descreva detalhes importantes sobre o cliente ou processo..."
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {novoConteudo.length}/1000 caracteres
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={editingId ? handleUpdateNote : handleAddNote}
                  size="sm"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {editingId ? "Atualizar" : "Adicionar"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  size="sm"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Observações */}
        {observacoes.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Observações Cadastradas ({observacoes.length})</h4>
            {observacoes.map((observacao) => (
              <div key={observacao.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h5 className="font-medium">{observacao.titulo}</h5>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {new Date(observacao.created_at).toLocaleDateString('pt-BR')}
                      </Badge>
                      {observacao.updated_at !== observacao.created_at && (
                        <Badge variant="secondary" className="text-xs">
                          Editado em {new Date(observacao.updated_at).toLocaleDateString('pt-BR')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditNote(observacao.id)}
                      disabled={showAddForm}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveNote(observacao.id)}
                      className="text-red-600 hover:text-red-700"
                      disabled={showAddForm}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {observacao.conteudo}
                </p>
              </div>
            ))}
          </div>
        )}

        {observacoes.length === 0 && !showAddForm && (
          <div className="text-center py-8 text-muted-foreground">
            <StickyNote className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma observação cadastrada ainda.</p>
            <p className="text-xs">
              Adicione anotações importantes sobre o cliente ou processo.
            </p>
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Dica:</strong> Use este espaço para registrar informações importantes como:
            estratégias processuais, documentos pendentes, peculiaridades do cliente, 
            prazos especiais, ou qualquer observação relevante para o acompanhamento do processo.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessNotes;