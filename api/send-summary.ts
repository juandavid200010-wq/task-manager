import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { toEmail, tasks } = req.body as { toEmail: string; tasks: TaskSummary[] };

  if (!toEmail || !Array.isArray(tasks)) {
    return res.status(400).json({ error: "Datos inválidos" });
  }

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.length - completedCount;

  const taskListHtml = tasks
    .map(
      (t) =>
        `<li style="${t.completed ? "text-decoration: line-through; color: gray;" : ""}">${t.title}</li>`
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
      Destination: { ToAddresses: [toEmail] },
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