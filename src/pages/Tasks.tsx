import { useState } from "react";
import { useTasks } from "../hooks/useTasks";
import { useAuth } from "../hooks/useAuth";
import { TaskForm } from "../components/TaskForm";
import { TaskList } from "../components/TaskList";
import { sendTaskSummary } from "../services/email";

export function Tasks() {
  const { logout, user } = useAuth();
  const { tasks, loading, error, addTask, editTask, removeTask, toggleComplete } =
    useTasks();
  const [sending, setSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");

  const handleSendSummary = async () => {
    if (!user) return;
    setSending(true);
    setEmailStatus("");
    try {
      const token = await user.getIdToken();
      await sendTaskSummary(
        token,
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
    <main className="container">
      <header className="page-header">
        <div>
          <h1>Mis tareas</h1>
          {user?.email && <span className="user-email">{user.email}</span>}
        </div>
        <button className="btn btn-secondary btn-small" onClick={() => logout()}>
          Cerrar sesión
        </button>
      </header>

      <section className="card">
        <h2 className="section-title">Nueva tarea</h2>
        <TaskForm onAdd={addTask} />
      </section>

      <section>
        {loading && <p className="empty">Cargando tareas...</p>}
        {error && (
          <p className="message error" role="alert">
            {error}
          </p>
        )}
        {!loading && (
          <TaskList
            tasks={tasks}
            onToggle={toggleComplete}
            onDelete={removeTask}
            onEdit={editTask}
          />
        )}
      </section>

      <section className="card summary">
        <h2 className="section-title">Resumen por email</h2>
        <p className="hint">
          El resumen se envía al correo de tu cuenta. Como AWS SES está en modo de
          pruebas (sandbox), solo funciona con correos verificados en SES.
        </p>
        <button
          className="btn btn-primary"
          onClick={handleSendSummary}
          disabled={sending || tasks.length === 0}
        >
          {sending ? "Enviando..." : "Enviar resumen por email"}
        </button>
        {emailStatus && (
          <p
            className={
              emailStatus.startsWith("Error") ? "message error" : "message success"
            }
          >
            {emailStatus}
          </p>
        )}
      </section>
    </main>
  );
}