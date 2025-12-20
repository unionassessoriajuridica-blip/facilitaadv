import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Calendar,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  Trash2,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, parseISO, isToday, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Task,
  getTasksByProcessId,
  createTask,
  updateTaskStatus,
  deleteTask,
} from "@/services/tasksService";

interface ProcessoTarefasProps {
  processoId: string;
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Baixa", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  medium: { label: "Normal", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  high: { label: "Alta", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  urgent: { label: "Urgente", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
};

export function ProcessoTarefas({ processoId }: ProcessoTarefasProps) {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "medium",
  });

  useEffect(() => {
    if (processoId) {
      loadTasks();
    }
  }, [processoId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await getTasksByProcessId(processoId);
      setTasks(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar tarefas:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Falha ao carregar tarefas",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.due_date) {
      toast({
        variant: "destructive",
        title: "Campos obrigatorios",
        description: "Preencha o titulo e a data de vencimento",
      });
      return;
    }

    try {
      setSaving(true);
      await createTask({
        process_id: processoId,
        title: newTask.title,
        description: newTask.description || null,
        due_date: newTask.due_date,
        priority: newTask.priority,
        status: "pending",
      });

      toast({
        title: "Tarefa criada",
        description: "A tarefa foi adicionada com sucesso",
      });

      setNewTask({
        title: "",
        description: "",
        due_date: "",
        priority: "medium",
      });
      setDialogOpen(false);
      loadTasks();
    } catch (error: any) {
      console.error("Erro ao criar tarefa:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Falha ao criar tarefa",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    try {
      const newStatus = task.status === "completed" ? "pending" : "completed";
      await updateTaskStatus(task.id, newStatus);

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: newStatus } : t
        )
      );
    } catch (error: any) {
      console.error("Erro ao atualizar tarefa:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Falha ao atualizar tarefa",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast({
        title: "Tarefa removida",
        description: "A tarefa foi excluida com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao deletar tarefa:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Falha ao excluir tarefa",
      });
    }
  };

  const getStatusInfo = (task: Task) => {
    if (task.status === "completed") {
      return {
        icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
        text: "Concluida",
        color: "text-green-600 dark:text-green-400",
      };
    }

    const dueDate = parseISO(task.due_date);
    const daysRemaining = differenceInDays(dueDate, new Date());

    if (isPast(dueDate) && !isToday(dueDate)) {
      return {
        icon: <AlertCircle className="w-4 h-4 text-red-500" />,
        text: "Vencida",
        color: "text-red-600 dark:text-red-400",
      };
    }

    if (isToday(dueDate)) {
      return {
        icon: <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />,
        text: "Vence hoje!",
        color: "text-red-600 dark:text-red-400 font-bold",
      };
    }

    if (daysRemaining <= 1) {
      return {
        icon: <Clock className="w-4 h-4 text-orange-500" />,
        text: `Vence amanha`,
        color: "text-orange-600 dark:text-orange-400",
      };
    }

    if (daysRemaining <= 3) {
      return {
        icon: <Clock className="w-4 h-4 text-yellow-500" />,
        text: `${daysRemaining} dias`,
        color: "text-yellow-600 dark:text-yellow-400",
      };
    }

    return {
      icon: <Circle className="w-4 h-4 text-blue-500" />,
      text: `${daysRemaining} dias`,
      color: "text-blue-600 dark:text-blue-400",
    };
  };

  const pendingTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold">Tarefas do Processo</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-nova-tarefa">
              <Plus className="w-4 h-4 mr-2" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Tarefa</DialogTitle>
              <DialogDescription>
                Crie uma nova tarefa para este processo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Titulo *</label>
                <Input
                  placeholder="Ex: Preparar recurso"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  data-testid="input-titulo-tarefa"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descricao</label>
                <Textarea
                  placeholder="Detalhes da tarefa..."
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  data-testid="input-descricao-tarefa"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Data de Vencimento *</label>
                <Input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) =>
                    setNewTask({ ...newTask, due_date: e.target.value })
                  }
                  data-testid="input-data-tarefa"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Prioridade</label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) =>
                    setNewTask({ ...newTask, priority: value })
                  }
                >
                  <SelectTrigger data-testid="select-prioridade-tarefa">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAddTask}
                disabled={saving}
                className="w-full"
                data-testid="button-salvar-tarefa"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Tarefa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhuma tarefa cadastrada para este processo.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Clique em "Nova Tarefa" para adicionar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingTasks.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Circle className="w-4 h-4 text-blue-500" />
                  Pendentes ({pendingTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingTasks.map((task) => {
                  const statusInfo = getStatusInfo(task);
                  const priorityCfg = priorityConfig[task.priority] || priorityConfig.medium;
                  return (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover-elevate"
                      data-testid={`tarefa-${task.id}`}
                    >
                      <Checkbox
                        checked={task.status === "completed"}
                        onCheckedChange={() => handleToggleStatus(task)}
                        data-testid={`checkbox-tarefa-${task.id}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{task.title}</span>
                          <Badge
                            variant="secondary"
                            className={priorityCfg.color}
                          >
                            {priorityCfg.label}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        )}
                        <div className={`flex items-center gap-1 text-sm mt-2 ${statusInfo.color}`}>
                          {statusInfo.icon}
                          <span>
                            {format(parseISO(task.due_date), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </span>
                          <span className="mx-1">-</span>
                          <span>{statusInfo.text}</span>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteTask(task.id)}
                        data-testid={`button-delete-tarefa-${task.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {completedTasks.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Concluidas ({completedTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {completedTasks.map((task) => {
                  const priorityCfg = priorityConfig[task.priority] || priorityConfig.medium;
                  return (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50 opacity-70"
                      data-testid={`tarefa-concluida-${task.id}`}
                    >
                      <Checkbox
                        checked={true}
                        onCheckedChange={() => handleToggleStatus(task)}
                        data-testid={`checkbox-tarefa-${task.id}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium line-through">
                            {task.title}
                          </span>
                          <Badge
                            variant="secondary"
                            className={priorityCfg.color}
                          >
                            {priorityCfg.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm mt-2 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Concluida</span>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteTask(task.id)}
                        data-testid={`button-delete-tarefa-${task.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
