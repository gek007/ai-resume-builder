# AI Resume Builder v1: Design Spec

Date: 2026-11-14 · Status: interview complete except visual design · Product source: [PLAN.md](../../../PLAN.md)

This spec records every decision from the v1 interview. Where it differs from PLAN.md, this spec wins (for example, billing is Paddle, not Stripe).

Labels used below:
- **Decided:** the owner chose it.
- **Call:** proposed during the interview and not objected to. Change it if it turns out wrong.
- **ASSUMPTION:** a default set where the owner gave no firm answer.

---

## 1. Intent

- **What:** a simpler, cheaper Rezi. One loop: **build a resume → score it → tailor it to a job description → download a PDF.**
- **Why:** a real product with real billing and real security. The aim is **polish**, not speed. *(Decided)*
- **No launch date.** Quality comes first, and the implementation plan will give an estimated timeline. *(Decided)*

### Goals
- A person can sign up, build or import a resume, score it, tailor it to a job, pay, and download an ATS-readable PDF without help.
- Billing, limits and data access are correct and secure from the first release.

### Non-goals for v1
These are carried over from PLAN.md: cover letters, DOCX export, a second template, mock interviews, human review, LinkedIn import, Google Drive export, dark mode, team and enterprise features, and an admin panel.

### Anti-goals: v1 has failed if any of these happen, even if it technically works
- Typed work is lost (autosave fails silently).
- The PDF doesn't match the preview, or an ATS can't read its text.
- Someone pays and doesn't get Pro, or gets Pro without paying.
- Someone can see or edit another person's resume.
- A bug or an abuser runs up an uncapped Claude bill.

---

## 2. Users and market

- **First users:** the owner's friends in Israel. They pay from day one, using discount codes. *(Decided)*
- **Paying market:** Israel and Europe. *(Decided)*
- **Language:** English only, for the interface, the score rules and the AI prompts. *(Decided)*
- **Paper size:** A4 by default, with a US Letter option for each resume. *(Call)*
- **GDPR applies.** Data is stored in the EU, deleting an account really deletes the data, and the privacy policy lists every service that processes user data. *(Call)*

---

## 3. Plans and billing

**Provider: Paddle as the merchant of record.** Paddle is the legal seller and collects and files EU VAT. *(Decided.)* Stripe does not appear to accept businesses based in Israel. **Polar** was considered and is the fallback if Paddle won't pay out to Israel (see Open risks).

- **Seller:** an Israeli business. *(ASSUMPTION)*
- **Paid from day one.** Billing, limits and the paywall all ship in the first release. *(Decided)*
- **Discount codes** are created in the Paddle dashboard, for example a code for friends. There is nothing to build in the app. *(Decided)*
- **Refunds:** a 14-day money-back guarantee on every plan, Lifetime included. *(Decided.)* A refund arrives from Paddle as a webhook, the account drops to Free, and the downgrade rules below apply. Paddle doesn't allow an "all sales final" policy.
- **Required for Paddle approval:** a live site on the product's own domain with Terms of Service, a Privacy Policy, a Refund Policy and a pricing page. Apply early, because approval can take days.
- **Legal pages** *(Decided)*: the builder drafts all three from this spec: every service that processes user data, the 14-day refund, GDPR deletion, and Paddle as the merchant of record. The owner, or a lawyer, reviews them before launch.

| | Free | Pro Monthly ($19/mo) | Lifetime ($79 once) |
|---|---|---|---|
| Resumes | 1 | Unlimited | Unlimited |
| PDF import | Yes | Yes | Yes |
| AI actions | **5 per day in total** (placeholder) | Fair use: **100 per day** *(ASSUMPTION)* | Same as Pro |
| Score | Overall score + top 3 fixes | Every fix, with how to apply it | Same as Pro |
| Tailoring | Tailor the one resume **in place**: match % and a count of missing keywords; the list and one-click add are locked | Full keyword list, one-click add, **a new copy of the resume for each job** | Same as Pro |
| PDF downloads | **3 in total** *(ASSUMPTION: a lifetime total, not monthly)* | Unlimited | Unlimited |

- **One AI counter.** Every AI action counts toward the daily limit: import, keyword extraction, rewrites, bullet writing and the summary. *(Call)*
- **Downgrade** (cancellation, failed payment or refund) *(Decided)*:
  - Nothing is deleted.
  - The most recently edited resume stays editable. Every other resume becomes view-only, with an "Upgrade to edit" banner.
  - View-only resumes can still be downloaded, within Free's 3 downloads.
  - Upgrading again unlocks everything instantly.

---

## 4. Product scope and flows

