import { describe, it, expect } from "vitest";
import { getErrorMessage } from "../utils/authErrors";

describe("getErrorMessage", () => {
  it("traduce auth/wrong-password a un mensaje comprensible", () => {
    expect(getErrorMessage("auth/wrong-password")).toBe("Correo o contraseña incorrectos.");
  });

  it("traduce auth/email-already-in-use a un mensaje comprensible", () => {
    expect(getErrorMessage("auth/email-already-in-use")).toBe("Ya existe una cuenta con ese correo.");
  });

  it("devuelve un mensaje genérico para códigos desconocidos", () => {
    expect(getErrorMessage("codigo-que-no-existe")).toBe("Ocurrió un error. Intenta de nuevo.");
  });
});