import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Task } from "../types/task";

const TASKS_COLLECTION = "tasks";

export function subscribeToTasks(
  userId: string,
  onChange: (tasks: Task[]) => void,
  onError: (error: Error) => void
) {
  const q = query(
    collection(db, TASKS_COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const tasks = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Task[];
      onChange(tasks);
    },
    onError
  );
}

export async function createTask(
  userId: string,
  title: string,
  description: string
): Promise<void> {
  await addDoc(collection(db, TASKS_COLLECTION), {
    title,
    description,
    completed: false,
    userId,
    createdAt: Date.now(),
  });
}

export async function updateTask(
  taskId: string,
  data: Partial<Pick<Task, "title" | "description" | "completed">>
): Promise<void> {
  await updateDoc(doc(db, TASKS_COLLECTION, taskId), data);
}

export async function deleteTask(taskId: string): Promise<void> {
  await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
}