### Build order (from PLAN.md)
Editor and template → PDF export → accounts → score → keyword targeting with AI rewrite → limits and Paddle → AI writer → PDF import.

All of these ship in the first public release, because it is paid from day one. The order is only the order they get built.

### Resume content (Decided)
- **Sections:** Contact, Summary, Experience, **Military Service**, Projects, Education, Skills, **Languages**, **Certifications**.
- **Military Service** has the same shape as an Experience entry (unit or role, dates, bullets), so its bullets are scored and tailored like a job's.
- **Languages** are name plus level (for example Hebrew, native).
- Users can **hide** any section and **move sections up or down**. The layout stays single-column. *(Call)*
- Each resume can have **one job description attached**: job title, company and the pasted text. The dashboard shows which job each resume was made for, for example "Acme – Frontend Engineer". *(Call)*

### Core flows
1. **New visitor:** the landing page, then sign up with Google or an email magic link, then an empty dashboard offering "Import PDF" or "Start from scratch".
2. **Edit:** the form and a live preview side by side. Changes autosave, with a visible saving or saved status.
3. **Score:** a 0–100 score with fixes sorted into high and medium impact. Free users see the top 3 fixes.
4. **Tailor:** paste a job description; AI extracts the keywords; the screen shows matched and missing keywords. On Pro, one click adds a missing keyword by rewriting a bullet with AI or adding it to Skills.
5. **Tailor for a new job (Pro):** copy the resume and attach the new job description to the copy.
6. **Download:** a PDF printed from the same HTML as the preview. It counts toward the download limit.
7. **Upgrade:** a pricing page that opens Paddle checkout. The webhook turns on Pro.
8. **Returning user:** the dashboard of their resumes, then back into the editor.

### Responsive design (Decided)
Desktop first, but fully usable on a phone. On small screens the editor shows **Edit** and **Preview** as tabs.

```
Phone
┌──────────────────────┐
│ [ Edit ]  Preview    │
├──────────────────────┤
│ Experience           │
│ ┌──────────────────┐ │
│ │ Built X that...  │ │
│ └──────────────────┘ │
│ + Add bullet  ✨ AI  │
└──────────────────────┘
```

### Pages
- **Public:** landing page (replacing the demo "Afterglow" page in `app/page.tsx`), pricing, terms, privacy and refund policy.
- **Signed in:** dashboard, the editor (`/resumes/[id]`), and account settings (billing portal link, account deletion).
- **No admin pages.** The owner uses the Paddle dashboard and the Neon console. *(ASSUMPTION)*

### Product name
Not chosen yet. The builder keeps it in **one config value**, so renaming is a one-line change. *(Decided)*

---

## 5. Architecture

| Area | Choice | Status |
|---|---|---|
| Framework | Next.js 16.4.6 (App Router), React 19.3, Tailwind 4.3, TypeScript (already in the repo) | Decided |
| Hosting | **Vercel** (Fluid Compute, Node.js), functions in Frankfurt (`fra1`) next to the Neon database | Decided 2026-11-14 (replaces Cloudways Velocity; the app was already deployed there, and headless Chromium was verified on it) |
| Database | **Neon Postgres**, Frankfurt, through **Drizzle ORM** | Decided |
| Auth | **Better Auth**: Google and email magic link, users stored in Neon | Decided |
| Email | **Resend**, for magic links | Call |
| AI | **Claude through the Vercel AI SDK**, using the owner's existing Anthropic account. **Haiku 5.5** for keywords and rewrites, **Sonnet 5.5** for PDF import | Decided (model split is a Call) |
| Billing | **Paddle**, merchant of record | Decided |
| Errors | **Sentry**, EU region | Call |
| Analytics | **Plausible**, EU, no cookies and no consent banner | Decided |

**Key technical calls:**
- **One template, two outputs.** The live preview is an HTML/React render of the template. The PDF is the **same HTML printed by headless Chromium on the server**, so it contains real, selectable text and always matches the preview. Verified on Vercel on 2026-11-14 with `puppeteer-core` + `@sparticuz/chromium`: real, extractable text on A4; about 2.7 s on a cold start and 0.15 s warm. The template must embed its own font (served with the app), because the Chromium build substitutes a bundled font for system fonts like Helvetica.
- **Resume storage.** Each resume's content is **one JSON column**, checked against one shared Zod schema. The schema is the single source of truth for the editor, the template, the score rules, the AI calls and import.
- **Scoring is plain code** in a pure function: resume JSON in, score and fixes out. It never calls AI, and it runs on both client and server.
- **AI calls run only on the server.** Each one checks the user's limit before calling Claude and records the call afterwards. AI output is structured: import returns resume JSON, and keyword extraction returns a keyword list.
- **Every server action and route checks that the resume belongs to the signed-in user.** This is the main defense against users reaching each other's data.
- **Paddle webhooks** are verified by signature and processed idempotently: an event ID is stored before acting on it. The plan stored in the database is the only thing the app trusts to decide paid access.
- **PDF import:** PDF files only, up to 5 MB. Claude reads the file, and the **file isn't stored** after parsing, which keeps the amount of stored personal data to a minimum.
- **Next.js 16 has breaking changes** (see AGENTS.md). Read `node_modules/next/dist/docs/` before writing routing, proxy, caching or server action code.

