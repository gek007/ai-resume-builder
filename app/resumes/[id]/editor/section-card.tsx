"use client";

import type { ReactNode } from "react";
import { SmallButton } from "./ui";

// A collapsible card per resume section, with reorder and hide controls.
export function SectionCard({
  title,
  hidden,
  canHide,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onToggleHidden,
  defaultOpen,
  children,
}: {
  title: string;
  hidden: boolean;
  canHide: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleHidden: () => void;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group rounded-3xl border border-line bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3">
        <span className="flex items-center gap-2 font-bold">
          <span aria-hidden className="text-muted transition group-open:rotate-90">
            ›
          </span>
          {title}
          {hidden && <span className="rounded-full bg-background px-2 py-0.5 text-xs font-semibold text-muted">Hidden</span>}
        </span>
        <span className="flex shrink-0" onClick={(e) => e.preventDefault()}>
          <SmallButton label={`Move ${title} up`} onClick={onMoveUp} disabled={!canMoveUp}>
            ↑
          </SmallButton>
          <SmallButton label={`Move ${title} down`} onClick={onMoveDown} disabled={!canMoveDown}>
            ↓
          </SmallButton>
          {canHide && (
            <SmallButton label={hidden ? `Show ${title}` : `Hide ${title}`} onClick={onToggleHidden}>
              {hidden ? "Show" : "Hide"}
            </SmallButton>
          )}
        </span>
      </summary>
      <div className="border-t border-line px-4 py-4">{children}</div>
    </details>
  );
}
