import type { SaveActionResult } from "@/app/resumes/actions";

// Framework-free autosave (v1 spec §11.7): debounced saves, one at a time,
// retry with backoff on errors, a local draft on every change so a reload or
// crash loses nothing, and a hard stop on conflicts, deletion, sign-out or a
// refused document. The editor's React hook is a thin wrapper around this.

export type AutosaveStatus = "saved" | "saving" | "retrying" | "conflict" | "deleted" | "signed_out" | "too_large";

export type DraftStorage = {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
};

type Draft<T> = { base: string; doc: T };

type Options<T> = {
  key: string;
  base: string;
  save: (doc: T, base: string) => Promise<SaveActionResult>;
  storage: DraftStorage;
  onStatus: (status: AutosaveStatus) => void;
  onSaved?: (updatedAt: string) => void;
  debounceMs?: number;
  maxBackoffMs?: number;
};

const STOPPED: Record<string, AutosaveStatus> = {
  conflict: "conflict",
  not_found: "deleted",
  unauthorized: "signed_out",
  invalid: "too_large",
  too_large: "too_large",
};

function safe<R>(fn: () => R, fallback: R): R {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

// The local draft is only offered back if it was based on the version the
// server still has; otherwise it would silently undo a newer save.
export function readDraft<T>(storage: DraftStorage, key: string, serverUpdatedAt: string): T | null {
  const raw = safe(() => storage.get(key), null);
  if (!raw) return null;
  const draft = safe(() => JSON.parse(raw) as Draft<T>, null);
  return draft && draft.base === serverUpdatedAt ? draft.doc : null;
}

export function createAutosave<T>(opts: Options<T>) {
  const debounceMs = opts.debounceMs ?? 800;
  const maxBackoffMs = opts.maxBackoffMs ?? 30_000;
  let base = opts.base;
  let pending: T | null = null;
  let inFlight: Promise<void> | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let attempt = 0;
  let stopped: AutosaveStatus | null = null;
  let force = false;
  let disposed = false;

  const writeDraft = () => {
    if (pending !== null) safe(() => opts.storage.set(opts.key, JSON.stringify({ base, doc: pending })), undefined);
  };

  const schedule = (ms: number) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void run();
    }, ms);
  };

  async function attemptSave(doc: T): Promise<void> {
    opts.onStatus("saving");
    let result: SaveActionResult;
    try {
      result = await opts.save(doc, force ? "force" : base);
    } catch {
      attempt++;
      opts.onStatus("retrying");
      if (!disposed) schedule(Math.min(1000 * 2 ** (attempt - 1), maxBackoffMs));
      return;
    }
    attempt = 0;
    if (result.status !== "saved") {
      stopped = STOPPED[result.status];
      opts.onStatus(stopped);
      return;
    }
    force = false;
    base = result.updatedAt;
    opts.onSaved?.(result.updatedAt);
    if (pending === doc) {
      pending = null;
      safe(() => opts.storage.remove(opts.key), undefined);
      opts.onStatus("saved");
    } else {
      // Edits arrived while saving: keep the draft current and save them next.
      writeDraft();
      if (!disposed) schedule(debounceMs);
    }
  }

  async function run(): Promise<void> {
    if (inFlight) {
      // One save at a time; the finished save reschedules if needed.
      return inFlight;
    }
    if (stopped || pending === null || disposed) return;
    const doc = pending;
    inFlight = attemptSave(doc).finally(() => {
      inFlight = null;
    });
    return inFlight;
  }

  return {
    update(doc: T) {
      pending = doc;
      writeDraft();
      // A new edit can fix a refused document (trimmed) or a lost session
      // (signed in again in another tab), so try again. A conflict or a
      // deleted resume needs the person to choose, so those stay stopped.
      if (stopped === "too_large" || stopped === "signed_out") stopped = null;
      if (!stopped && !disposed) schedule(debounceMs);
    },
    async flush() {
      if (timer) clearTimeout(timer);
      timer = null;
      await run();
    },
    // After a conflict: overwrite the server copy with this device's version.
    async keepMine() {
      stopped = null;
      force = true;
      if (timer) clearTimeout(timer);
      timer = null;
      if (inFlight) await inFlight;
      await run();
    },
    hasPending() {
      return pending !== null || inFlight !== null;
    },
    dispose() {
      disposed = true;
      if (timer) clearTimeout(timer);
    },
  };
}
