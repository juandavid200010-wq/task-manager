import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskList } from "../components/TaskList";
import type { Task } from "../types/task";

const mockTasks: Task[] = [
  { id: "1", title: "Tarea 1", description: "desc 1", completed: false, userId: "u1", createdAt: 1 },
  { id: "2", title: "Tarea 2", description: "desc 2", completed: true, userId: "u1", createdAt: 2 },
];

describe("TaskList", () => {
  it("muestra un mensaje cuando no hay tareas", () => {
    render(<TaskList tasks={[]} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.getByText("No tienes tareas todavía.")).toBeInTheDocument();
  });

  it("renderiza cada tarea con su título", () => {
    render(<TaskList tasks={mockTasks} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.getByText("Tarea 1")).toBeInTheDocument();
    expect(screen.getByText("Tarea 2")).toBeInTheDocument();
  });

  it("llama a onDelete con el id correcto al hacer clic en Eliminar", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(<TaskList tasks={mockTasks} onToggle={vi.fn()} onDelete={onDelete} onEdit={vi.fn()} />);

    const deleteButtons = screen.getAllByRole("button", { name: /eliminar/i });
    await user.click(deleteButtons[0]);

    expect(onDelete).toHaveBeenCalledWith("1");
  });

  it("llama a onToggle con la tarea completa al marcar el checkbox", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(<TaskList tasks={mockTasks} onToggle={onToggle} onDelete={vi.fn()} onEdit={vi.fn()} />);

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);

    expect(onToggle).toHaveBeenCalledWith(mockTasks[0]);
  });

  it("permite editar el título y la descripción de una tarea", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn().mockResolvedValue(undefined);

    render(<TaskList tasks={mockTasks} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={onEdit} />);

    const editButtons = screen.getAllByRole("button", { name: /editar/i });
    await user.click(editButtons[0]);

    const titleInput = screen.getByPlaceholderText("Título");
    const descriptionInput = screen.getByPlaceholderText("Descripción");

    await user.clear(titleInput);
    await user.type(titleInput, "Tarea 1 editada");
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "nueva descripción");
    await user.click(screen.getByRole("button", { name: /guardar/i }));

    expect(onEdit).toHaveBeenCalledWith("1", {
      title: "Tarea 1 editada",
      description: "nueva descripción",
    });
  });

  it("muestra un error y no guarda si el título queda vacío", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    render(<TaskList tasks={mockTasks} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={onEdit} />);

    const editButtons = screen.getAllByRole("button", { name: /editar/i });
    await user.click(editButtons[0]);

    await user.clear(screen.getByPlaceholderText("Título"));
    await user.click(screen.getByRole("button", { name: /guardar/i }));

    expect(await screen.findByText("El título no puede estar vacío.")).toBeInTheDocument();
    expect(onEdit).not.toHaveBeenCalled();
  });
});