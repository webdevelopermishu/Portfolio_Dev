"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { saveList } from "@/lib/actions/admin";
import { LIST_FIELDS, type ListKind } from "@/lib/fields";
import { Spinner, Switch, useAction, useUnsavedWarning } from "@/components/admin/ui";

type Row = Record<string, unknown> & { id?: string; visible: boolean; _key: string };

/** Inline editor for short ordered lists: add, edit, reorder, show/hide, delete, then save once. */
export function ListEditor({
  kind, title, description, rows: initial, toggleLabel = "Visible", addLabel = "Add item",
}: { kind: ListKind; title: string; description?: string; rows: Array<Record<string, unknown> & { id: string }>; toggleLabel?: string; addLabel?: string }) {
  const fields = LIST_FIELDS[kind];
  const textFields = fields.filter((f) => f.type !== "checkbox");
  const boolFields = fields.filter((f) => f.type === "checkbox");
  const toRows = (list: typeof initial): Row[] => list.map((r) => ({ ...r, visible: r.visible !== false, _key: r.id }));
  const [rows, setRows] = useState<Row[]>(() => toRows(initial));
  const [baseline, setBaseline] = useState(() => JSON.stringify(toRows(initial)));
  const { pending, run } = useAction();
  const dirty = JSON.stringify(rows) !== baseline;
  useUnsavedWarning(dirty);

  const update = (index: number, patch: Partial<Row>) => setRows((list) => list.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  const move = (index: number, delta: number) =>
    setRows((list) => {
      const next = [...list];
      const target = index + delta;
      if (target < 0 || target >= next.length) return list;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  const add = () =>
    setRows((list) => [
      ...list,
      { ...Object.fromEntries(fields.map((f) => [f.name, f.type === "checkbox" ? true : f.type === "select" ? (f.options?.[0]?.value ?? "") : ""])), visible: true, _key: `new-${Date.now()}` },
    ]);

  const save = () =>
    run(
      () => saveList(kind, rows.map(({ _key, ...row }) => { void _key; return row; })),
      (result) => result.ok && setBaseline(JSON.stringify(rows)),
    );

  return (
    <section className="a-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="a-help max-w-xl">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-xs text-gray-500">Unsaved changes</span>}
          <button type="button" className="a-btn" onClick={add}><Plus className="size-4" aria-hidden />{addLabel}</button>
          <button type="button" className="a-btn a-btn-primary" disabled={pending || !dirty} onClick={save}>{pending && <Spinner />}Save</button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">Nothing here yet — add the first item.</p>
      ) : (
        <ul className="mt-5 space-y-2">
          {rows.map((row, index) => (
            <li key={row._key} className="flex flex-wrap items-center gap-2 rounded-xl border border-[#e6e8ef] bg-[#fafbfc] p-2.5">
              <div className="flex flex-col">
                <button type="button" className="rounded p-0.5 text-gray-500 hover:bg-white disabled:opacity-30" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp className="size-3.5" aria-hidden /></button>
                <button type="button" className="rounded p-0.5 text-gray-500 hover:bg-white disabled:opacity-30" aria-label="Move down" disabled={index === rows.length - 1} onClick={() => move(index, 1)}><ArrowDown className="size-3.5" aria-hidden /></button>
              </div>
              <div className="grid min-w-[220px] flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${textFields.length}, minmax(0, 1fr))` }}>
                {textFields.map((field) =>
                  field.type === "select" ? (
                    <select key={field.name} aria-label={field.label} className="a-input" value={String(row[field.name] ?? "")} onChange={(e) => update(index, { [field.name]: e.target.value })}>
                      {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input key={field.name} aria-label={field.label} placeholder={field.placeholder ?? field.label} className="a-input" maxLength={field.max} value={String(row[field.name] ?? "")} onChange={(e) => update(index, { [field.name]: e.target.value })} />
                  ),
                )}
              </div>
              {boolFields.map((field) => (
                <label key={field.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Switch label={field.label} checked={Boolean(row[field.name])} onChange={(v) => update(index, { [field.name]: v })} />
                  {field.label}
                </label>
              ))}
              <label className="flex items-center gap-1.5 text-xs text-gray-600">
                <Switch label={toggleLabel} checked={row.visible} onChange={(v) => update(index, { visible: v })} />
                {toggleLabel}
              </label>
              <button type="button" className="a-btn a-btn-icon a-btn-danger" aria-label="Remove" onClick={() => setRows((list) => list.filter((_, i) => i !== index))}>
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
