import { describe, it, expect, vi, beforeEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock("@aws-sdk/client-ses", () => ({
  SESClient: class {
    send = sendMock;
  },
  SendEmailCommand: class {
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
    }
  },
}));

import handler from "../../api/send-summary";

const fetchMock = vi.fn();

function createRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: unknown) {
      res.body = data;
      return res;
    },
  };
  return res;
}

function createReq(
  options: { method?: string; authorization?: string; body?: unknown } = {}
) {
  return {
    method: options.method ?? "POST",
    headers: options.authorization ? { authorization: options.authorization } : {},
    body: options.body,
  };
}

async function callHandler(req: ReturnType<typeof createReq>) {
  const res = createRes();
  await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);
  return res;
}

type SentCommand = {
  input: {
    Destination: { ToAddresses: string[] };
    Message: { Body: { Html: { Data: string } } };
  };
};

const validTasks = [
  { title: "Tarea 1", completed: false },
  { title: "Tarea 2", completed: true },
];

describe("función serverless send-summary", () => {
  beforeEach(() => {
    sendMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    process.env.SES_FROM_EMAIL = "remitente@test.com";

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ users: [{ email: "usuario@test.com" }] }),
    });
    sendMock.mockResolvedValue({});
  });

  it("responde 405 si el método no es POST", async () => {
    const res = await callHandler(createReq({ method: "GET" }));

    expect(res.statusCode).toBe(405);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("responde 401 si falta el token de autenticación", async () => {
    const res = await callHandler(createReq({ body: { tasks: validTasks } }));

    expect(res.statusCode).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("responde 401 si el token no es válido", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });

    const res = await callHandler(
      createReq({ authorization: "Bearer token-falso", body: { tasks: validTasks } })
    );

    expect(res.statusCode).toBe(401);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it.each([
    ["tasks no es una lista", "texto"],
    ["hay un título vacío", [{ title: "", completed: false }]],
    ["completed no es booleano", [{ title: "A", completed: "si" }]],
    ["un título es demasiado largo", [{ title: "a".repeat(201), completed: false }]],
  ])("responde 400 si los datos son inválidos (%s)", async (_caso, tasks) => {
    const res = await callHandler(
      createReq({ authorization: "Bearer token-valido", body: { tasks } })
    );

    expect(res.statusCode).toBe(400);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("envía el correo al email del token e ignora el que venga en la petición", async () => {
    const res = await callHandler(
      createReq({
        authorization: "Bearer token-valido",
        body: { tasks: validTasks, toEmail: "otro@test.com" },
      })
    );

    expect(res.statusCode).toBe(200);
    const command = sendMock.mock.calls[0][0] as SentCommand;
    expect(command.input.Destination.ToAddresses).toEqual(["usuario@test.com"]);
  });

  it("escapa el HTML de los títulos antes de armar el correo", async () => {
    await callHandler(
      createReq({
        authorization: "Bearer token-valido",
        body: { tasks: [{ title: "<script>alert(1)</script>", completed: false }] },
      })
    );

    const command = sendMock.mock.calls[0][0] as SentCommand;
    const html = command.input.Message.Body.Html.Data;
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("responde 500 si AWS SES falla", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    sendMock.mockRejectedValue(new Error("MessageRejected"));

    const res = await callHandler(
      createReq({ authorization: "Bearer token-valido", body: { tasks: validTasks } })
    );

    expect(res.statusCode).toBe(500);
  });
});