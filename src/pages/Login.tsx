import { useState } from "react";
import type { SyntheticEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage, getErrorCode } from "../utils/authErrors";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/tasks");
    } catch (err) {
      setError(getErrorMessage(getErrorCode(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate("/tasks");
    } catch (err) {
      setError(getErrorMessage(getErrorCode(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="card auth-card">
        <h1>Iniciar sesión</h1>
        <p className="subtitle">Accede para gestionar tus tareas</p>

        <form className="form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <p className="message error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="divider">
          <span>o</span>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          Ingresar con Google
        </button>

        <p className="auth-footer">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </div>
    </main>
  );
}