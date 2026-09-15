import type { Task } from "../types/task";

interface TaskListProps {
  tasks: Task[];
  onToggle: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function TaskList({ tasks, onToggle, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return <p>No tienes tareas todavía.</p>;
  }

  return (
    <ul>
      {tasks.map((task) => (
        <li key={task.id}>
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggle(task)}
          />
          <span style={{ textDecoration: task.completed ? "line-through" : "none" }}>
            <strong>{task.title}</strong>
            {task.description && ` — ${task.description}`}
          </span>
          <button onClick={() => onDelete(task.id)}>Eliminar</button>
        </li>
      ))}
    </ul>
  );
}