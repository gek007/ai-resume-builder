"use client";

import { LANGUAGE_LEVELS, newId, type ResumeContent, type SectionKey, type WorkEntry } from "@/lib/resume/schema";
import { BulletList } from "./bullet-list";
import { EntryList } from "./entry-list";
import { MonthYearField } from "./month-year-field";
import { AddButton, Field, SmallButton, TextArea, TextInput, inputClass } from "./ui";

type Update = (patch: Partial<ResumeContent>) => void;

const newWork = (): WorkEntry => ({ id: newId(), role: "", organization: "", location: "", start: null, end: null, bullets: [] });

function DateRange({
  start,
  end,
  onChange,
}: {
  start: string | null;
  end: string | null;
  onChange: (patch: { start?: string | null; end?: string | null }) => void;
}) {
  return (
    <div className="flex flex-wrap gap-4">
      <MonthYearField label="Start" value={start} onChange={(v) => onChange({ start: v })} />
      <MonthYearField label="End" value={end} allowPresent onChange={(v) => onChange({ end: v })} />
    </div>
  );
}

function WorkEntries({ items, onChange, kind }: { items: WorkEntry[]; onChange: (items: WorkEntry[]) => void; kind: "job" | "military" }) {
  return (
    <EntryList
      items={items}
      onChange={onChange}
      newItem={newWork}
      addLabel={kind === "job" ? "+ Add job" : "+ Add service"}
      itemLabel={(e, i) => [e.role, e.organization].filter(Boolean).join(" · ") || `${kind === "job" ? "Job" : "Service"} ${i + 1}`}
      renderItem={(e, update) => (
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={kind === "job" ? "Role" : "Role"}>
              <TextInput value={e.role} maxLength={200} onChange={(ev) => update({ role: ev.target.value })} />
            </Field>
            <Field label={kind === "job" ? "Company" : "Unit"}>
              <TextInput value={e.organization} maxLength={200} onChange={(ev) => update({ organization: ev.target.value })} />
            </Field>
            <Field label="Location">
              <TextInput value={e.location} maxLength={200} onChange={(ev) => update({ location: ev.target.value })} />
            </Field>
          </div>
          <DateRange start={e.start} end={e.end} onChange={update} />
          <BulletList bullets={e.bullets} onChange={(bullets) => update({ bullets })} />
        </div>
      )}
    />
  );
}

function ContactForm({ content, update }: { content: ResumeContent; update: Update }) {
  const c = content.contact;
  const set = (patch: Partial<ResumeContent["contact"]>) => update({ contact: { ...c, ...patch } });
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name">
          <TextInput value={c.fullName} maxLength={200} autoComplete="name" onChange={(e) => set({ fullName: e.target.value })} />
        </Field>
        <Field label="Headline">
          <TextInput value={c.headline} maxLength={200} placeholder="Frontend Engineer" onChange={(e) => set({ headline: e.target.value })} />
        </Field>
        <Field label="Email">
          <TextInput type="email" value={c.email} maxLength={200} onChange={(e) => set({ email: e.target.value })} />
        </Field>
        <Field label="Phone">
          <TextInput type="tel" value={c.phone} maxLength={200} onChange={(e) => set({ phone: e.target.value })} />
        </Field>
        <Field label="Location" className="sm:col-span-2">
          <TextInput value={c.location} maxLength={200} placeholder="Tel Aviv, Israel" onChange={(e) => set({ location: e.target.value })} />
        </Field>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-muted">Links</span>
        {c.links.map((link, i) => (
          <div key={link.id} className="grid grid-cols-[8rem_minmax(0,1fr)_auto] items-center gap-2">
            <TextInput
              aria-label="Link label"
              placeholder="LinkedIn"
              value={link.label}
              maxLength={200}
              onChange={(e) => set({ links: c.links.map((l, j) => (j === i ? { ...l, label: e.target.value } : l)) })}
            />
            <TextInput
              aria-label="Link URL"
              placeholder="linkedin.com/in/you"
              value={link.url}
              maxLength={500}
              onChange={(e) => set({ links: c.links.map((l, j) => (j === i ? { ...l, url: e.target.value } : l)) })}
            />
            <SmallButton label="Remove link" tone="danger" onClick={() => set({ links: c.links.filter((_, j) => j !== i) })}>
              ✕
            </SmallButton>
          </div>
        ))}
        <AddButton onClick={() => set({ links: [...c.links, { id: newId(), label: "", url: "" }] })} disabled={c.links.length >= 5}>
          + Add link
        </AddButton>
      </div>
    </div>
  );
}

