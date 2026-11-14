import { renderToStaticMarkup } from "react-dom/server";
import { ResumeTemplate, formatDateRange } from "@/components/resume/resume-template";
import { emptyResume, newId, type ResumeContent } from "@/lib/resume/schema";

vi.mock("@/components/resume/font", () => ({ resumeFont: { className: "font-test" } }));

function sample(): ResumeContent {
  const r = emptyResume("dana@example.com");
  return {
    ...r,
    contact: { ...r.contact, fullName: "Dana Levi", headline: "Frontend Engineer", location: "Tel Aviv" },
    summary: "Builds accessible React apps.",
    experience: [
      {
        id: newId(),
        role: "Senior Engineer",
        organization: "Acme",
        location: "",
        start: "2024-01",
        end: "present",
        bullets: [
          { id: newId(), text: "Cut load time by 42%." },
          { id: newId(), text: "Led a team of 4." },
        ],
      },
    ],
    skills: [
      { id: newId(), name: "TypeScript" },
      { id: newId(), name: "React" },
    ],
  };
}

const html = (content: ResumeContent) => renderToStaticMarkup(<ResumeTemplate content={content} paperSize="A4" />);
const headings = (markup: string) => [...markup.matchAll(/<h2[^>]*>([^<]+)<\/h2>/g)].map((m) => m[1]);

test("renders sections in layout order", () => {
  const r = sample();
  expect(headings(html(r))).toEqual(["Summary", "Experience", "Skills"]);
  const order: ResumeContent["layout"]["order"] = [
    "contact", "skills", "experience", "summary", "military", "projects", "education", "languages", "certifications",
  ];
  expect(headings(html({ ...r, layout: { ...r.layout, order } }))).toEqual(["Skills", "Experience", "Summary"]);
});

test("omits hidden sections", () => {
  const r = sample();
  expect(headings(html({ ...r, layout: { ...r.layout, hidden: ["summary"] } }))).toEqual(["Experience", "Skills"]);
});

test("omits a section with no content", () => {
  const markup = html(sample());
  expect(markup).not.toContain("Projects");
  expect(markup).not.toContain("Military Service");
});

test('formats "2024-01" to "present" as "Jan 2024 – Present"', () => {
  expect(formatDateRange("2024-01", "present")).toBe("Jan 2024 – Present");
  expect(formatDateRange("2019-09", "2021-06")).toBe("Sep 2019 – Jun 2021");
  expect(formatDateRange("2019-09", null)).toBe("Sep 2019");
  expect(formatDateRange(null, null)).toBe("");
  expect(html(sample())).toContain("Jan 2024 – Present");
});

test("renders every bullet as a list item", () => {
  const markup = html(sample());
  expect(markup.match(/<li[ >]/g)).toHaveLength(2);
  expect(markup).toContain("Cut load time by 42%.");
});

test("escapes user text", () => {
  const r = sample();
  r.summary = "<script>alert(1)</script>";
  const markup = html(r);
  expect(markup).not.toContain("<script>");
  expect(markup).toContain("&lt;script&gt;");
});

test("marks the paper size and uses the embedded font", () => {
  const markup = renderToStaticMarkup(<ResumeTemplate content={sample()} paperSize="Letter" />);
  expect(markup).toMatch(/^<article[^>]*data-paper="Letter"/);
  expect(markup).toContain("font-test");
});
