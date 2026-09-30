import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { Register } from "../pages/Register";
import { useAuth } from "../hooks/useAuth";

vi.mock("../hooks/useAuth");

const mockedUseAuth = vi.mocked(useAuth);

function renderRegister() {
  return render(
    <BrowserRouter>
      <Register />
    </BrowserRouter>
  );
}

describe("Register", () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
  });

  it("llama a register con el email y password ingresados", async () => {
    const user = userEvent.setup();
    const register = vi.fn().mockResolvedValue(undefined);

    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      register,
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderRegister();

    await user.type(screen.getByPlaceholderText("Correo electrónico"), "nuevo@test.com");
    await user.type(screen.getByPlaceholderText(/contraseña/i), "123456");
    await user.click(screen.getByRole("button", { name: /^registrarse$/i }));

    expect(register).toHaveBeenCalledWith("nuevo@test.com", "123456");
  });

  it("muestra un mensaje de error comprensible cuando el email ya está en uso", async () => {
    const user = userEvent.setup();
    const register = vi.fn().mockRejectedValue({ code: "auth/email-already-in-use" });

    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      register,
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderRegister();

    await user.type(screen.getByPlaceholderText("Correo electrónico"), "existente@test.com");
    await user.type(screen.getByPlaceholderText(/contraseña/i), "123456");
    await user.click(screen.getByRole("button", { name: /^registrarse$/i }));

    expect(await screen.findByText("Ya existe una cuenta con ese correo.")).toBeInTheDocument();
  });
});