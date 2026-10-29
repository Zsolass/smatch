# Smatch Labsite demo

A demo website for a fictional dental lab, **Smatch Demo Lab**, at
**https://labsites.smatch.cloud**. Lab owners can look around it, try the case
submission flow their dentists would use, and request a quote for their own
website through the **Inquire** form.

- **Lab website**: hero, services with detail panels, sample cases with a
  lightbox, digital workflow, lab & technology, benefits, FAQ, contact.
- **Case submission demo** (`/submit-case`): four steps with a live summary,
  an SVG tooth chart (FDI numbering, bridges with abutment/pontic roles, whole
  arches), drag-and-drop files and an example case. **Nothing leaves the
  browser.**
- **Inquire** (`/#inquire`): the real part. The form posts to
  `POST /api/inquiries`, which stores the inquiry in Cloudflare D1 and emails
  the Smatch team.

## Stack

| Part | Where |
| --- | --- |
| Next.js 16 (static export), React 19, TypeScript, Tailwind 4 | `src/` |
| Cloudflare Worker: serves `out/` and handles `/api/*` | `worker/` |
| D1 (inquiries), Workers rate limiting, cron trigger | `wrangler.jsonc` |
| Unit tests (Vitest) and end-to-end tests (Playwright) | `tests/` |
| Image, sharing image and sample file generators | `scripts/` |

## Run locally

```bash
npm install
npm run dev        # UI only, http://localhost:3000 (the Inquire form reports that the API is missing)
npm run preview    # full site: next build + Worker + local D1, http://localhost:8787
```

For email notifications in `npm run preview`, copy `.dev.vars.example` to
`.dev.vars` and fill it in.

Checks:

```bash
npm run check      # lint, typecheck, unit tests, production build
npm run test:e2e   # Playwright against `wrangler dev`, with a mock email API
```

## Deploying to labsites.smatch.cloud

Cloudflare Workers Builds deploys the GitHub repo (Worker project `labsites`):

- Pushes to `main` run `npx wrangler deploy`. Wrangler runs `npm run build`
  first (configured in `wrangler.jsonc`), uploads `out/` and the Worker, and
  attaches the custom domain from `routes`.
- Other branches get a preview URL (`npx wrangler preview`, which needs the
  `previews` block in `wrangler.jsonc`). Previews have no inquiry database,
  so their Inquire form reports that it isn't set up.
- The first deploy creates the D1 database `labsite-inquiries`
  automatically. The `inquiries` table is created on first use.

The `smatch.cloud` zone must be active in the same Cloudflare account for the
custom domain to attach.

### Email settings

