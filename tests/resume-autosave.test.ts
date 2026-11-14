import type { SaveActionResult } from "@/app/resumes/actions";
import { createAutosave, readDraft, type AutosaveStatus, type DraftStorage } from "@/lib/resume/autosave";

type Doc = { text: string };

function memoryStorage(): DraftStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, get: (k) => data.get(k) ?? null, set: (k, v) => void data.set(k, v), remove: (k) => void data.delete(k) };
}

function setup(results: Array<SaveActionResult | Error> = []) {
  const storage = memoryStorage();
  const statuses: AutosaveStatus[] = [];
  const calls: Array<{ doc: Doc; base: string }> = [];
  let n = 0;
  const save = vi.fn(async (doc: Doc, base: string) => {
    calls.push({ doc, base });
    const r = results[n++] ?? { status: "saved", updatedAt: `t${n}` };
    if (r instanceof Error) throw r;
    return r;
  });
  const onSaved = vi.fn();
  const autosave = createAutosave<Doc>({
    key: "draft:1",
    base: "t0",
    save,
    storage,
    onStatus: (s) => statuses.push(s),
    onSaved,
  });
  return { autosave, storage, statuses, calls, save, onSaved };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test("writes a local draft on every update, before saving", () => {
  const { autosave, storage, save } = setup();
  autosave.update({ text: "a" });
  expect(JSON.parse(storage.get("draft:1")!)).toMatchObject({ base: "t0", doc: { text: "a" } });
  expect(save).not.toHaveBeenCalled();
  expect(autosave.hasPending()).toBe(true);
});

test("debounces: three quick updates make one save of the last doc", async () => {
  const { autosave, calls } = setup();
  autosave.update({ text: "a" });
  await vi.advanceTimersByTimeAsync(300);
  autosave.update({ text: "ab" });
  await vi.advanceTimersByTimeAsync(300);
  autosave.update({ text: "abc" });
  await vi.advanceTimersByTimeAsync(800);
  expect(calls).toEqual([{ doc: { text: "abc" }, base: "t0" }]);
});

test("clears the draft and reports saved after a successful save; the next save uses the new base", async () => {
  const { autosave, storage, statuses, calls, onSaved } = setup();
  autosave.update({ text: "a" });
  await vi.advanceTimersByTimeAsync(800);
  expect(storage.get("draft:1")).toBeNull();
  expect(statuses).toEqual(["saving", "saved"]);
  expect(onSaved).toHaveBeenCalledWith("t1");
  expect(autosave.hasPending()).toBe(false);
  autosave.update({ text: "b" });
  await vi.advanceTimersByTimeAsync(800);
  expect(calls[1]).toEqual({ doc: { text: "b" }, base: "t1" });
});

test("retries a thrown save with backoff and reports retrying", async () => {
  const { autosave, statuses, save } = setup([new Error("net"), new Error("net"), new Error("net")]);
  autosave.update({ text: "a" });
  await vi.advanceTimersByTimeAsync(800);
  expect(save).toHaveBeenCalledTimes(1);
  expect(statuses.at(-1)).toBe("retrying");
  await vi.advanceTimersByTimeAsync(999);
  expect(save).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1);
  expect(save).toHaveBeenCalledTimes(2); // after 1 s
  await vi.advanceTimersByTimeAsync(2000);
  expect(save).toHaveBeenCalledTimes(3); // after 2 s more
  await vi.advanceTimersByTimeAsync(4000);
  expect(save).toHaveBeenCalledTimes(4); // after 4 s more, then succeeds
  expect(statuses.at(-1)).toBe("saved");
});

test("backoff is capped at 30 seconds", async () => {
  const { autosave, save } = setup(Array(10).fill(new Error("net")));
  autosave.update({ text: "a" });
  await vi.advanceTimersByTimeAsync(800 + 1000 + 2000 + 4000 + 8000 + 16000);
  const before = save.mock.calls.length;
  await vi.advanceTimersByTimeAsync(29_999);
  expect(save.mock.calls.length).toBe(before);
  await vi.advanceTimersByTimeAsync(1);
  expect(save.mock.calls.length).toBe(before + 1);
});

