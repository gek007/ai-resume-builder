# Resume Editor: Design

Date: 2026-11-14 · Status: approved by the owner · Parent: [v1 design spec](2026-11-14-ai-resume-builder-v1-design.md) (§4 content and flows, §5 storage and security, §11.7 autosave)

Labels: **Decided** = the owner chose it. **Call** = the builder's choice; change it if wrong.

## 1. Intent

The core of v1: a signed-in person creates resumes, edits them in a form next to a live preview of the one ATS-friendly template, and never loses typed work. Everything later (PDF export, score, tailoring, AI, import) reads the same content and renders the same template, so this round fixes the content schema and the template for the rest of v1.

## 2. Goals, non-goals, anti-goals

**Goals (Decided)**
- **Dashboard** (`/dashboard`): the signed-in person's resumes, newest edit first, each with title, attached job ("Acme – Frontend Engineer") and last-edited time; create, rename, duplicate and delete (with a confirm).
- **Editor** (`/resumes/[id]`): form and live preview side by side on desktop; **Edit / Preview tabs** on phones.
- **Sections:** Contact, Summary, Experience, Military Service, Projects, Education, Skills, Languages, Certifications. Any section can be **hidden** and **moved up or down**; Contact stays first and can't be hidden.
- **One attached job** per resume: job title, company, pasted description.
- **Paper size** per resume: A4 (default) or US Letter.
- **Autosave** per v1 spec §11.7: debounced save; automatic retry; unsaved changes kept in the browser so a reload loses nothing; status "Saving…", "Saved", "Not saved — retrying"; a save that would overwrite a change made in another tab is refused and the person is told.
- **One Zod schema** checks resume content on the client and the server.
- **One template component** renders the preview now and will be printed to PDF later.
- **Ownership checked on every read and write.**

**Non-goals (this round)**: PDF download, score, keyword tailoring, AI writer, PDF import, free-plan limits (they ship with billing), the final visual design, a second template.

**Anti-goals**
- Typed work lost, or lost silently.
- Someone sees, edits, duplicates or deletes another person's resume.
- The preview shows something the later PDF won't (different fonts, sizes or order).

## 3. Approaches

| Approach | Trade-off | Outcome |
|---|---|---|
| **Whole-document saves**: client keeps the resume in state; a debounced server action saves the full JSON with the `updatedAt` it started from | Simple, matches the spec's one-JSON-column storage and its "check against updatedAt" conflict rule. Saves resend the whole document (small: well under 100 KB). | **Chosen** (one sensible way, owner approved). |
| Per-field or patch saves | Less data per save, but conflict handling and validation get complicated, and the spec stores one JSON document. | Rejected. |
| Real-time collaborative editing | Not needed: one person edits their own resume. | Rejected. |

## 4. How it works

**Content schema** *(Call: field names are the builder's; shape follows v1 §4)*: one `ResumeContent` object:
- `contact` (full name, headline, email, phone, location, up to 5 links)
- `summary` (text)
- `experience` and `military`: entries with role, organization, location, start, end ("Present" allowed) and bullets
- `projects` (name, link, dates, bullets), `education` (school, degree, field, dates, notes)
- `skills` (list of names), `languages` (name + level: native, fluent, professional, conversational, basic), `certifications` (name, issuer, date)
- `layout`: section order and hidden sections

Dates are month + year. Every list item has a stable id (for React keys and reordering). Sizes are capped (text fields, list lengths, total size under 100 KB) so a broken or hostile client can't store huge documents.

**Storage** *(v1 §5)*: table `resume` (id, user id with cascade delete, title, content JSONB, paper size, job title, job company, job description, created/updated times), indexed by user and last edit. A new resume starts from an empty, valid content object with the person's account email in Contact.

**Data access** *(Call)*: one server-only module is the only code that touches `resume`. Every function takes the signed-in user id and scopes every query to it, so another person's resume reads as "not found". Server actions call `requireUser()`, validate input with the schema, call that module, and `refresh()` the router.

**Saves and conflicts** *(v1 §11.7)*: a save sends the content plus the `updatedAt` it was based on; the update only applies if the stored `updatedAt` still matches (one conditional UPDATE). On a mismatch the editor shows "This resume was changed in another tab or device" with **Load latest** (discard local edits) and **Keep mine** (overwrite). Failed saves retry with backoff; the local draft (browser storage, keyed by resume id and the `updatedAt` it's based on) is cleared once saved and offered back after a reload if it's newer than the server copy.

**Template** *(Call)*: a plain, single-column, ATS-safe layout (like the PDF spike) as one React component with no client-only code, styled in a scoped stylesheet with an **embedded font** served by the app. The preview shows it at true page width with page-boundary marks for A4 or Letter. Hidden sections and empty fields don't render.

**Editor UI** *(Call; plain, restyled later)*: collapsible section cards in layout order, each with move up/down and hide; each bullet is its own input (Enter adds the next, Backspace on an empty bullet removes it); add/remove/reorder entries; month-year pickers with a "Present" checkbox; a sticky top bar with the title (editable), paper size, save status and a link back to the dashboard.

## 5. Done means

- **Tests:** the schema (valid empty resume, caps, dates, "Present"); the data module against the Neon test branch, including **user A can't read, save, rename, duplicate or delete user B's resume**; the conditional save (stale `updatedAt` refused); the autosave logic (debounce, retry, local draft, conflict) with fake timers; the template (order, hidden sections, empty fields, "Present").
- **Browser check:** create → edit every section → reload mid-typing (nothing lost) → two tabs (conflict shown) → duplicate → delete; phone width with tabs; dark mode readable.
- Lint, type check, tests and production build pass; deployed after the owner's OK.

## 6. Left to the builder

File layout, exact field names and caps, debounce and retry timings (around 800 ms debounce; backoff to 30 s), the embedded font choice, and editor styling within the current look.
