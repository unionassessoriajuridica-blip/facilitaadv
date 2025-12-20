-- Criar tabela tasks se nao existir
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  process_id uuid NOT NULL,
  title character varying NOT NULL,
  description text,
  due_date timestamp without time zone NOT NULL,
  status character varying DEFAULT 'pending'::character varying,
  priority character varying DEFAULT 'medium'::character varying,
  notify_client boolean DEFAULT false,
  notification_sent boolean DEFAULT false,
  notification_date timestamp without time zone,
  notification_channel character varying,
  synced_with_google boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_process_id_fkey FOREIGN KEY (process_id) REFERENCES public.processes(id)
);

-- Habilitar RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Criar policy para usuarios autenticados
CREATE POLICY "Usuarios autenticados podem gerenciar tasks" ON public.tasks
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Criar indice para melhor performance
CREATE INDEX IF NOT EXISTS idx_tasks_process_id ON public.tasks(process_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
