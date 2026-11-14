// @vitest-environment happy-dom
import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { BulletList } from "@/app/resumes/[id]/editor/bullet-list";

type Bullet = { id: string; text: string };

function Harness({ initial }: { initial: Bullet[] }) {
  const [bullets, setBullets] = useState(initial);
  return <BulletList bullets={bullets} onChange={setBullets} />;
}

async function mount(initial: Bullet[]) {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => root.render(<Harness initial={initial} />));
  const inputs = () => [...container.querySelectorAll<HTMLTextAreaElement | HTMLInputElement>("[data-bullet]")];
  const press = async (el: Element, key: string) => {
    await act(async () => {
      el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
    });
  };
  return { container, inputs, press, unmount: () => act(() => root.unmount()) };
}

test("Enter adds a bullet after the current one and focuses it", async () => {
  const { inputs, press, unmount } = await mount([
    { id: "a", text: "first" },
    { id: "b", text: "third" },
  ]);
  await press(inputs()[0], "Enter");
  const now = inputs();
  expect(now.map((i) => i.value)).toEqual(["first", "", "third"]);
  expect(document.activeElement).toBe(now[1]);
  await unmount();
});

test("Backspace on an empty bullet removes it and focuses the previous one", async () => {
  const { inputs, press, unmount } = await mount([
    { id: "a", text: "first" },
    { id: "b", text: "" },
  ]);
  await press(inputs()[1], "Backspace");
  const now = inputs();
  expect(now.map((i) => i.value)).toEqual(["first"]);
  expect(document.activeElement).toBe(now[0]);
  await unmount();
});

test("Backspace in a bullet with text does nothing special", async () => {
  const { inputs, press, unmount } = await mount([{ id: "a", text: "keep" }]);
  await press(inputs()[0], "Backspace");
  expect(inputs().map((i) => i.value)).toEqual(["keep"]);
  await unmount();
});
