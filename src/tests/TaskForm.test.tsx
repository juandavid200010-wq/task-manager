import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskForm } from "../components/TaskForm";

describe("TaskForm", () => {
  it("permite escribir un título y enviarlo al hacer submit", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue(undefined);

    render(<TaskForm onAdd={onAdd} />);

    const titleInput = screen.getByPlaceholderText("Título de la tarea");
    const submitButton = screen.getByRole("button", { name: /agregar tarea/i });

    await user.type(titleInput, "Comprar leche");
    await user.click(submitButton);

    expect(onAdd).toHaveBeenCalledWith("Comprar leche", "");
  });

  it("no envía el formulario si el título está vacío", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();

    render(<TaskForm onAdd={onAdd} />);

    const submitButton = screen.getByRole("button", { name: /agregar tarea/i });
    await user.click(submitButton);

    expect(onAdd).not.toHaveBeenCalled();
  });
});