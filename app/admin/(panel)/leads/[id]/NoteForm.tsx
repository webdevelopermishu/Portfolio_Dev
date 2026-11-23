"use client";

import { useState } from "react";
import { addLeadNote } from "@/lib/actions/admin";
import { Spinner, useAction } from "@/components/admin/ui";

export function NoteForm({ leadId }: { leadId: string }) {
  const [body, setBody] = useState("");
  const { pending, run } = useAction();
  return (
    <form
      className="mt-3"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => addLeadNote(leadId, body), (result) => result.ok && setBody(""));
      }}
    >
      <label htmlFor="note" className="sr-only">Add a note</label>
      <textarea id="note" className="a-input min-h-[80px]" placeholder="Add a note for yourself or your team…" maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} />
      <button type="submit" className="a-btn a-btn-primary mt-2" disabled={pending || !body.trim()}>{pending && <Spinner />}Add note</button>
    </form>
  );
}
