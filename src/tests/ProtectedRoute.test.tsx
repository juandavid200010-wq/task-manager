import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import type { User } from "firebase/auth";
import { ProtectedRoute } from "../routes/ProtectedRoute";
import { useAuth } from "../hooks/useAuth";

vi.mock("../hooks/useAuth");

const mockedUseAuth = vi.mocked(useAuth);

function mockAuth(user: User | null, loading: boolean) {
  mockedUseAuth.mockReturnValue({
    user,
    loading,
    login: vi.fn(),
    register: vi.fn(),
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
  });
}

function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={["/tasks"]}>
      <Routes>
        <Route path="/login" element={<p>Pantalla de login</p>} />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <p>Contenido protegido</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
  });

  it("muestra el estado de carga y no redirige mientras se verifica la sesión", () => {
    mockAuth(null, true);
    renderProtectedRoute();

    expect(screen.getByText("Cargando...")).toBeInTheDocument();
    expect(screen.queryByText("Pantalla de login")).not.toBeInTheDocument();
    expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();
  });

  it("redirige al login si no hay sesión", () => {
    mockAuth(null, false);
    renderProtectedRoute();

    expect(screen.getByText("Pantalla de login")).toBeInTheDocument();
    expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();
  });

  it("muestra el contenido protegido si hay sesión", () => {
    mockAuth({ uid: "u1" } as User, false);
    renderProtectedRoute();

    expect(screen.getByText("Contenido protegido")).toBeInTheDocument();
    expect(screen.queryByText("Pantalla de login")).not.toBeInTheDocument();
  });
});