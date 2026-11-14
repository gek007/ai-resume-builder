# Resume Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Signed-in people create, rename, duplicate and delete resumes, and edit them in a form beside a live preview of the ATS template, with autosave that never loses work.

**Architecture:**
- **Storage:** one `resume` table with the content in a JSONB column, checked by one Zod schema.
- **Data access:** a server-only module is the only code touching the table; every query is scoped to the signed-in user.
- **Mutations:** server actions wrap that module.
- **Editor:** a client component holds the document. A framework-free autosave controller debounces, retries, keeps a local draft and handles conflicts.
- **Template:** a pure React component renders the preview (and, later, the PDF).

**Tech Stack:** Next.js 16.4.6 (App Router, `cacheComponents: true`), React 19.3, Drizzle on Neon, Zod 4.6.7, Vitest 5 (+ happy-dom for components), Tailwind 4.3.

**Spec:** [docs/superpowers/specs/2026-11-14-resume-editor-design.md](../specs/2026-11-14-resume-editor-design.md) (parent: [v1 design spec](../specs/2026-11-14-ai-resume-builder-v1-design.md) §4, §5, §11.7)

## Global Constraints

- **Next 16:** read `node_modules/next/dist/docs/` before writing routing or server-action code.
  - Route `params` and `searchParams` are Promises.
  - With `cacheComponents`, any session or params read sits inside `<Suspense>`.
  - Actions call `refresh()` from `next/cache` after a mutation.
- **Ownership:** every read and write of `resume` goes through `lib/resume/data.ts` with the signed-in user id. Another user's resume behaves exactly like a missing one (`null` / `not_found`), never an error that reveals it exists.
- **Ids** are text UUIDs (`crypto.randomUUID()`), so a malformed id in a URL is simply "not found" and never a database cast error.
- **Timestamps:** `updatedAt` is `timestamp(3) with time zone`, set in code with `new Date()`. It crosses the client boundary as an ISO string, and conflict checks compare it exactly.
- **Content caps:**
  - short text 200 chars; summary and job description 5,000 / 20,000
  - bullets 500 chars, at most 30 per entry; at most 30 entries per section
  - links 5; skills 100; serialized content under 100 KB
- **Template:** scoped styles, an embedded font via `next/font` (Source Sans 3), no client-only APIs. A4 = 210×297 mm, Letter = 8.5×11 in.
- **Server-only:** `lib/resume/data.ts` imports `"server-only"`.
- **Commits:** on branch `feat/resume-editor` after each task. No push or merge without the owner's OK.

## Review Focus

