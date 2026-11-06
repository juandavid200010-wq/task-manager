import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("firebase/firestore", () => ({
  collection: vi.fn((_db: unknown, name: string) => ({ name })),
  doc: vi.fn((_db: unknown, name: string, id: string) => ({ name, id })),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn((...args: unknown[]) => ({ args })),
  where: vi.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
  orderBy: vi.fn((field: string, direction: string) => ({ field, direction })),
  onSnapshot: vi.fn(),
}));

vi.mock("../services/firebase", () => ({ db: {} }));

import { addDoc, updateDoc, deleteDoc, onSnapshot, where } from "firebase/firestore";
import {
  createTask,
  updateTask,
  deleteTask,
  subscribeToTasks,
} from "../services/tasks";

describe("servicio de tareas (Firestore mockeado)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createTask guarda la tarea con el userId, sin completar", async () => {
    vi.mocked(addDoc).mockResolvedValue({} as never);

    await createTask("u1", "Comprar leche", "2 litros");

    expect(addDoc).toHaveBeenCalledWith(
      { name: "tasks" },
      expect.objectContaining({
        title: "Comprar leche",
        description: "2 litros",
        completed: false,
        userId: "u1",
      })
    );
  });

  it("updateTask actualiza solo los campos indicados", async () => {
    vi.mocked(updateDoc).mockResolvedValue(undefined);

    await updateTask("t1", { completed: true });

    expect(updateDoc).toHaveBeenCalledWith({ name: "tasks", id: "t1" }, { completed: true });
  });

  it("deleteTask elimina el documento con el id indicado", async () => {
    vi.mocked(deleteDoc).mockResolvedValue(undefined);

    await deleteTask("t1");

    expect(deleteDoc).toHaveBeenCalledWith({ name: "tasks", id: "t1" });
  });

  it("subscribeToTasks filtra por userId y devuelve la función para cancelar", () => {
    const unsubscribe = vi.fn();
    vi.mocked(onSnapshot).mockReturnValue(unsubscribe);

    const result = subscribeToTasks("u1", vi.fn(), vi.fn());

    expect(where).toHaveBeenCalledWith("userId", "==", "u1");
    expect(result).toBe(unsubscribe);
  });

  it("subscribeToTasks convierte los documentos en tareas con su id", () => {
    vi.mocked(onSnapshot).mockImplementation(((
      _q: unknown,
      onNext: (snapshot: unknown) => void
    ) => {
      onNext({
        docs: [
          {
            id: "t1",
            data: () => ({
              title: "Tarea A",
              description: "desc",
              completed: false,
              userId: "u1",
              createdAt: 1,
            }),
          },
        ],
      });
      return vi.fn();
    }) as never);

    const onChange = vi.fn();
    subscribeToTasks("u1", onChange, vi.fn());

    expect(onChange).toHaveBeenCalledWith([
      {
        id: "t1",
        title: "Tarea A",
        description: "desc",
        completed: false,
        userId: "u1",
        createdAt: 1,
      },
    ]);
  });

  it("subscribeToTasks avisa del error si Firestore falla", () => {
    const error = new Error("permission-denied");
    vi.mocked(onSnapshot).mockImplementation(((
      _q: unknown,
      _onNext: unknown,
      onError: (e: Error) => void
    ) => {
      onError(error);
      return vi.fn();
    }) as never);

    const onError = vi.fn();
    subscribeToTasks("u1", vi.fn(), onError);

    expect(onError).toHaveBeenCalledWith(error);
  });
});