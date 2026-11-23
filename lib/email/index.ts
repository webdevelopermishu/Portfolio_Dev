import "server-only";

type Mail = { to: string; subject: string; html: string; text: string; replyTo?: string; fromName?: string };

/**
 * Sends a transactional email through Resend's REST API.
 * Without RESEND_API_KEY the message is logged instead, so the contact flow still works in development.
 */
export async function sendEmail(mail: Mail): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM || "onboarding@resend.dev";
  const from = mail.fromName ? `${mail.fromName.replace(/[<>"]/g, "")} <${fromAddress}>` : fromAddress;

  if (!apiKey) {
    console.info(`[email:dev] RESEND_API_KEY not set — would send to ${mail.to}: "${mail.subject}"\n${mail.text}`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      console.error(`[email] Resend responded ${res.status}: ${(await res.text()).slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] send failed:", error instanceof Error ? error.message : error);
    return false;
  }
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function emailLayout(title: string, bodyHtml: string) {
  return `<!doctype html><html><body style="margin:0;background:#f3f4f8;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#0f1524">
<div style="max-width:560px;margin:0 auto;padding:32px 16px">
<div style="background:#ffffff;border-radius:16px;padding:32px">
<h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(title)}</h1>
${bodyHtml}
</div></div></body></html>`;
}