### Data model (Call: the builder may refine fields)
- **Better Auth tables:** user, session, account, verification.
- **resume:** id, userId (on delete cascade), title, content (JSONB), paperSize (`A4` or `Letter`), jobTitle, jobCompany, jobDescription, createdAt, updatedAt.
- **subscription:** userId (unique), paddleCustomerId, paddleSubscriptionId, plan (`free`, `pro_monthly` or `lifetime`), status, currentPeriodEnd.
- **usage:** userId, day, aiActions. **download_count:** userId, total.
- **ai_call_log:** userId, kind, model, input and output tokens, createdAt. Used to measure the real cost per call and to set the free limit.
- **paddle_event:** eventId (unique), type, processedAt.

Whether a resume is view-only after a downgrade is **worked out from the data, not stored**: if the user isn't Pro, only the resume with the latest `updatedAt` is editable.

### Security and privacy
- Secrets stay on the server only: Anthropic, Paddle, Resend, the Neon URL and the Better Auth secret.
- Rate limits on auth endpoints (Better Auth's built-in limits) and on AI endpoints, on top of the plan limits.
- A **hard monthly spending limit** set in the Anthropic console.
- **Account deletion** cancels any active Paddle subscription, then hard-deletes the user and all their resumes and usage rows. *(Call)*
- Accept the data processing agreements (DPAs) with Anthropic, Neon, Resend, Sentry and Paddle, and list them all in the privacy policy.

### SEO (Call)
The landing, pricing and legal pages are indexed, with metadata, an Open Graph image and a sitemap. App pages are `noindex`.

---

## 6. Environments and delivery

- **Environments** *(Call)*:
  - **Local:** a Neon dev branch and the Paddle sandbox.
  - **Staging:** Vercel preview deployments on the Neon `dev` branch and the Paddle sandbox.
  - **Production.**
- **CI** *(Call)*: GitHub Actions runs lint, type check, unit tests and end-to-end tests on every PR. Deploys use Vercel's git integration (pushes to `main` deploy production; other branches get previews).
- **Running costs:** under about **$100/month** before revenue. *(ASSUMPTION)*

---

## 7. Definition of done (Decided: "the money path is solid")

- **End-to-end tests** (Playwright, Paddle sandbox) of: sign up → import or build → score → tailor → upgrade → download the PDF → downgrade behavior.
- **Unit tests** for every score rule, the plan limit checks and the downgrade logic.
- **Security tests** proving that user A can't read, edit, copy, download or delete user B's resume.
- **A PDF check:** the text extracted from an exported PDF matches the resume content.
- **Manual checks** in Chrome and Safari, and on one iPhone and one Android phone.
- None of the anti-goals in section 1 can happen.

---

## 8. Approaches considered

| Decision | Chosen | Alternatives and why not |
|---|---|---|
| Billing | Paddle (MoR) | **Stripe:** appears not to accept Israeli businesses. **Polar:** officially lists Israel for payouts and has a Better Auth plugin; the owner kept Paddle, and Polar is the fallback. **Israeli card processor:** clumsy subscriptions and VAT handled manually. |
| Database | Neon + Drizzle | **Supabase:** all-in-one, but harder to leave later. **Convex:** real-time isn't needed and EU hosting is limited. |
| Auth | Better Auth | **Clerk:** faster with polished ready-made screens, but user data is stored in the US and costs grow with users. |
| AI | Claude through AI SDK | **Vercel AI Gateway:** an extra service, and the app isn't hosted on Vercel. **OpenAI:** no existing account. |
| Hosting | Vercel | **Cloudways Velocity** was the first choice; the owner switched to Vercel on 2026-11-14 once the app, database and keys were already wired there and headless Chromium was verified on it. |
| PDF | Server-side Chromium print of the preview HTML | **A separate PDF layout (react-pdf):** the preview and PDF would drift apart. **Client-side print:** output varies by browser. |
| Analytics | Plausible | **PostHog:** needs a consent banner in the EU. **None:** no view of where users drop off. |
| Refunds | 14 days, every plan | **No refunds:** Paddle doesn't allow it. **Monthly with no refunds:** more complex, and EU withdrawal rules still apply. |

---

## 9. Every ASSUMPTION

1. The business selling the product is Israeli.
2. Pro and Lifetime have a fair-use limit of 100 AI actions per day.
3. Free's 3 PDF downloads are a lifetime total, not monthly.
4. The free limit of 5 AI actions per day is a placeholder until the cost per call is measured from `ai_call_log`.
5. No admin panel. The owner uses the Paddle dashboard and the Neon console.
6. Running costs stay under about $100/month before revenue, with a hard Claude spending limit.
7. "OK" on the merchant of record meant an Israeli business plus Paddle.

## 10. Open risks and unknowns

1. **Paddle paying out to Israel is unconfirmed.** Confirm it with Paddle before building billing. If Paddle says no, switch to Polar, which officially supports Israel.
2. **Product name and domain aren't chosen.** Paddle won't approve the account until the site is live on its domain, so this is on the critical path.
3. ~~Headless Chromium on the host is unverified.~~ **Resolved 2026-11-14:** verified on Vercel (see the PDF call in section 5).
4. **Paddle approval time.** Submit the site and the legal pages early.
5. **PDF import quality** varies between source PDFs. Show the result for review rather than trusting it silently.
6. **Visual design isn't decided** (see below).

## 11. Builder details settled after review (all Calls)

1. **AI models and cost.**
   - Model IDs: `claude-haiku-5-5` for keywords, rewrites, bullets and the summary; `claude-sonnet-5-5` for PDF import.
   - **Imports have their own daily limit**, because they cost much more than other actions: Free 2 per day, Pro and Lifetime 20 per day. The 5 and 100 daily limits cover every other AI action.
   - Before launch, measure the real cost per action from `ai_call_log` and adjust the limits so that one heavy Pro user costs well under $19 a month. This also protects Lifetime, which pays once and has no end date.
2. **When a download counts.**
   - It counts only **after the PDF is generated successfully**, so a failed attempt costs nothing.
   - Downloading again with **unchanged content** (same content hash) doesn't count again.
   - The counter increases atomically and is checked inside the same database transaction.
3. **Downloads after a downgrade.** Only downloads made **while on Free** count toward the 3. A user who leaves Pro, for example after a refund, gets 3 Free downloads, not zero.
4. **Tailoring on Free.**
   - The job description **is saved with the resume**. Pasting a new one replaces it.
   - The extracted keywords are **cached by a hash of the job description**, so re-opening the screen doesn't spend another AI action.
   - Extracting keywords counts as one AI action.
5. **Lifetime billing.**
   - Lifetime is a one-time Paddle transaction, stored with `plan = lifetime` and no period end.
   - If a monthly subscriber buys Lifetime, the monthly subscription is set to **cancel at the end of the current period**. There's no proration, and no further charges.
   - A refund event looks up the purchase by its Paddle transaction or subscription ID.
   - Store each purchase as its own row, so that refund-then-repurchase works.
6. **Hosting spike: done on Vercel (2026-11-14).** Headless Chromium printing works (see section 5); the default function timeout is 300 s.
   - If long requests time out, PDF import runs as a background job that the browser polls.
   - If Chromium fails, pick a hosted HTML-to-PDF service with an EU region and a DPA.
7. **Autosave.**
   - Saves happen shortly after typing stops (debounced). Failed saves retry automatically, and a copy of unsaved changes is kept in the browser so work survives a reload.
   - The status shows "Saving…", "Saved" or "Not saved — retrying".
   - **Two tabs editing the same resume:** each save is checked against `updatedAt`. If the resume was changed in another tab, the user is told and nothing is silently overwritten.
   - View-only resumes are blocked on the server, so their `updatedAt` never changes, and the "most recently edited" rule stays stable. Ties are broken by id.
8. **Abuse.**
   - **Cloudflare Turnstile** checks the magic-link signup form. Turnstile works without Cloudflare in front of the site.
   - Disposable email domains are blocked.
   - New signups are limited per IP address. Google sign-in needs no extra check.
9. **Data kept after account deletion.**
   - Deleted: `usage`, `download_count`, resumes and the auth rows.
   - `ai_call_log` rows have their user ID removed and are kept for cost analysis.
   - `paddle_event` rows are kept. They contain only Paddle IDs, and Paddle holds the tax records as the merchant of record.

## 12. Still to decide

- **Look and feel:** brand direction, type, color, and the editor and landing page designs. This is the next conversation, with mockups.
- **Score details:** the exact checks, their weights and the high or medium impact grouping. This is left to the builder, starting from the list in PLAN.md and the top list there.
