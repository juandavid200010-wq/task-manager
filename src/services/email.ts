export async function sendTaskSummary(
  toEmail: string,
  tasks: { title: string; completed: boolean }[]
): Promise<void> {
  const response = await fetch("/api/send-summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toEmail, tasks }),
  });

  if (!response.ok) {
    throw new Error("No se pudo enviar el resumen por email");
  }
}