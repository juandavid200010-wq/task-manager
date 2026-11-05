export async function sendTaskSummary(
  idToken: string,
  tasks: { title: string; completed: boolean }[]
): Promise<void> {
  const response = await fetch("/api/send-summary", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ tasks }),
  });

  if (!response.ok) {
    throw new Error("No se pudo enviar el resumen por email");
  }
}