1. **Closing the tab or reloading with unsaved typing:** the edits come back from the local draft, and the browser shows a "leave site?" prompt while a save is pending. → Task 5 test `writes a local draft on every update, before saving`; Task 6 adds the `beforeunload` guard.
2. **Content over the caps** (pasted megabytes, a crafted request): the server refuses with `invalid`. The editor shows "Not saved — this resume is too large" and stops retrying instead of looping. → Task 3 test `saveResume rejects content over the caps`; Task 5 test `does not retry an invalid save`.
3. **Resume deleted in another tab while open here:** the save returns `not_found`. The editor says "This resume was deleted", stops saving and keeps the local draft. → Task 5 test `stops on not_found and keeps the draft`.
4. **A bad or someone else's id in the URL** (`/resumes/abc`, another user's id): a 404 page, never a 500 or the other person's data. → Task 2 test `getResume returns null for another user's id and for a malformed id`; Task 6 calls `notFound()`.
5. **Session expires mid-edit:** the save action returns `unauthorized` (not a redirect that throws away the editor). The editor says "You were signed out — sign in again; your changes are kept on this device". → Task 3 test `saveResumeAction returns unauthorized without a session`; Task 5 test `stops on unauthorized and keeps the draft`.

---

## File map

| File | Responsibility |
|---|---|
| `lib/resume/schema.ts` | Zod schema, types, section keys, `emptyResume()`, `newId()` |
| `lib/db/schema/resume.ts` | Drizzle `resume` table |
| `lib/resume/data.ts` | All resume queries, scoped to a user (server-only) |
| `app/resumes/actions.ts` | Server actions for dashboard and editor |
| `components/resume/resume-template.tsx`, `resume-template.module.css`, `components/resume/font.ts` | The ATS template |
| `lib/resume/autosave.ts` | Framework-free autosave controller |
| `app/resumes/[id]/page.tsx`, `app/resumes/[id]/editor/*.tsx` | Editor page and form components |
| `app/dashboard/page.tsx`, `app/dashboard/resume-list.tsx` | Dashboard list and actions |

---

### Task 1: Content schema

**Files:** Create `lib/resume/schema.ts`, `tests/resume-schema.test.ts`. Install `zod@4.6.7` as a direct dependency.

**Interfaces — Produces:**
- `SECTION_KEYS = ["contact","summary","experience","military","projects","education","skills","languages","certifications"] as const`; `type SectionKey`
- `LANGUAGE_LEVELS = ["native","fluent","professional","conversational","basic"] as const`
- `PAPER_SIZES = ["A4","Letter"] as const`; `type PaperSize`
- `yearMonthSchema`: `"YYYY-MM"` (month 01–12)
- `resumeContentSchema`; `type ResumeContent = z.infer<…>`. Shape per spec §4:
  - `contact { fullName, headline, email, phone, location, links: {id,label,url}[] }`
  - `summary: string`
  - `experience` and `military`: `{id, role, organization, location, start: YearMonth|null, end: YearMonth|"present"|null, bullets: {id,text}[]}[]`
  - `projects { id, name, link, start, end, bullets }[]`
  - `education { id, school, degree, field, start, end, notes }[]`
  - `skills { id, name }[]`
  - `languages { id, name, level }[]`
  - `certifications { id, name, issuer, date: YearMonth|null }[]`
  - `layout { order: SectionKey[]; hidden: SectionKey[] }`
- `emptyResume(email: string): ResumeContent`; `newId(): string`
- `parseResumeContent(input: unknown): { ok: true; content: ResumeContent } | { ok: false; reason: "invalid" | "too_large" }`. Checks the 100 KB serialized cap first.

- [ ] **Step 1: Write failing tests:**
  - `emptyResume("a@b.c") passes the schema, has the email in contact, and lists all 9 sections in order with none hidden`
  - `layout.order must contain each section exactly once and start with contact`
  - `contact can't be hidden`
  - `rejects a bullet over 500 chars and more than 30 bullets`
  - `accepts end "present" and rejects "2024-13"`
  - `parseResumeContent reports too_large over 100 KB`
  - `rejects unknown keys` (strict objects)
- [ ] **Step 2:** `npx vitest run tests/resume-schema.test.ts` → FAIL (module missing).
- [ ] **Step 3: Implement** with Zod 4 strict objects and `.refine` for the layout rules.
- [ ] **Step 4:** Run → PASS; `npm run typecheck` → PASS.
- [ ] **Step 5: Commit** `feat(resume): content schema`.

### Task 2: Table, migration and data module

**Files:** Create `lib/db/schema/resume.ts`, `lib/resume/data.ts`, `tests/resume-data.test.ts`, migration `drizzle/0001_*.sql`. Modify `lib/db/schema/index.ts`.

**Interfaces:**
- Consumes `ResumeContent`, `PaperSize`, `emptyResume` (Task 1).
- Produces:
  - `type ResumeSummary = { id; title; jobTitle; jobCompany; updatedAt: Date }`
  - `type ResumeRecord = ResumeSummary & { content: ResumeContent; paperSize: PaperSize; jobDescription: string }`
  - `type ResumeSaveInput = { title; content; paperSize; jobTitle; jobCompany; jobDescription }`
  - `listResumes(userId): Promise<ResumeSummary[]>` (newest `updatedAt` first, ties by id)
  - `getResume(userId, id): Promise<ResumeRecord | null>`
  - `createResume(userId, email): Promise<string>` (title "Untitled resume")
  - `renameResume(userId, id, title): Promise<boolean>`
  - `duplicateResume(userId, id): Promise<string | null>` (title "<title> (copy)"; job fields copied)
  - `deleteResume(userId, id): Promise<boolean>`
  - `saveResume(userId, id, input, base: Date | "force"): Promise<{ status: "saved"; updatedAt: Date } | { status: "conflict" } | { status: "not_found" }>`. One conditional UPDATE `where id and user_id [and updated_at = base]`. When it updates 0 rows, a follow-up scoped SELECT tells `conflict` from `not_found`.

**Table** `resume`:
- `id text pk`
- `user_id text not null references user(id) on delete cascade`
- `title text not null`
- `content jsonb not null`
- `paper_size text not null default 'A4'`
- `job_title`, `job_company`, `job_description`: text, default `''`
- `created_at`, `updated_at`: `timestamp(3) with time zone not null`
- index `(user_id, updated_at desc)`

- [ ] **Step 1: Write failing tests** (test branch; two users inserted directly into `user` with random ids):
  - `create then list shows only the owner's resumes, newest first`
  - `getResume returns null for another user's id and for a malformed id`
  - `user B can't rename, duplicate, delete or save user A's resume` (each returns false / null / `not_found`, and A's row is unchanged)
  - `saveResume with the current updatedAt saves and returns a newer updatedAt`
  - `saveResume with a stale updatedAt returns conflict and changes nothing`
  - `saveResume with "force" overwrites`
  - `duplicate copies content and job fields with a new id and "(copy)" title`
  - `deleting the user deletes their resumes` (cascade)
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3: Implement** the table and module.
- [ ] **Step 4: Migrate.** Run `npm run db:generate`, then `npm run db:migrate` for dev, and again for test (with `.env.test.local` sourced). Confirm the `resume` table on both branches via the Neon MCP.
- [ ] **Step 5:** `npm test && npm run typecheck` → PASS.
- [ ] **Step 6: Commit** `feat(resume): resume table and user-scoped data module`.

### Task 3: Server actions

**Files:** Create `app/resumes/actions.ts`, `tests/resume-actions.test.ts`.

**Interfaces:**
- Consumes Task 2 and `getCurrentUser` / `requireUser`.
- Produces (all `"use server"`):
  - `createResumeAction(): Promise<void>`: creates, then `redirect('/resumes/<id>')`
  - `renameResumeAction(id: string, title: string): Promise<{ ok: boolean }>`
  - `duplicateResumeAction(id: string): Promise<{ ok: boolean }>`
  - `deleteResumeAction(id: string): Promise<{ ok: boolean }>`
  - `saveResumeAction(id: string, input: unknown, base: string | "force"): Promise<SaveActionResult>`, where `SaveActionResult = { status: "saved"; updatedAt: string } | { status: "conflict" | "not_found" | "invalid" | "too_large" | "unauthorized" }`

  Mutations other than save call `refresh()`. Save never redirects: with no session it returns `unauthorized`. Title is trimmed and capped at 200 chars, falling back to "Untitled resume".

- [ ] **Step 1: Write failing tests.** Mock `next/headers` with a session cookie from `signInViaLink`; mock `next/navigation` (`redirect` throws `REDIRECT:`) and `next/cache` (`refresh` spy). Cases:
  - `saveResumeAction returns unauthorized without a session`
  - `saveResumeAction rejects content over the caps` (`too_large`) and `rejects malformed content` (`invalid`)
  - `saveResumeAction saves and returns an ISO updatedAt; a second save with the old base returns conflict`
  - `createResumeAction redirects to the new resume`
  - `rename/duplicate/delete on another user's id return ok:false`
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** `npm test && npm run typecheck` → PASS.
- [ ] **Step 5: Commit** `feat(resume): server actions`.

### Task 4: ATS template

**Files:** Create `components/resume/font.ts`, `components/resume/resume-template.tsx`, `components/resume/resume-template.module.css`, `tests/resume-template.test.tsx`.

**Interfaces — Produces:** `ResumeTemplate({ content, paperSize }: { content: ResumeContent; paperSize: PaperSize }): JSX.Element`, a single root `<article data-paper={paperSize}>`. It renders sections in `layout.order`, skips hidden sections and empty fields, and formats dates "Jan 2024 – Present".

- [ ] **Step 1: Write failing tests** with `renderToStaticMarkup`:
  - `renders sections in layout order`
  - `omits hidden sections`
  - `omits a section with no content` (e.g. empty projects)
  - `formats "2024-01" to "present" as "Jan 2024 – Present"`
  - `renders every bullet as a list item`
  - `escapes user text` (a `<script>` in a bullet appears as text)
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement the plain single-column style (like the PDF spike) with Source Sans 3 from `next/font/google`. Add a `ResumePreview` wrapper (in the same folder) that shows the template at true page width, scaled to fit its container, with dashed page-boundary marks every 297 mm (A4) or 11 in (Letter). **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `feat(resume): ATS template`.

### Task 5: Autosave controller

**Files:** Create `lib/resume/autosave.ts`, `tests/resume-autosave.test.ts`.

**Interfaces:**
- Consumes `SaveActionResult` (Task 3).
- Produces:
  - `type AutosaveStatus = "saved" | "saving" | "retrying" | "conflict" | "deleted" | "signed_out" | "too_large"`
  - `type DraftStorage = { get(key): string | null; set(key, value): void; remove(key): void }`
  - `createAutosave<T>(opts: { key: string; base: string; save: (doc: T, base: string | "force") => Promise<SaveActionResult>; storage: DraftStorage; onStatus: (s: AutosaveStatus) => void; onSaved?: (updatedAt: string) => void; debounceMs?: number /* 800 */; maxBackoffMs?: number /* 30000 */ })`, returning `{ update(doc: T): void; flush(): Promise<void>; keepMine(): Promise<void>; hasPending(): boolean; dispose(): void }`
  - `readDraft<T>(storage, key, serverUpdatedAt: string): T | null`: returns the draft only if it was based on `serverUpdatedAt`
- Storage wraps every call in try/catch (private mode).

- [ ] **Step 1: Write failing tests** with fake timers and an in-memory storage:
  - `writes a local draft on every update, before saving`
  - `debounces: three quick updates make one save of the last doc`
  - `clears the draft and reports saved after a successful save; the next save uses the new base`
  - `retries a thrown save with backoff (1s, 2s, 4s… capped at 30s) and reports retrying`
  - `does not retry an invalid or too_large save`
  - `stops on conflict; keepMine saves with "force"`
  - `stops on not_found and keeps the draft` (status `deleted`)
  - `stops on unauthorized and keeps the draft`
  - `readDraft ignores a draft based on an older updatedAt`
  - `never runs two saves at once` (an update during an in-flight save queues one more)
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `feat(resume): autosave controller`.

### Task 6: Editor page

**Files:** Create `app/resumes/[id]/page.tsx`, `app/resumes/[id]/editor/resume-editor.tsx` (client root: state, autosave, tabs, top bar), `section-card.tsx`, `entry-list.tsx`, `bullet-list.tsx`, `month-year-field.tsx`, `contact-form.tsx`, `use-autosave.ts`, `tests/bullet-list.test.tsx`.

**Interfaces:**
- Consumes Tasks 1–5.
- `page.tsx`: a `<Suspense>` child awaits `params`, calls `requireUser("/resumes/<id>")`, then `getResume`. A missing resume calls `notFound()`; otherwise it renders `<ResumeEditor resume={…serialized, updatedAt ISO} />`. Metadata `robots: { index: false }`.
- `useAutosave(resumeId, initial)` wraps `createAutosave` with `localStorage`, offers a newer local draft on load ("Restore unsaved changes?") and adds a `beforeunload` prompt while `hasPending()`.

- [ ] **Step 1: Write a failing test** `bullet-list.test.tsx` (happy-dom):
  - `Enter adds a bullet after the current one and focuses it`
  - `Backspace on an empty bullet removes it and focuses the previous one`
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3: Implement the editor.**
  - **Layout:** two columns at `lg:` and above (form | sticky preview, scaled to fit); below `lg`, Edit / Preview tabs.
  - **Top bar:** editable title, A4/Letter select, status text per `AutosaveStatus`, and a "← Dashboard" link.
  - **Section cards:** each has move up/down (disabled at the ends; Contact fixed first) and hide/show.
  - **Status copy:**
    - `saving`: "Saving…"
    - `saved`: "Saved"
    - `retrying`: "Not saved — retrying"
    - `conflict`: a banner "This resume was changed in another tab or device." with **Load latest** (reload the page) and **Keep mine**
    - `deleted`: "This resume was deleted."
    - `signed_out`: "You were signed out. Sign in again — your changes are kept on this device."
    - `too_large`: "Not saved — this resume is too large."
  - The job title / company / description fields sit in a collapsible "Target job" card.
- [ ] **Step 4:** `npm test && npm run typecheck && npm run lint && npm run build` → PASS.
- [ ] **Step 5: Check in the browser** on the dev server:
  - edit every section, then reload mid-typing (nothing lost);
  - open two tabs, edit both, and see the conflict banner; check Keep mine;
  - change paper size and see the preview update;
  - at 360 px, the tabs work with no horizontal scroll;
  - in dark mode, everything is readable.
- [ ] **Step 6: Commit** `feat(resume): editor with live preview and autosave`.

### Task 7: Dashboard

**Files:** Modify `app/dashboard/page.tsx`. Create `app/dashboard/resume-list.tsx` (client: rename inline, duplicate, delete with confirm).

**Interfaces:** Consumes `listResumes` and the Task 3 actions.

- [ ] **Step 1: Build the dashboard.** Inside the existing `requireUser` boundary, `listResumes(user.id)` renders:
  - Rows: title (links to the editor), "Made for <company> – <job title>" when set, and "Edited <relative time>".
  - Each row has Rename, Duplicate and Delete. Delete asks "Delete '<title>'? This can't be undone."
  - A **New resume** button submits `createResumeAction`.
  - With no resumes, an empty state with **New resume**. ("Import PDF" arrives with import.)
- [ ] **Step 2: Write a failing test** `resume-list.test.tsx` (happy-dom, actions mocked):
  - `delete asks for confirmation and calls the action only on confirm`
  - `shows "Made for" only when a job is set`

  Run → FAIL, implement, → PASS.
- [ ] **Step 3: Check in the browser:** create → appears → rename → duplicate → delete → empty state.
- [ ] **Step 4:** Full check (`npm test && npm run typecheck && npm run lint && npm run build`).
- [ ] **Step 5: Commit** `feat(resume): dashboard list with create, rename, duplicate, delete`.

### Task 8: Ship

- [ ] **Step 1:** Final whole-branch review (fresh reviewer), with fixes test-first.
- [ ] **Step 2:** With the owner's OK, migrate production (`DATABASE_URL_UNPOOLED` from the production env for that one command) and confirm the `resume` table via the Neon MCP.
- [ ] **Step 3:** With the owner's OK, merge to `main` and push. Watch the deployment, then check the live editor: create, edit, reload, delete.
