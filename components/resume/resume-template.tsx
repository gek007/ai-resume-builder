import type { ReactNode } from "react";
import type { PaperSize, ResumeContent, SectionKey, WorkEntry } from "@/lib/resume/schema";
import { resumeFont } from "./font";
import "./resume-template.css";

// Renders the live preview now and is printed to PDF later, so it uses no
// client-only APIs and no data the PDF wouldn't have.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LEVELS: Record<string, string> = {
  native: "Native",
  fluent: "Fluent",
  professional: "Professional",
  conversational: "Conversational",
  basic: "Basic",
};
const TITLES: Record<Exclude<SectionKey, "contact">, string> = {
  summary: "Summary",
  experience: "Experience",
  military: "Military Service",
  projects: "Projects",
  education: "Education",
  skills: "Skills",
  languages: "Languages",
  certifications: "Certifications",
};

function formatMonth(value: string | null): string {
  if (!value) return "";
  if (value === "present") return "Present";
  const [year, month] = value.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

export function formatDateRange(start: string | null, end: string | null): string {
  return [formatMonth(start), formatMonth(end)].filter(Boolean).join(" – ");
}

const joinParts = (parts: string[], sep: string) => parts.map((p) => p.trim()).filter(Boolean).join(sep);

function Entry({ title, sub, dates, bullets }: { title: string; sub?: string; dates: string; bullets?: { id: string; text: string }[] }) {
  const items = (bullets ?? []).filter((b) => b.text.trim());
  if (!title && !sub && !dates && items.length === 0) return null;
  return (
    <div className="rt-entry">
      <div className="rt-entry-head">
        <span>
          {title && <span className="rt-entry-title">{title}</span>}
          {title && sub ? ", " : ""}
          {sub && <span className="rt-sub">{sub}</span>}
        </span>
        {dates && <span className="rt-dates">{dates}</span>}
      </div>
      {items.length > 0 && (
        <ul className="rt-bullets">
          {items.map((b) => (
            <li key={b.id}>{b.text}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

const work = (entries: WorkEntry[]) =>
  entries.map((e) => (
    <Entry
      key={e.id}
      title={e.role}
      sub={joinParts([e.organization, e.location], " · ")}
      dates={formatDateRange(e.start, e.end)}
      bullets={e.bullets}
    />
  ));

function sectionBody(key: Exclude<SectionKey, "contact">, c: ResumeContent): ReactNode | null {
  switch (key) {
    case "summary":
      return c.summary.trim() ? <p className="rt-text">{c.summary}</p> : null;
    case "experience":
      return c.experience.length ? work(c.experience) : null;
    case "military":
      return c.military.length ? work(c.military) : null;
    case "projects":
      return c.projects.length
        ? c.projects.map((p) => (
            <Entry key={p.id} title={p.name} sub={p.link} dates={formatDateRange(p.start, p.end)} bullets={p.bullets} />
          ))
        : null;
    case "education":
      return c.education.length
        ? c.education.map((e) => (
            <Entry
              key={e.id}
              title={e.school}
              sub={joinParts([e.degree, e.field], ", ")}
              dates={formatDateRange(e.start, e.end)}
              bullets={e.notes.trim() ? [{ id: `${e.id}-notes`, text: e.notes }] : []}
            />
          ))
        : null;
    case "skills": {
      const names = c.skills.map((s) => s.name.trim()).filter(Boolean);
      return names.length ? <p className="rt-text">{names.join(", ")}</p> : null;
    }
    case "languages": {
      const items = c.languages.filter((l) => l.name.trim()).map((l) => `${l.name.trim()} (${LEVELS[l.level]})`);
      return items.length ? <p className="rt-text">{items.join(" · ")}</p> : null;
    }
    case "certifications":
      return c.certifications.length
        ? c.certifications.map((cert) => (
            <Entry key={cert.id} title={cert.name} sub={cert.issuer} dates={formatMonth(cert.date)} />
          ))
        : null;
  }
}

export function ResumeTemplate({ content, paperSize }: { content: ResumeContent; paperSize: PaperSize }) {
  const { contact, layout } = content;
  const contactLine = joinParts(
    [contact.email, contact.phone, contact.location, ...contact.links.map((l) => l.label || l.url)],
    " · ",
  );
  return (
    <article className={`rt-page ${resumeFont.className}`} data-paper={paperSize}>
      <header>
        {contact.fullName.trim() && <h1 className="rt-name">{contact.fullName}</h1>}
        {contact.headline.trim() && <p className="rt-headline">{contact.headline}</p>}
        {contactLine && <p className="rt-contact-line">{contactLine}</p>}
      </header>
      {layout.order.map((key) => {
        if (key === "contact" || layout.hidden.includes(key)) return null;
        const body = sectionBody(key, content);
        if (!body) return null;
        return (
          <section key={key} className="rt-section">
            <h2 className="rt-section-title">{TITLES[key]}</h2>
            {body}
          </section>
        );
      })}
    </article>
  );
}