test.each(["invalid", "too_large"] as const)("does not retry an %s save", async (status) => {
  const { autosave, statuses, save, storage } = setup([{ status }]);
  autosave.update({ text: "a" });
  await vi.advanceTimersByTimeAsync(60_000);
  expect(save).toHaveBeenCalledTimes(1);
  expect(statuses.at(-1)).toBe("too_large");
  expect(storage.get("draft:1")).not.toBeNull();
});

test('stops on conflict; keepMine saves with "force"', async () => {
  const { autosave, statuses, calls } = setup([{ status: "conflict" }]);
  autosave.update({ text: "mine" });
  await vi.advanceTimersByTimeAsync(800);
  expect(statuses.at(-1)).toBe("conflict");
  autosave.update({ text: "mine 2" });
  await vi.advanceTimersByTimeAsync(5000);
  expect(calls).toHaveLength(1);
  await autosave.keepMine();
  expect(calls[1]).toEqual({ doc: { text: "mine 2" }, base: "force" });
  expect(statuses.at(-1)).toBe("saved");
});

test("stops on not_found and keeps the draft", async () => {
  const { autosave, statuses, storage, save } = setup([{ status: "not_found" }]);
  autosave.update({ text: "a" });
  await vi.advanceTimersByTimeAsync(800);
  autosave.update({ text: "b" });
  await vi.advanceTimersByTimeAsync(5000);
  expect(save).toHaveBeenCalledTimes(1);
  expect(statuses.at(-1)).toBe("deleted");
  expect(JSON.parse(storage.get("draft:1")!).doc).toEqual({ text: "b" });
});

test("stops on unauthorized and keeps the draft", async () => {
  const { autosave, statuses, storage } = setup([{ status: "unauthorized" }]);
  autosave.update({ text: "a" });
  await vi.advanceTimersByTimeAsync(800);
  expect(statuses.at(-1)).toBe("signed_out");
  expect(storage.get("draft:1")).not.toBeNull();
});

test("readDraft ignores a draft based on an older updatedAt", () => {
  const storage = memoryStorage();
  storage.set("draft:1", JSON.stringify({ base: "t0", doc: { text: "old" } }));
  expect(readDraft<Doc>(storage, "draft:1", "t0")).toEqual({ text: "old" });
  expect(readDraft<Doc>(storage, "draft:1", "t5")).toBeNull();
  storage.set("draft:1", "{not json");
  expect(readDraft<Doc>(storage, "draft:1", "t0")).toBeNull();
});

test("never runs two saves at once", async () => {
  let release: (r: SaveActionResult) => void = () => {};
  const storage = memoryStorage();
  const calls: Doc[] = [];
  let inFlight = 0;
  let maxInFlight = 0;
  const save = vi.fn(
    (doc: Doc) =>
      new Promise<SaveActionResult>((resolve) => {
        calls.push(doc);
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        release = (r) => {
          inFlight--;
          resolve(r);
        };
      }),
  );
  const autosave = createAutosave<Doc>({ key: "k", base: "t0", save, storage, onStatus: () => {} });
  autosave.update({ text: "a" });
  await vi.advanceTimersByTimeAsync(800);
  autosave.update({ text: "ab" });
  await vi.advanceTimersByTimeAsync(800);
  expect(calls).toHaveLength(1);
  release({ status: "saved", updatedAt: "t1" });
  await vi.advanceTimersByTimeAsync(800);
  expect(calls).toEqual([{ text: "a" }, { text: "ab" }]);
  expect(maxInFlight).toBe(1);
  release({ status: "saved", updatedAt: "t2" });
  await vi.advanceTimersByTimeAsync(0);
  expect(autosave.hasPending()).toBe(false);
});

test("survives storage that throws (private browsing)", async () => {
  const broken: DraftStorage = {
    get: () => {
      throw new Error("denied");
    },
    set: () => {
      throw new Error("denied");
    },
    remove: () => {
      throw new Error("denied");
    },
  };
  const save = vi.fn(async () => ({ status: "saved", updatedAt: "t1" }) as SaveActionResult);
  const autosave = createAutosave<Doc>({ key: "k", base: "t0", save, storage: broken, onStatus: () => {} });
  autosave.update({ text: "a" });
  await vi.advanceTimersByTimeAsync(800);
  expect(save).toHaveBeenCalledTimes(1);
  expect(readDraft(broken, "k", "t0")).toBeNull();
});