Notifications go to `office@smatch.cloud` (Google Workspace) and are sent
from `Smatch Labsite <labsite@smatch.cloud>` through
[Resend](https://resend.com). Both addresses are `vars` in `wrangler.jsonc`.
The sender needs no mailbox: replies go to the lab that sent the inquiry.

Resend authenticates `smatch.cloud` with DNS records on subdomains
(`resend._domainkey`, `send`), so Google Workspace mail keeps working
unchanged.

Set these under **Workers & Pages → labsites → Settings → Variables and
Secrets** with type **Secret**:

| Name | Required | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | for email | Resend API key with sending access for `smatch.cloud` |
| `ADMIN_TOKEN` | to read inquiries | Long random string for the admin endpoints (`openssl rand -hex 32`) |
| `RESEND_API_URL` | no | Alternative API base URL (default `https://api.resend.com`) |

Don't add `INQUIRY_NOTIFY_TO` or `INQUIRY_NOTIFY_FROM` in the dashboard.
They come from `wrangler.jsonc`, and each deploy replaces dashboard values.

`GET /api/health` shows whether storage and notifications are configured.

## Inquiries

- **Validation**: `src/lib/inquiry/schema.ts`, used by both the form and the
  Worker. Phone numbers are checked and stored in E.164 format; a US lab must
  choose a state.
- **Spam and abuse**: a hidden honeypot field, a minimum fill time of 2.5 s,
  5 requests per minute per IP (Workers rate limiting), 5 inquiries per email
  per day, and a 16 KB body limit.
- **Duplicates**: every form fill sends an idempotency key, so a retried
  request returns the stored inquiry. The same email and lab within 10 minutes
  also counts as one inquiry.
- **Storage**: D1 table `inquiries` (`worker/db.ts`): all form fields,
  `created_at`, `source` (the site domain) and the notification status.
- **Notification**: once the inquiry is stored, the response confirms
  success. The email (subject `Website inquiry: <lab> (<city, country>)`,
  Reply-To set to the contact's email) is sent in the background:
  - 3 attempts right away, then every 15 minutes by the cron trigger, up to
    12 attempts in total;
  - Resend's idempotency key makes sure a retry never sends a second email;
  - if email isn't configured yet, inquiries are kept with status
    `not_configured` and sent once it is, and the problem is logged in
    Workers Logs.
- **When the endpoint isn't available** (no D1 binding, or a deployment
  without the Worker), the form says so and keeps what the visitor typed. It
  never shows a fake success.
- **Reading inquiries** needs `ADMIN_TOKEN`:

  ```bash
  curl -H "Authorization: Bearer $ADMIN_TOKEN" "https://labsites.smatch.cloud/api/inquiries?limit=50"
  ```

  - `&format=csv` exports a CSV.
  - `POST /api/inquiries/retry-notifications` retries pending emails right
    away.
  - You can also browse the table in the dashboard: D1 → `labsite-inquiries`.

## Personalising the demo for a lab

Content changes go in config and assets. Components don't need editing.

| What | File |
| --- | --- |
| Lab name, colours, contact details, navigation, hero, services, sample cases, workflow, about (team photos, equipment, commitments), benefits, FAQ, SEO | `src/config/lab.ts` |
| Work types, materials per type, shades, file formats and limits, file categories, example case files | `src/config/case-submission.ts` |
| Smatch framing: domain, demo bar, Inquire wording, privacy notice details | `src/config/site.ts` |
| Logo and favicon | `public/lab/logo-mark.svg`, `src/app/icon.svg` |
| Images (`<name>-<width>.webp`, widths listed in `lab.ts`) | `public/images/` |
| Sharing image and Apple touch icon | `public/og-image.png`, `public/apple-touch-icon.png` (`npm run render:og`) |
| Example case attachments | `public/demo-files/` (`npm run render:demo-files`) |

The current images are our own procedural 3D renders (`scripts/render`,
`npm run render:images`). To use a lab's photography, replace the WebP files
under the same names, or point `lab.ts` to new ones.

## Connecting a real case submission API

The wizard talks to a `CaseSubmissionAdapter`
(`src/lib/case-submission/adapter.ts`). The built-in `demoAdapter` only creates
a `DEMO-XXXXXX` reference locally.

A production adapter would upload `draft.files` and send the work order
(`CaseDraft` in `src/lib/case-submission/model.ts`). You then pass it in
`src/app/submit-case/page.tsx`:

```tsx
<CaseSubmission adapter={labApiAdapter} />
```

The validation and summary functions in `model.ts` are plain TypeScript, so a
backend can reuse them.

## Tests

- **Unit tests** (`tests/unit`, `tests/worker`):
  - FDI numbering and the patient's sides
  - adjacency, including 11–21 and 41–31
  - bridge rules and span labels
  - work-type switching and undo
  - arch selection
  - file checks and suggested categories
  - Inquire validation
  - notification email content and escaping
  - Worker failure paths (no storage, storage error, spam checks, origin and
    size limits, admin auth)
- **End-to-end tests** (`tests/e2e`), run against `wrangler dev`, a local D1
  and a mock email API (test data and test recipient only):
  - **Inquire**:
    - opened from the header, hero, closing section and `/#inquire`, on
      desktop and mobile
    - field errors
    - US state rule, plus a non-US inquiry
    - the stored record and the email content
    - duplicate protection
    - save errors and an unconfigured endpoint
    - an email outage followed by a cron-style retry
  - **Case submission**:
    - an empty-form walkthrough with validation, mouse and keyboard tooth
      selection, file picker and drag-and-drop, duplicates and invalid files
    - edit from the review, then submit and reset
    - the example case (13–15 bridge)
    - a bridge across the midline, multiple bridges, role changes and
      removals
    - work-type change with undo, and the full-arch summary
    - reload starts clean
    - mobile chart zoom
    - no requests carry case data
  - **Site**:
    - every page at 375, 768, 1440 and 1920 px: no console errors, no broken
      images, no sideways scrolling (screenshots go to
      `test-results/screenshots/`)
    - noindex
    - sharing metadata
    - gallery lightbox
    - mobile menu
    - 404 page

## Known limitations

- Only FDI numbering. Universal numbering, STL preview, multiple languages
  and live branding previews are later extensions.
- The images are illustrative renders, not photographs of real work.
