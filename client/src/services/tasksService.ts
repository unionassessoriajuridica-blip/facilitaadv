import { supabase } from "@/integrations/supabase/client";

export interface Task {
  id: string;
  process_id: string;
  title: string;
  description: string | null;
  due_date: string;
  status: string;
  priority: string;
  notify_client: boolean;
  notification_sent: boolean;
  synced_with_google: boolean;
  created_at: string;
}

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Usuario nao autenticado');
  }
  return session.access_token;
}

async function callEdgeFunction(
  method: string,
  params?: Record<string, string>,
  body?: Record<string, any>
): Promise<any> {
  const token = await getAuthToken();
  
  // Usa proxy local para evitar problemas de CORS
  let url = `/api/supabase/functions/tasks-api`;
  
  if (params && Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(params).toString();
    url += `?${queryString}`;
  }

  console.log('[TasksService] Calling via proxy:', url);

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  if (body && (method === 'POST' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TasksService] Proxy error (${response.status}):`, errorText);
      let errorMessage = 'Erro na operacao';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const text = await response.text();
    console.log('[TasksService] Response:', text);
    return text ? JSON.parse(text) : null;
  } catch (fetchError: any) {
    console.error('[TasksService] Fetch error:', fetchError.message);
    throw fetchError;
  }
}

export async function getTasksByProcessId(processId: string): Promise<Task[]> {
  try {
    const data = await callEdgeFunction('GET', { process_id: processId });
    return (data as Task[]) || [];
  } catch (error: any) {
    console.error('[TasksService] Error loading tasks:', error);
    throw error;
  }
}

export async function getAllPendingTasks(): Promise<Task[]> {
  try {
    const data = await callEdgeFunction('GET', { status: 'pending' });
    return (data as Task[]) || [];
  } catch (error: any) {
    console.error('[TasksService] Error loading pending tasks:', error);
    throw error;
  }
}

export async function createTask(task: {
  process_id: string;
  title: string;
  description?: string | null;
  due_date: string;
  priority: string;
  status?: string;
}): Promise<Task> {
  const data = await callEdgeFunction('POST', undefined, {
    process_id: task.process_id,
    title: task.title,
    description: task.description || null,
    due_date: task.due_date,
    priority: task.priority || 'medium',
    status: task.status || 'pending'
  });

  return data as Task;
}

export async function updateTaskStatus(taskId: string, status: string): Promise<boolean> {
  await callEdgeFunction('PATCH', { id: taskId }, { status });
  return true;
}

export async function deleteTask(taskId: string): Promise<boolean> {
  await callEdgeFunction('DELETE', { id: taskId });
  return true;
}
