"use client";

import type { ReactNode } from "react";
import { AddButton, SmallButton } from "./ui";

const MAX_ENTRIES = 30;

// A list of entries (jobs, schools, projects…) with add, remove and reorder.
export function EntryList<T extends { id: string }>({
  items,
  onChange,
  newItem,
  addLabel,
  renderItem,
  itemLabel,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  newItem: () => T;
  addLabel: string;
  itemLabel: (item: T, index: number) => string;
  renderItem: (item: T, update: (patch: Partial<T>) => void) => ReactNode;
}) {
  const move = (from: number, to: number) => {
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-4">
      {items.map((item, index) => (
        <div key={item.id} className="rounded-2xl border border-line p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold">{itemLabel(item, index)}</span>
            <span className="flex shrink-0">
              <SmallButton label="Move up" onClick={() => move(index, index - 1)} disabled={index === 0}>
                ↑
              </SmallButton>
              <SmallButton label="Move down" onClick={() => move(index, index + 1)} disabled={index === items.length - 1}>
                ↓
              </SmallButton>
              <SmallButton label="Remove" tone="danger" onClick={() => onChange(items.filter((_, i) => i !== index))}>
                Remove
              </SmallButton>
            </span>
          </div>
          {renderItem(item, (patch) => onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it))))}
        </div>
      ))}
      <AddButton onClick={() => onChange([...items, newItem()])} disabled={items.length >= MAX_ENTRIES}>
        {addLabel}
      </AddButton>
    </div>
  );
}
