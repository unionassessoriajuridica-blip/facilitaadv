import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { differenceInDays, parseISO, isToday, isPast } from "date-fns";
import { Task, getAllPendingTasks } from "@/services/tasksService";

export function NotificacoesTarefas() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const tasks = await getAllPendingTasks();
      
      const today = new Date();
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() + 5);
      
      const filtered = tasks.filter((task) => {
        const dueDate = parseISO(task.due_date);
        return dueDate <= limitDate;
      });
      
      setNotifications(filtered);
    } catch (error) {
      console.error("Erro ao carregar notificacoes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyBadge = (dueDate: string) => {
    const date = parseISO(dueDate);
    const daysRemaining = differenceInDays(date, new Date());

    if (isPast(date) || isToday(date)) {
      return (
        <Badge className="bg-red-500 text-white">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {isToday(date) ? "Vence Hoje" : "Vencida"}
        </Badge>
      );
    }

    if (daysRemaining === 1) {
      return (
        <Badge className="bg-orange-500 text-white">
          Amanha
        </Badge>
      );
    }

    if (daysRemaining <= 3) {
      return (
        <Badge className="bg-yellow-500 text-white">
          {daysRemaining} dias
        </Badge>
      );
    }

    return (
      <Badge className="bg-blue-500 text-white">
        {daysRemaining} dias
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
        <CardContent className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
        </CardContent>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-600" />
          Tarefas Proximas ({notifications.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {notifications.slice(0, 5).map((notification) => (
          <div
            key={notification.id}
            className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/60 dark:bg-slate-800/60 hover-elevate cursor-pointer"
            onClick={() => navigate(`/processo/${notification.process_id}`)}
            data-testid={`notification-${notification.id}`}
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{notification.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {notification.description || "Tarefa pendente"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getUrgencyBadge(notification.due_date)}
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        ))}
        {notifications.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2"
            onClick={() => navigate("/tarefas")}
            data-testid="button-ver-todas-tarefas"
          >
            Ver todas ({notifications.length})
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
