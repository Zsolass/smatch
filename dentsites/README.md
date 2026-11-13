# Smatch Dentsite demo

A demo website for a fictional dental clinic, **Smatch Demo Dental**, for
**https://dentsites.smatch.cloud**. It is the dentist/clinic counterpart of the
labsite in the repository root, and a separate project: its own dependencies,
its own Worker, its own deploy.

Two audiences use it, and their routes are kept apart:

- **Patients** explore the clinic, read a treatment page and try the
  consultation request. On the demo the request form is simulated: **nothing a
  visitor types leaves the browser.**
- **Clinic owners** follow the demo banner (or the footer link) to
  `/get-this-website` and send the **Inquire** form. That part is real: it
  posts to `POST /api/inquiries`, which stores the inquiry in Cloudflare D1 and
  emails the Smatch team.

## What is in it

| Page | Contents |
| --- | --- |
| `/` | Practical-information bar and header, hero, approach and "your dentist", treatments by patient need, before/after results and patient stories, team, first visit, costs and financing, clinic and technology, FAQ, contact with the consultation form |
| `/treatments/<id>` | One template for every treatment: introduction and booking, common concerns, "in short" explanation, options with when each is chosen, side-by-side comparison, how suitability is assessed, a relevant case, the stages, fees (staged where treatment is staged), the clinician, questions, and the form with the treatment preselected |
| `/treatments` | All treatments the clinic offers |
| `/book` | The consultation request; `/book?treatment=<id>` preselects a treatment |
| `/get-this-website` | The clinic-owner page with the Inquire form (demo only) |
| `/privacy` | What happens to details entered in each form |

## Stack

Same as the labsite, so the two are maintained the same way.

| Part | Where |
| --- | --- |
| Next.js 16 (static export), React 19, TypeScript, Tailwind 4 | `src/` |
| Cloudflare Worker: serves `out/` and handles `/api/*` | `worker/` |
| D1 (inquiries; consultation requests on a live site), rate limiting, cron | `wrangler.jsonc` |
| Unit tests (Vitest) and end-to-end tests (Playwright) | `tests/` |
| Image and sharing-image generators | `scripts/` |

## Run locally

Run everything from this folder (`dentsites/`).

```bash
npm install
```

```bash
npm run dev
```

UI only, on http://localhost:3000 (the Inquire form reports that the API is missing).

```bash
npm run preview
```

The full site: `next build`, the Worker and a local D1, on http://localhost:8787.
For email notifications there, copy `.dev.vars.example` to `.dev.vars` and fill it in.

Checks:

```bash
npm run check
```

Lint, typecheck, unit tests and the production build.

```bash
npm run test:e2e
```

Playwright against `wrangler dev`, with a mock email API. In a container whose
Playwright traces are costly, add `-- --trace off`.

## Deploying to dentsites.smatch.cloud

The clinic demo is a **second Worker** built from the same GitHub repository.
The labsite's Worker and its deploys are not affected.

1. In the Cloudflare dashboard open **Workers & Pages → Create → Import a
   repository** and choose this repository.
2. Name the project **`dentsites`** (it must match `name` in `wrangler.jsonc`).
3. In the build settings set the **root directory** to **`dentsites`**. Use the
   same commands as the `labsites` project: deploy command
   `npx wrangler deploy`, and `npx wrangler preview` for other branches.
   Wrangler runs `npm run build` itself (see `wrangler.jsonc`).
4. Deploy. The first deploy to `main`:
   - attaches **dentsites.smatch.cloud** from `routes` (Cloudflare creates the
     DNS record and the certificate; the `smatch.cloud` zone must be active in
     the same account, as it is for labsites, so the domain does not need to be
     added by hand);
   - creates the D1 database `dentsite-inquiries`. Tables are created on first use.
5. Add the secrets below and deploy again.

Optional, to avoid rebuilding one site when only the other changed: under each
project's **build watch paths**, include `dentsites/*` for `dentsites` and
exclude `dentsites/*` for `labsites`.

Branch previews have no database, so the Inquire form on a preview says that it
isn't set up.

### Email settings

