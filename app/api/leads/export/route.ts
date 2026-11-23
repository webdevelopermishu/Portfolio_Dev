import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { leadWhere } from "@/lib/services/leads";

/** Quotes a CSV cell and neutralises spreadsheet formulas (cells starting with = + - @). */
function cell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  if (!(await getSessionUser())) return new NextResponse("Unauthorized", { status: 401 });
  const { searchParams } = new URL(request.url);
  const leads = await db.contactLead.findMany({
    where: leadWhere({ q: searchParams.get("q"), status: searchParams.get("status") }),
    orderBy: { createdAt: "desc" },
    take: 10_000,
    include: { notes: { orderBy: { createdAt: "asc" } } },
  });
  const header = ["Received", "Name", "Email", "Phone", "Budget", "Project type", "Status", "Message", "Notes"];
  const lines = leads.map((l) =>
    [l.createdAt.toISOString(), l.name, l.email, l.phone, l.budget, l.projectType, l.status, l.message, l.notes.map((n) => n.body).join(" | ")].map(cell).join(","),
  );
  // BOM so Excel opens the file as UTF-8.
  const csv = `﻿${header.map(cell).join(",")}\r\n${lines.join("\r\n")}\r\n`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
