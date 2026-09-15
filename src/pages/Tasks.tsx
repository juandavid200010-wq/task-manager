import { useTasks } from "../hooks/useTasks";
import { useAuth } from "../hooks/useAuth";
import { TaskForm } from "../components/TaskForm";
import { TaskList } from "../components/TaskList";

export function Tasks() {
    const { logout } = useAuth();
    const { tasks, loading, error, addTask, removeTask, toggleComplete } = useTasks();

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
        </div>
    );
}