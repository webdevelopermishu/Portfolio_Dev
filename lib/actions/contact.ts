"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { clientIp, hashIp, rateLimit } from "@/lib/rate-limit";
import { contactSchema } from "@/lib/validation/schemas";
import { zodFailure, type ActionResult } from "@/lib/validation/fields";
import { getSiteData } from "@/lib/services/content";
import { emailLayout, escapeHtml, sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/utils";

export async function submitContact(input: unknown): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return zodFailure(parsed.error);
  const { website, elapsed, ...data } = parsed.data;

  try {
    const site = await getSiteData(false);
    const config = site.sections.contact.content;
    const success: ActionResult = { ok: true, message: config.successMessage };

    // Spam traps: a filled honeypot or an implausibly fast submission is silently dropped.
    if (website || elapsed < 2500) return success;

    const ip = await clientIp();
    const ipHash = hashIp(ip);
    const tooMany: ActionResult = { ok: false, error: "You've sent several messages recently. Please try again later or email me directly." };
    if (!rateLimit(`contact:${ipHash}`, 5, 10 * 60_000).ok) return tooMany;
    const recent = await db.contactLead.count({ where: { ipHash, createdAt: { gte: new Date(Date.now() - 60 * 60_000) } } });
    if (recent >= 5) return tooMany;

    // Only accept option values that are actually configured, and ignore hidden fields.
    const budget = config.showBudget && config.budgetOptions.includes(data.budget) ? data.budget : "";
    const projectType = config.showProjectType && config.projectTypes.includes(data.projectType) ? data.projectType : "";
    const phone = config.showPhone ? data.phone : "";

    const lead = await db.contactLead.create({
      data: {
        name: data.name, email: data.email, phone, budget, projectType, message: data.message, ipHash,
        userAgent: ((await headers()).get("user-agent") ?? "").slice(0, 300),
      },
    });

    const { settings } = site;
    const ownerAddress = settings.notifyEmail || settings.email;
    const rows = [
      ["Name", data.name], ["Email", data.email], ["Phone", phone || "—"], ["Budget", budget || "—"],
      ["Project type", projectType || "—"],
    ];
    const table = rows
      .map(([k, v]) => `<tr><td style="padding:6px 16px 6px 0;color:#5b6172">${k}</td><td style="padding:6px 0">${escapeHtml(v)}</td></tr>`)
      .join("");
    const messageHtml = escapeHtml(data.message).replace(/\n/g, "<br>");

    const [ownerSent, senderSent] = await Promise.all([
      ownerAddress
        ? sendEmail({
            to: ownerAddress,
            replyTo: data.email,
            fromName: settings.emailFromName || settings.siteName,
            subject: `New project inquiry from ${data.name}`,
            text: `${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${data.message}\n\nOpen in dashboard: ${siteUrl()}/admin/leads/${lead.id}`,
            html: emailLayout(
              "New project inquiry",
              `<table style="font-size:14px;border-collapse:collapse">${table}</table>
               <p style="font-size:14px;line-height:1.6;margin:20px 0;padding:16px;background:#f3f4f8;border-radius:12px">${messageHtml}</p>
               <a href="${siteUrl()}/admin/leads/${lead.id}" style="display:inline-block;background:#0f1524;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;font-size:13px">Open in dashboard</a>`,
            ),
          })
        : Promise.resolve(false),
      settings.autoReplyEnabled
        ? (() => {
            const body = (settings.autoReplyBody || "Hi {name},\n\nThanks for getting in touch — I've received your message and will reply soon.")
              .replace(/\{name\}/g, data.name);
            return sendEmail({
              to: data.email,
              replyTo: ownerAddress || undefined,
              fromName: settings.emailFromName || settings.developerName,
              subject: settings.autoReplySubject || "Thanks for reaching out",
              text: `${body}\n\n— ${settings.developerName}`,
              html: emailLayout(
                settings.autoReplySubject || "Thanks for reaching out",
                `<p style="font-size:14px;line-height:1.7">${escapeHtml(body).replace(/\n/g, "<br>")}</p>
                 <p style="font-size:14px;color:#5b6172">— ${escapeHtml(settings.developerName)}</p>`,
              ),
            });
          })()
        : Promise.resolve(false),
    ]);
    if (ownerSent || senderSent) {
      await db.contactLead.update({ where: { id: lead.id }, data: { ownerEmailSent: ownerSent, senderEmailSent: senderSent } });
    }
    return success;
  } catch (error) {
    console.error("[contact]", error instanceof Error ? error.message : error);
    return { ok: false, error: "Your message could not be sent. Please try again in a moment." };
  }
}