function SkillsForm({ content, update }: { content: ResumeContent; update: Update }) {
  // Comma-separated in the form; stored as a list.
  const text = content.skills.map((s) => s.name).join(", ");
  return (
    <Field label="Skills, separated by commas">
      <TextArea
        rows={3}
        defaultValue={text}
        placeholder="TypeScript, React, PostgreSQL"
        onChange={(e) => {
          const names = e.target.value.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 100);
          update({ skills: names.map((name, i) => ({ id: content.skills[i]?.id ?? newId(), name: name.slice(0, 100) })) });
        }}
      />
    </Field>
  );
}

export function SectionForm({ section, content, update }: { section: SectionKey; content: ResumeContent; update: Update }) {
  switch (section) {
    case "contact":
      return <ContactForm content={content} update={update} />;
    case "summary":
      return (
        <Field label="A few sentences about you">
          <TextArea rows={5} value={content.summary} maxLength={5000} onChange={(e) => update({ summary: e.target.value })} />
        </Field>
      );
    case "experience":
      return <WorkEntries kind="job" items={content.experience} onChange={(experience) => update({ experience })} />;
    case "military":
      return <WorkEntries kind="military" items={content.military} onChange={(military) => update({ military })} />;
    case "projects":
      return (
        <EntryList
          items={content.projects}
          onChange={(projects) => update({ projects })}
          newItem={() => ({ id: newId(), name: "", link: "", start: null, end: null, bullets: [] })}
          addLabel="+ Add project"
          itemLabel={(p, i) => p.name || `Project ${i + 1}`}
          renderItem={(p, set) => (
            <div className="flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <TextInput value={p.name} maxLength={200} onChange={(e) => set({ name: e.target.value })} />
                </Field>
                <Field label="Link">
                  <TextInput value={p.link} maxLength={500} onChange={(e) => set({ link: e.target.value })} />
                </Field>
              </div>
              <DateRange start={p.start} end={p.end} onChange={set} />
              <BulletList bullets={p.bullets} onChange={(bullets) => set({ bullets })} />
            </div>
          )}
        />
      );
    case "education":
      return (
        <EntryList
          items={content.education}
          onChange={(education) => update({ education })}
          newItem={() => ({ id: newId(), school: "", degree: "", field: "", start: null, end: null, notes: "" })}
          addLabel="+ Add education"
          itemLabel={(e, i) => e.school || `Education ${i + 1}`}
          renderItem={(e, set) => (
            <div className="flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="School">
                  <TextInput value={e.school} maxLength={200} onChange={(ev) => set({ school: ev.target.value })} />
                </Field>
                <Field label="Degree">
                  <TextInput value={e.degree} maxLength={200} placeholder="B.Sc." onChange={(ev) => set({ degree: ev.target.value })} />
                </Field>
                <Field label="Field of study" className="sm:col-span-2">
                  <TextInput value={e.field} maxLength={200} onChange={(ev) => set({ field: ev.target.value })} />
                </Field>
              </div>
              <DateRange start={e.start} end={e.end} onChange={set} />
              <Field label="Notes (honors, thesis, GPA)">
                <TextArea rows={2} value={e.notes} maxLength={1000} onChange={(ev) => set({ notes: ev.target.value })} />
              </Field>
            </div>
          )}
        />
      );
    case "skills":
      return <SkillsForm content={content} update={update} />;
    case "languages":
      return (
        <EntryList
          items={content.languages}
          onChange={(languages) => update({ languages })}
          newItem={() => ({ id: newId(), name: "", level: "fluent" as const })}
          addLabel="+ Add language"
          itemLabel={(l, i) => l.name || `Language ${i + 1}`}
          renderItem={(l, set) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Language">
                <TextInput value={l.name} maxLength={200} onChange={(e) => set({ name: e.target.value })} />
              </Field>
              <Field label="Level">
                <select className={`${inputClass} w-full`} value={l.level} onChange={(e) => set({ level: e.target.value as typeof l.level })}>
                  {LANGUAGE_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level[0].toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}
        />
      );
    case "certifications":
      return (
        <EntryList
          items={content.certifications}
          onChange={(certifications) => update({ certifications })}
          newItem={() => ({ id: newId(), name: "", issuer: "", date: null })}
          addLabel="+ Add certification"
          itemLabel={(c, i) => c.name || `Certification ${i + 1}`}
          renderItem={(c, set) => (
            <div className="flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <TextInput value={c.name} maxLength={200} onChange={(e) => set({ name: e.target.value })} />
                </Field>
                <Field label="Issuer">
                  <TextInput value={c.issuer} maxLength={200} onChange={(e) => set({ issuer: e.target.value })} />
                </Field>
              </div>
              <MonthYearField label="Date" value={c.date} onChange={(date) => set({ date })} />
            </div>
          )}
        />
      );
  }
}
