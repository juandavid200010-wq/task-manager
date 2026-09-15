import { useState, useEffect } from "react";
import { subscribeToTasks, createTask, updateTask, deleteTask } from "../services/tasks";
import { useAuth } from "./useAuth";
import type { Task } from "../types/task";

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToTasks(
      user.uid,
      (newTasks) => {
        setTasks(newTasks);
        setLoading(false);
        setError("");
      },
      (err) => {
        setError("No se pudieron cargar las tareas.");
        setLoading(false);
        console.error(err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addTask = async (title: string, description: string) => {
    if (!user) return;
    await createTask(user.uid, title, description);
  };

  const editTask = async (
    taskId: string,
    data: { title?: string; description?: string; completed?: boolean }
  ) => {
    await updateTask(taskId, data);
  };

  const removeTask = async (taskId: string) => {
    await deleteTask(taskId);
  };

  const toggleComplete = async (task: Task) => {
    await updateTask(task.id, { completed: !task.completed });
  };

  return { tasks, loading, error, addTask, editTask, removeTask, toggleComplete };
}