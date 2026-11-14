# AI Resume Builder: V1 Plan

A simpler version of [Rezi](https://www.rezi.ai/).

Rezi's paid product comes down to one loop: **build a resume → score it → tailor it to a job description → download it.** V1 builds that loop and nothing else.

> **Decisions from the v1 interview are in [the v1 design spec](docs/superpowers/specs/2026-11-14-ai-resume-builder-v1-design.md).** Where the two differ, the spec wins. For example, billing uses **Paddle**, not Stripe, because Stripe doesn't appear to accept businesses based in Israel.

---

## How Rezi charges (reference)

| Plan | Price | What's included |
|---|---|---|
| Free | $0 | 1 resume, 3 PDF downloads, AI writer and editor, limited score, limited keyword targeting, 1 AI interview |
| Pro | $29/mo | Unlimited resumes and downloads, full Rezi Score (23 checks), full keyword targeting, DOCX and Google Drive export, unlimited AI interviews, 1 human review a month |
| Lifetime | One payment | Everything (the price isn't shown on the page) |
| Enterprise | $99/mo per 200 users | Universities and agencies: SSO, team roles, webhooks, review management |

The AI writing tools are free. The paywall is on the score, keyword targeting, downloads and the number of resumes. So the writing is what gets people in, and tailoring to a job plus exporting is what they pay for.

---

## V1 core features

1. **Accounts and saved resumes.** Sign up, log in, and a dashboard to create, duplicate and delete resumes.
2. **Structured resume editor.** Sections for Contact, Summary, Experience, Projects, Education and Skills, with a live preview next to the form.
3. **One ATS-friendly template.** Single column with clean formatting, so applicant tracking systems (ATS) can read it.
4. **Import an existing PDF resume.** AI reads an uploaded PDF and fills in the editor fields.
5. **AI writer.** Write bullet points from a job title, rewrite a weak bullet, and generate a summary.
6. **Resume score.** A 0–100 score with a checklist of fixes, sorted high or medium impact. Start with about 8–10 checks:
   - Quantified bullets
   - Weak verbs
   - Filler words
   - Bullet length
   - Punctuation
   - Missing sections
   - Page length
   - Contact info

   Most can be plain code rules, which keeps AI costs down.
7. **Keyword targeting.** Paste a job description, the AI pulls out the keywords, and you see which ones match and which are missing. One click adds a missing keyword to a bullet or skill. This is the main reason people pay.
8. **PDF export.** The PDF has to contain real text, not an image, or ATS can't parse it.
9. **Stripe billing and free-tier limits.** Free users get 1 resume, 3 downloads, a capped number of AI runs, the overall score with only the top fixes, and a count of missing keywords with the list locked. Pro unlocks everything.
10. **AI usage limits per user.** Cap AI calls per user per day to control model costs.

---

## V1 top list (priority order)

The order is set by the core loop: build → score → tailor → download.

### Must have: the core loop

1. **Structured editor, live preview and ATS template** (features 2 and 3). One feature: the template is the preview. Everything else depends on it.
2. **PDF export with real text** (feature 8). Without it the user leaves with nothing. Render the PDF from the same template as the preview so the two always match.
3. **Keyword targeting** (feature 7). The main reason people pay. The one-click "add keyword to a bullet" uses the same AI rewrite call as the bullet rewriter, so it gets most of the AI writer built along the way.
4. **Resume score with rule-based checks** (feature 6). Plain code, not AI calls, so it costs almost nothing to run. Start with quantified bullets, weak verbs, filler words, bullet length, punctuation, and missing sections or contact info. Add page length last, since it needs the rendered PDF.
5. **Accounts and saved resumes** (feature 1). Needed so people can come back, and so "one resume per job" works by duplicating.

### Must have before charging anyone

6. **Stripe, free-tier limits and AI caps** (features 9 and 10). Build them together: both are a check of "can this user do X?" against a usage count. A free beta can launch without them; a paid product can't.

### Strong, but can come right after launch

7. **AI writer** (feature 5). Bullet rewriting mostly comes with keyword targeting. Generating bullets from a job title and writing a summary are one prompt each.
8. **PDF import** (feature 4). Makes signing up much easier, since most users already have a resume, but it's the most fragile feature because parsing quality varies a lot between PDFs. If time is short, ship it a week after launch.

### Build order

Editor and template → PDF export → accounts → score → keyword targeting with AI rewrite → limits and Stripe → AI writer → PDF import.

### Open questions to settle

- **Free summary writer has no cap.** The Free plan only caps bullet writing (5 AI uses per day). Count every AI call against the same daily limit: summaries, keyword extraction and import too.
- **"Tailor a separate resume for each job" is not its own feature.** It's duplicating a resume plus keyword targeting. Consider saving the pasted job description with each copy, so users can see which resume was made for which job.
- **Free plan's 1 resume conflicts with tailoring.** A free user can't duplicate, so they can only try keyword targeting on their one resume. Probably fine as an upgrade nudge, but decide it on purpose.

---

## Left out of v1 on purpose

- **Probably first after launch:**
  - AI cover letter (one prompt using the resume and job description)
  - DOCX export
  - A second template
- **Later:** AI mock interviews (voice and analytics are expensive and complex), human resume review, resignation letter builder, Google Drive export, LinkedIn import, example resume library, dark mode, education videos, MCP integration
- **Different business:** Enterprise and team features (SSO, roles, webhooks, domain restriction, commission program)

---

## Pricing

```
FREE — $0
- 1 resume
- Import your existing PDF resume
- AI bullet point writer and rewriter (5 AI uses per day)
- AI summary writer
- Resume score (overall score + top 3 fixes)
- Keyword targeting (see how many keywords you're missing)
- 3 PDF downloads
- ATS-friendly template

PRO MONTHLY — $19/month
- Unlimited resumes
- Import your existing PDF resume
- Unlimited AI bullet point writer and rewriter
- AI summary writer
- Full resume score with every fix and how to apply it
- Full keyword targeting: see every missing keyword and add it in one click
- Tailor a separate resume for each job
- Unlimited PDF downloads
- ATS-friendly template
- Cancel anytime

LIFETIME — $79 one-time
- Everything in Pro Monthly
- Pay once, use forever
- All future template and feature updates
```

### How the prices were set

- **$19/month** is below Rezi's $29. As a newer, simpler product, being cheaper is a clear reason to pick it.
- **$79 lifetime** is about four months of Pro. A typical job search lasts 2–4 months, so lifetime looks like the better deal to most buyers, and the money comes upfront.
- **Why a one-time option at all:** monthly subscribers cancel once they get hired, which is why Rezi also sells a lifetime plan.
- **5 AI uses per day** on the free plan is a placeholder. Set it once the cost per AI call is known.
