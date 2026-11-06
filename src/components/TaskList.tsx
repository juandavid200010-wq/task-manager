import { useState } from "react";
import type { Task } from "../types/task";

interface TaskListProps {
  tasks: Task[];
  onToggle: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onEdit: (
    taskId: string,
    data: { title: string; description: string }
  ) => Promise<void>;
}

interface TaskItemProps extends Omit<TaskListProps, "tasks"> {
  task: Task;
}

function TaskItem({ task, onToggle, onDelete, onEdit }: TaskItemProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!title.trim()) {
      setError("El título no puede estar vacío.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onEdit(task.id, { title: title.trim(), description });
      setEditing(false);
    } catch {
      setError("No se pudo guardar la tarea.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setTitle(task.title);
    setDescription(task.description);
    setError("");
    setEditing(false);
  };

  if (editing) {
    return (
      <li className="task-item">
        <div className="task-edit">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción"
          />
        </div>
        <div className="task-edit-actions">
          <button
            className="btn btn-primary btn-small"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
          <button
            className="btn btn-secondary btn-small"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancelar
          </button>
        </div>
        {error && <p className="message error">{error}</p>}
      </li>
    );
  }

  return (
    <li className={task.completed ? "task-item done" : "task-item"}>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task)}
        aria-label={`Marcar "${task.title}" como completada`}
      />
      <div className="task-content">
        <strong className="task-title">{task.title}</strong>
        {task.description && (
          <span className="task-description">{task.description}</span>
        )}
      </div>
      <div className="task-actions">
        <button className="btn btn-secondary btn-small" onClick={() => setEditing(true)}>
          Editar
        </button>
        <button className="btn btn-danger btn-small" onClick={() => onDelete(task.id)}>
          Eliminar
        </button>
      </div>
    </li>
  );
}

export function TaskList({ tasks, onToggle, onDelete, onEdit }: TaskListProps) {
  if (tasks.length === 0) {
    return <p className="empty">No tienes tareas todavía.</p>;
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </ul>
  );
}