// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { deleteResumeAction } from "@/app/resumes/actions";
import { ResumeList } from "@/app/dashboard/resume-list";

vi.mock("@/app/resumes/actions", () => ({
  deleteResumeAction: vi.fn().mockResolvedValue({ ok: true }),
  duplicateResumeAction: vi.fn().mockResolvedValue({ ok: true }),
  renameResumeAction: vi.fn().mockResolvedValue({ ok: true }),
}));

const now = new Date().toISOString();
const resumes = [
  { id: "r1", title: "Frontend", jobTitle: "Frontend Engineer", jobCompany: "Acme", updatedAt: now },
  { id: "r2", title: "General", jobTitle: "", jobCompany: "", updatedAt: now },
];

async function mount() {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => root.render(<ResumeList resumes={resumes} />));
  const rows = () => [...container.querySelectorAll("li")];
  const button = (row: Element, name: string) =>
    [...row.querySelectorAll("button")].find((b) => b.textContent === name) as HTMLButtonElement;
  return { container, rows, button, unmount: () => act(() => root.unmount()) };
}

beforeEach(() => vi.mocked(deleteResumeAction).mockClear());
afterEach(() => vi.restoreAllMocks());

test("delete asks for confirmation and calls the action only on confirm", async () => {
  const { rows, button, unmount } = await mount();
  // happy-dom has no window.confirm; stub it.
  const confirm = vi.fn().mockReturnValue(false);
  window.confirm = confirm;
  await act(async () => button(rows()[0], "Delete").click());
  expect(confirm).toHaveBeenCalledWith("Delete “Frontend”? This can't be undone.");
  expect(deleteResumeAction).not.toHaveBeenCalled();
  confirm.mockReturnValue(true);
  await act(async () => button(rows()[0], "Delete").click());
  expect(deleteResumeAction).toHaveBeenCalledWith("r1");
  await unmount();
});

test('shows "Made for" only when a job is set', async () => {
  const { rows, unmount } = await mount();
  expect(rows()[0].textContent).toContain("Made for Acme – Frontend Engineer");
  expect(rows()[1].textContent).not.toContain("Made for");
  await unmount();
});

test("each title links to its editor", async () => {
  const { rows, unmount } = await mount();
  expect(rows()[0].querySelector("a")?.getAttribute("href")).toBe("/resumes/r1");
  await unmount();
});