Website inquiries go to `office@smatch.cloud` and are sent from
`Smatch Dentsite <dentsite@notify.smatch.cloud>` through
[Resend](https://resend.com), using the `notify.smatch.cloud` sending domain
that labsites already verified. Both addresses are `vars` in `wrangler.jsonc`.

Set these under **Workers & Pages → dentsites → Settings → Runtime variables
and secrets** with type **Secret**, then click **Deploy** (not under
**Settings → Build**, whose values only exist during the build):

| Name | Required | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | for email | Resend API key with sending access for `notify.smatch.cloud` (the labsites key works) |
| `ADMIN_TOKEN` | to read inquiries | Long random string for the admin endpoints (`openssl rand -hex 32`) |
| `RESEND_API_URL` | no | Alternative API base URL (default `https://api.resend.com`) |

`GET /api/health` shows what is configured.

## The two forms

### Inquire (clinic owners → Smatch)

Works like the labsite's Inquire form, with "Clinic name" in place of the lab's.

- **Validation**: `src/lib/inquiry/schema.ts`, shared by the form and the Worker.
- **Spam and abuse**: a hidden honeypot field, a minimum fill time of 2.5 s,
  5 requests per minute per IP, 5 inquiries per email per day, a 16 KB limit.
- **Duplicates**: every form fill sends an idempotency key; the same email and
  clinic within 10 minutes also counts as one inquiry.
- **Storage**: D1 table `inquiries`, with `source` set to the site's domain.
- **Notification**: sent in the background, 3 attempts right away and then every
  15 minutes by the cron trigger, up to 12 in total. Resend's idempotency key
  prevents a second email. If email isn't configured yet, inquiries are kept and
  sent once it is.
- **Reading inquiries** needs `ADMIN_TOKEN`:

  ```bash
  curl -H "Authorization: Bearer $ADMIN_TOKEN" "https://dentsites.smatch.cloud/api/inquiries?limit=50"
  ```

  Add `&format=csv` for a CSV. `POST /api/retry-notifications` resends pending emails now.

### Consultation request (patients → the clinic)

`booking.mode` in `src/config/site.ts` decides what "Book a consultation" does:

| Mode | What happens | Confirmation shown |
| --- | --- | --- |
| `demo` (this site) | The form is checked in the browser and simulated. Nothing is sent. | "Request received (demo)… nothing was sent, and no appointment has been booked." |
| `request` | The form posts to `POST /api/consultation-requests`. The Worker validates it again, stores it in D1 and emails the clinic. | Shown only after the Worker confirms: the clinic has the request and will make contact. It never says an appointment is booked. |
| `link` | Every booking button opens `booking.bookingUrl`, the clinic's own booking system, which confirms appointments itself. | The booking system's own. |

The form asks for a full name and a phone number with country code (required),
and optionally an email address, a treatment interest, a preferred way of being
contacted and a short message. A clinic location is asked for, and required,
only when `clinic.locations` has more than one entry.

**To configure live booking** for a real clinic:

- *Requests by email*: set `booking.mode` to `"request"`, and in `wrangler.jsonc`
  set `CONSULTATION_REQUESTS` to `"on"` and `CONSULTATION_NOTIFY_TO` to the
  clinic's inbox. Requests are stored in the D1 table `consultation_requests`
  and can be listed with `GET /api/consultation-requests` and the admin token.
- *An online booking system*: set `booking.mode` to `"link"` and
  `booking.bookingUrl` to its address.

The endpoint refuses requests unless `CONSULTATION_REQUESTS` is `"on"`, so the
demo cannot collect patient details even if someone posts to it directly.

To try the live form locally:

```bash
NEXT_PUBLIC_BOOKING_MODE=request npx wrangler dev --var CONSULTATION_REQUESTS:on --var CONSULTATION_NOTIFY_TO:you@example.com
```

## Personalising the demo for a clinic

Content changes go in configuration and assets. Components don't need editing,
and a section with no content is not rendered.

| What | File |
| --- | --- |
| Clinic name, colours, locations (address, phone, hours, parking, directions), navigation, hero, approach and lead dentist, results, patient stories and videos, team, first visit, fees and financing, technology, in-house lab, FAQ, SEO | `src/config/clinic.ts` |
| Treatments: which are offered (`enabled`), the patient-need card, explanation, options, comparison, suitability, stages, fees, clinicians, questions | `src/config/treatments.ts` |
| Booking mode, demo/production switches, analytics, Smatch inquiry wording, privacy details | `src/config/site.ts` |
| Fonts | `src/app/layout.tsx` (two `localFont` declarations) |
| Logo and favicon | `public/clinic/logo-mark.svg`, `src/app/icon.svg` |
| Images (`<name>-<width>.webp`, widths listed in the config) | `public/images/` |
| Team portraits | set `photo` on each team member |
| Sharing image and Apple touch icon | `npm run render:og` |
| Images for the offer email (`marketing/emails/dentsites-offer.html`) | `public/email/`, rebuilt with `npm run render:email` while `npm run preview` is running |

Disabling a treatment removes its page, its need card, its form option, its
fees and its cases. Unit tests (`tests/unit/config.test.ts`) fail when an id in
the configuration points at something that doesn't exist.

### Going live for a real clinic

1. Replace the sample content, and have the clinic review every clinical
   statement. Once a clinician has reviewed a treatment page, set its
   `reviewedBy`; the page then shows who reviewed it and when.
2. In `src/config/site.ts` set `demo: false` (hides the Smatch banner, the owner
   page and all "Sample" labels), set the domain, and choose the booking mode.
3. Indexing is a deliberate choice: set `noindex: false` **and** remove the
   `X-Robots-Tag` line from `public/_headers`. A unit test keeps the two in step.
4. With verified business details, `structuredData: true` adds schema.org
   `Dentist` data.
5. For analytics, set `analytics.enabled` and load your tag manager. Booking
   clicks, calls and completed requests are pushed to `window.dataLayer` with
   only a placement and a treatment id: never a name, phone number, email
   address or message.

## Images

The images are our own illustrative 3D renders, labelled as illustrations on the
site: a two-jaw "smile", before/after pairs that share one camera so only the
teeth differ, and still lifes for the treatment pages.

```bash
npm run render:images
```

The scenes are in `scripts/render/shots.js`. They reuse the labsite's tooth,
arch and implant models from `../scripts/render`, so run this from a full
checkout of the repository. It needs Playwright's Chromium, and Python with
Pillow and NumPy. To use a clinic's photography, replace the WebP files under
the same names or point the configuration at new ones.

## How the reference sites shaped it

The three references in the brief were studied on desktop and mobile. Nothing
was copied: the design, copy and assets here are our own.

- **Limitless Dental → the patient journey.** Practical information above the
  header, booking and calling within reach on every screen (a bottom bar on
  phones), "what brings you in" entries, a "your dentist" card beside the
  review score, before/after cases with treatment labels, and a closing section
  with hours, parking and contact actions.
- **Full Arch Clinic → explaining treatment.** An "in short" definition, option
  cards that say when each option is chosen, a comparison table, fees split by
  stage with what each stage includes and what happens between them, the
  consultation fee and its inclusions next to the booking prompt, the clinician
  responsible, and questions asked before a first visit.
- **Aventura Dental Arts → visual direction.** A large, light serif with italic
  accent words, small uppercase labels, numbered rows, pill buttons, generous
  spacing, and light sections alternating with deep ones. The arch shape of the
  images is our own motif.

## Tests

- **Unit tests** (`tests/unit`, `tests/worker`): consultation and inquiry
  validation; the demo and live form adapters (success only on the server's
  acknowledgement); configuration integrity; staged fees adding up; the noindex
  setting matching `_headers`; Worker paths for both endpoints, including the
  consultation endpoint being closed on the demo; notification email content
  and escaping.
- **End-to-end tests** (`tests/e2e`), against `wrangler dev`, a local D1 and a
  mock email API:
  - every page at 375, 768 and 1440 px: no console errors, no broken images, no
    sideways scrolling, nothing left hidden by a reveal animation (screenshots
    go to `test-results/screenshots/`)
  - noindex, sharing metadata, a page and title per treatment, sample labels
  - before/after comparison by keyboard and by buttons
  - the treatments menu, the skip link, the mobile menu
  - the mobile call/book bar, its touch targets, and that it leaves the screen
    at the form
  - call links using the configured number; analytics events without personal data
  - reduced motion; 404 pages
  - consultation request: treatment preserved from need card to form; missing
    and invalid details; loading; a double click; the demo confirmation; no
    request carrying the details; a failed send keeping what was typed; a phone
    layout; the server refusing requests on the demo
  - Inquire: stored record and email content; field errors; the US state rule;
    a double click; an email outage followed by a retry; an unavailable endpoint

## Known limitations

- The images are illustrative renders, not photographs. A clinic's own
  photography of its people, rooms and cases is the largest remaining step
  towards a finished site, and portraits currently show initials.
- Team profiles, cases, reviews, the rating, fees and finance terms are sample
  content and are labelled as such.
- Clinical wording is general sample copy. It must be supplied or reviewed by
  the clinic before publication.
- No map is embedded, because the address is fictional. `directionsUrl` adds a
  directions link for a real one.
- One language (US English) and one currency per site.
