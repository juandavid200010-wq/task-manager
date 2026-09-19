import { useState } from "react";
import { useTasks } from "../hooks/useTasks";
import { useAuth } from "../hooks/useAuth";
import { TaskForm } from "../components/TaskForm";
import { TaskList } from "../components/TaskList";
import { sendTaskSummary } from "../services/email";

export function Tasks() {
  const { logout, user } = useAuth();
  const { tasks, loading, error, addTask, removeTask, toggleComplete } = useTasks();
  const [sending, setSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");

  const handleSendSummary = async () => {
    if (!user?.email) return;
    setSending(true);
    setEmailStatus("");
    try {
      await sendTaskSummary(
        user.email,
        tasks.map((t) => ({ title: t.title, completed: t.completed }))
      );
      setEmailStatus("Resumen enviado correctamente.");
    } catch (err) {
      setEmailStatus("Error al enviar el resumen.");
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h1>Mis tareas</h1>
      <button onClick={() => logout()}>Cerrar sesión</button>

      <TaskForm onAdd={addTask} />

      {loading && <p>Cargando tareas...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && (
        <TaskList tasks={tasks} onToggle={toggleComplete} onDelete={removeTask} />
      )}

      <button onClick={handleSendSummary} disabled={sending || tasks.length === 0}>
        {sending ? "Enviando..." : "Enviar resumen por email"}
      </button>
      {emailStatus && <p>{emailStatus}</p>}
    </div>
  );
}