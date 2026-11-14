"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { saveResumeAction } from "@/app/resumes/actions";
import { createAutosave, readDraft, type AutosaveStatus, type DraftStorage } from "@/lib/resume/autosave";

const browserStorage: DraftStorage = {
  get: (k) => window.localStorage.getItem(k),
  set: (k, v) => window.localStorage.setItem(k, v),
  remove: (k) => window.localStorage.removeItem(k),
};

function safeGet(key: string): string | null {
  try {
    return browserStorage.get(key);
  } catch {
    return null;
  }
}

// The draft as it was when the editor opened, read once per visit. Reading it
// on every render would show the "restore?" offer for drafts typed just now.
const draftsAtOpen = new Map<string, string | null>();
function draftAtOpen(key: string): string | null {
  if (!draftsAtOpen.has(key)) draftsAtOpen.set(key, safeGet(key));
  return draftsAtOpen.get(key) ?? null;
}
const noSubscription = () => () => {};

// Wires the autosave controller to the browser: localStorage drafts, a
// "leave site?" prompt while anything is unsaved, and the server action.
export function useAutosave<T>(resumeId: string, updatedAt: string) {
  const key = `resume-draft:${resumeId}`;
  const [status, setStatus] = useState<AutosaveStatus>("saved");
  const controller = useRef<ReturnType<typeof createAutosave<T>> | null>(null);

  useEffect(() => {
    const c = createAutosave<T>({
      key,
      base: updatedAt,
      save: (doc, base) => saveResumeAction(resumeId, doc, base),
      storage: browserStorage,
      onStatus: setStatus,
    });
    controller.current = c;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (c.hasPending()) event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      void c.flush();
      c.dispose();
      draftsAtOpen.delete(key);
    };
  }, [key, resumeId, updatedAt]);

  // Server render has no storage (null); the browser reads it after hydration.
  const raw = useSyncExternalStore(noSubscription, () => draftAtOpen(key), () => null);
  const savedDraft = useMemo(() => {
    if (!raw) return null;
    const once: DraftStorage = { get: () => raw, set: () => {}, remove: () => {} };
    return readDraft<T>(once, key, updatedAt);
  }, [raw, key, updatedAt]);

  return {
    status,
    savedDraft,
    update: (doc: T) => controller.current?.update(doc),
    keepMine: () => controller.current?.keepMine(),
    discardDraft: () => {
      try {
        browserStorage.remove(key);
      } catch {
        // Storage unavailable (private mode): nothing to discard.
      }
    },
  };
}
