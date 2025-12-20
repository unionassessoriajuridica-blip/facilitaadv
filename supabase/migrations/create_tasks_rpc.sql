-- RPC functions for tasks management (bypasses PostgREST schema cache)

-- Get tasks by process ID
CREATE OR REPLACE FUNCTION get_tasks_by_process(p_process_id UUID)
RETURNS TABLE (
    id UUID,
    process_id UUID,
    title VARCHAR(255),
    description TEXT,
    due_date DATE,
    status VARCHAR(50),
    priority VARCHAR(50),
    notify_client BOOLEAN,
    notification_sent BOOLEAN,
    synced_with_google BOOLEAN,
    created_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.process_id, t.title, t.description, t.due_date, 
           t.status, t.priority, t.notify_client, t.notification_sent, 
           t.synced_with_google, t.created_at
    FROM public.tasks t
    WHERE t.process_id = p_process_id
    ORDER BY t.due_date ASC;
END;
$$;

-- Get all pending tasks
CREATE OR REPLACE FUNCTION get_pending_tasks()
RETURNS TABLE (
    id UUID,
    process_id UUID,
    title VARCHAR(255),
    description TEXT,
    due_date DATE,
    status VARCHAR(50),
    priority VARCHAR(50),
    notify_client BOOLEAN,
    notification_sent BOOLEAN,
    synced_with_google BOOLEAN,
    created_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.process_id, t.title, t.description, t.due_date, 
           t.status, t.priority, t.notify_client, t.notification_sent, 
           t.synced_with_google, t.created_at
    FROM public.tasks t
    WHERE t.status = 'pending'
    ORDER BY t.due_date ASC;
END;
$$;

-- Create a new task
CREATE OR REPLACE FUNCTION create_task(
    p_process_id UUID,
    p_title VARCHAR(255),
    p_description TEXT DEFAULT NULL,
    p_due_date DATE DEFAULT NULL,
    p_priority VARCHAR(50) DEFAULT 'medium',
    p_status VARCHAR(50) DEFAULT 'pending'
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO public.tasks (process_id, title, description, due_date, priority, status)
    VALUES (p_process_id, p_title, p_description, p_due_date, p_priority, p_status)
    RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$;

-- Update task status
CREATE OR REPLACE FUNCTION update_task_status(p_task_id UUID, p_status VARCHAR(50))
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE public.tasks
    SET status = p_status
    WHERE id = p_task_id;
    
    RETURN FOUND;
END;
$$;

-- Delete a task
CREATE OR REPLACE FUNCTION delete_task(p_task_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    DELETE FROM public.tasks WHERE id = p_task_id;
    RETURN FOUND;
END;
$$;
