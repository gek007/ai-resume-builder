"use client";

import { useLayoutEffect, useRef, type KeyboardEvent } from "react";
import { newId } from "@/lib/resume/schema";
import { AddButton, SmallButton, inputClass } from "./ui";

type Bullet = { id: string; text: string };
const MAX_BULLETS = 30;

// One input per bullet: Enter adds the next bullet, Backspace on an empty
// bullet removes it. Focus follows, so a list can be typed without the mouse.
export function BulletList({ bullets, onChange }: { bullets: Bullet[]; onChange: (bullets: Bullet[]) => void }) {
  const refs = useRef(new Map<string, HTMLTextAreaElement>());
  const focusNext = useRef<string | null>(null);

  // After the list re-renders with a new or removed bullet, move focus there.
  useLayoutEffect(() => {
    if (!focusNext.current) return;
    refs.current.get(focusNext.current)?.focus();
    focusNext.current = null;
  });

  const setFocusId = (id: string) => {
    focusNext.current = id;
  };

  const insertAfter = (index: number) => {
    if (bullets.length >= MAX_BULLETS) return;
    const bullet = { id: newId(), text: "" };
    onChange([...bullets.slice(0, index + 1), bullet, ...bullets.slice(index + 1)]);
    setFocusId(bullet.id);
  };

  const remove = (index: number) => {
    const next = bullets.filter((_, i) => i !== index);
    onChange(next);
    const target = next[Math.max(0, index - 1)];
    if (target) setFocusId(target.id);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>, index: number) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      insertAfter(index);
    } else if (event.key === "Backspace" && bullets[index].text === "") {
      event.preventDefault();
      remove(index);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {bullets.map((bullet, index) => (
        <div key={bullet.id} className="flex items-start gap-2">
          <span aria-hidden className="mt-2 text-muted">
            •
          </span>
          <textarea
            data-bullet
            rows={1}
            ref={(el) => {
              if (el) refs.current.set(bullet.id, el);
              else refs.current.delete(bullet.id);
            }}
            aria-label={`Bullet ${index + 1}`}
            value={bullet.text}
            maxLength={500}
            onKeyDown={(e) => onKeyDown(e, index)}
            onChange={(e) =>
              onChange(bullets.map((b, i) => (i === index ? { ...b, text: e.target.value.replace(/\n/g, " ") } : b)))
            }
            className={`${inputClass} w-full field-sizing-content min-h-9 resize-none`}
          />
          <SmallButton label="Remove bullet" tone="danger" onClick={() => remove(index)}>
            ✕
          </SmallButton>
        </div>
      ))}
      <AddButton onClick={() => insertAfter(bullets.length - 1)} disabled={bullets.length >= MAX_BULLETS}>
        + Add bullet
      </AddButton>
    </div>
  );
}
