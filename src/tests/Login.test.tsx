import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { Login } from "../pages/Login";
import { useAuth } from "../hooks/useAuth";

vi.mock("../hooks/useAuth");

const mockedUseAuth = vi.mocked(useAuth);

function renderLogin() {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
}

describe("Login", () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
  });

  it("llama a login con el email y password ingresados", async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockResolvedValue(undefined);

    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login,
      register: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderLogin();

    await user.type(screen.getByPlaceholderText("Correo electrónico"), "test@test.com");
    await user.type(screen.getByPlaceholderText("Contraseña"), "123456");
    await user.click(screen.getByRole("button", { name: /^ingresar$/i }));

    expect(login).toHaveBeenCalledWith("test@test.com", "123456");
  });

  it("muestra un mensaje de error comprensible cuando falla el login", async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockRejectedValue({ code: "auth/wrong-password" });

    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login,
      register: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderLogin();

    await user.type(screen.getByPlaceholderText("Correo electrónico"), "test@test.com");
    await user.type(screen.getByPlaceholderText("Contraseña"), "wrong");
    await user.click(screen.getByRole("button", { name: /^ingresar$/i }));

    expect(await screen.findByText("Correo o contraseña incorrectos.")).toBeInTheDocument();
  });
});