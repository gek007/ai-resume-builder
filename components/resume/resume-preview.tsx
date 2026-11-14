"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { PaperSize, ResumeContent } from "@/lib/resume/schema";
import { ResumeTemplate } from "./resume-template";

// CSS pixels at 96 dpi.
const PAGE = {
  A4: { width: (210 / 25.4) * 96, height: (297 / 25.4) * 96 },
  Letter: { width: 8.5 * 96, height: 11 * 96 },
} as const;

// Shows the template at true page size, scaled down to fit its container, with
// dashed marks where each printed page would end.
export function ResumePreview({ content, paperSize }: { content: ResumeContent; paperSize: PaperSize }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number>(PAGE[paperSize].height);
  const page = PAGE[paperSize];

  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const measure = () => {
      setScale(Math.min(1, o.clientWidth / page.width));
      setHeight(i.offsetHeight);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(o);
    observer.observe(i);
    return () => observer.disconnect();
  }, [page.width]);

  const pages = Math.max(1, Math.ceil(height / page.height - 0.001));
  return (
    <div ref={outer} className="w-full">
      <div style={{ height: height * scale }} className="relative">
        <div
          ref={inner}
          className="absolute left-0 top-0 origin-top-left shadow-md ring-1 ring-black/10"
          style={{ width: page.width, transform: `scale(${scale})` }}
        >
          <ResumeTemplate content={content} paperSize={paperSize} />
          {Array.from({ length: pages - 1 }, (_, n) => (
            <div
              key={n}
              aria-hidden
              className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-sky-500/70"
              style={{ top: (n + 1) * page.height }}
            >
              <span className="absolute right-2 -top-6 rounded bg-sky-500 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                Page {n + 2}
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">
        {pages === 1 ? "1 page" : `${pages} pages`} · {paperSize}
      </p>
    </div>
  );
}
