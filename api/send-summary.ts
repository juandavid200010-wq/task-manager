import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/^"|"$/g, "").replace(/\\n/g, "\n"),
    }),
  });
}

const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface TaskSummary {
  title: string;
  completed: boolean;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isValidTasks(value: unknown): value is TaskSummary[] {
  if (!Array.isArray(value) || value.length > 200) return false;
  return value.every(
    (t) =>
      typeof t === "object" &&
      t !== null &&
      typeof t.title === "string" &&
      t.title.length > 0 &&
      t.title.length <= 200 &&
      typeof t.completed === "boolean"
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No autenticado" });
  }

  let userEmail: string | undefined;
  try {
    const decoded = await getAuth().verifyIdToken(authHeader.slice(7));
    userEmail = decoded.email;
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }

  if (!userEmail) {
    return res.status(400).json({ error: "El usuario no tiene correo asociado" });
  }

  const body = req.body as { tasks?: unknown } | undefined;
  if (!isValidTasks(body?.tasks)) {
    return res.status(400).json({ error: "Datos inválidos" });
  }
  const tasks = body.tasks;

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.length - completedCount;

  const taskListHtml = tasks
    .map(
      (t) =>
        `<li style="${t.completed ? "text-decoration: line-through; color: gray;" : ""}">${escapeHtml(t.title)}</li>`
    )
    .join("");

  const htmlBody = `
    <h2>Resumen de tus tareas</h2>
    <p>Tienes ${tasks.length} tarea(s) en total: ${completedCount} completada(s), ${pendingCount} pendiente(s).</p>
    <ul>${taskListHtml}</ul>
  `;

  try {
    const command = new SendEmailCommand({
      Source: process.env.SES_FROM_EMAIL,
      Destination: { ToAddresses: [userEmail] },
      Message: {
        Subject: { Data: "Resumen de tus tareas - Task Manager" },
        Body: { Html: { Data: htmlBody } },
      },
    });

    await sesClient.send(command);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error enviando email:", error);
    return res.status(500).json({ error: "No se pudo enviar el email" });
  }
}