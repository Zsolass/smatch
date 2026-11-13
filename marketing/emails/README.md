# Offer emails

Two complete HTML emails for GoHighLevel, one per demo site. Both are pasted and
sent the same way; see [Pasting into GoHighLevel](#pasting-into-gohighlevel).

- [Labsites](#labsites-offer-email): `labsites-offer.html`, for dental labs
- [Dentsites](#dentsites-offer-email): `dentsites-offer.html`, for dentists and dental clinics

## Labsites offer email

`labsites-offer.html` is a complete HTML email for GoHighLevel. It points lab
owners to the demo at https://labsites.smatch.cloud and to its Inquire form
(`/#inquire`), and offers a personalised website for a one-time $999.

### Subject line

Pick one; the first is the recommended default.

1. What your lab's website could look like (live demo)
2. Launch price for 5 dental labs: your new website for $999
3. Give dentists a reason to send you the next case

**Preview text** (already hidden at the top of the HTML, repeat it if
GoHighLevel has its own field for it):

> Click through a live demo dental lab website with online case submission. Yours, personalised, for a one-time $999, for our first 5 customers only.

## Pasting into GoHighLevel

- Create the email with GoHighLevel's option for pasting your own HTML code,
  not the drag-and-drop builder, and paste the whole file.
- `{{contact.first_name}}` fills in the greeting. If many contacts have no
  first name, change `Hi {{contact.first_name}},` to `Hello,`.
- The footer's Unsubscribe link uses GoHighLevel's merge tag
  `{{email.unsubscribe_link}}`, inside the link's `href`. Test it with an
  address you don't need: clicking it unsubscribes that contact.
- Send a test to yourself (Gmail, Outlook and a phone) before scheduling.
- The offer is limited to the first 5 customers, and the email can't count
  them. Stop or change the campaign once the fifth lab has signed.

### Images

The two images are served from the site, so they load in every inbox:

- https://labsites.smatch.cloud/email/labsites-hero.jpg
- https://labsites.smatch.cloud/email/case-chart.jpg

They are screenshots of the demo. After changing the site's design, rebuild
them with the site running locally (`npm run preview`):

```bash
node scripts/email-images.mjs
```

## Dentsites offer email

`dentsites-offer.html` is the same kind of email for dentists and dental
clinics. It stands in for a landing page: it points to the demo at
https://dentsites.smatch.cloud, shows what a clinic gets, and offers a
personalised website for a one-time $999 to the first 5 customers, after which
the price goes up. Its buttons lead to the demo and to the Inquire form at
`/get-this-website`.

### Subject line

Pick one; the first is the recommended default.

1. What your clinic's website could look like (live demo)
2. Would a new patient book from your website?
3. Launch price for 5 clinics: your new website for $999
4. {{contact.first_name}}, we built a dental clinic website. Yours could be next.

**Preview text** (already hidden at the top of the HTML, repeat it if
GoHighLevel has its own field for it):

> Tap through a live demo clinic website: treatments, results, fees and booking. Yours, personalised, for a one-time $999. First 5 clinics only.

### Before you send

- Paste and test it exactly as described under
  [Pasting into GoHighLevel](#pasting-into-gohighlevel): the merge tags, the
  Unsubscribe link and the test send work the same way.
- The email states only what was agreed: a personalised website comparable to
  the demo, $999 one-time, first 5 customers, a higher price afterwards. It says
  nothing about hosting, a domain, ongoing costs or delivery time. Add a line if
  you want to make a promise on any of those; clinics are likely to ask.
- The offer is limited to the first 5 customers, and the email can't count
  them. Stop or change the campaign once the fifth clinic has signed.
- "Just reply to this email" assumes replies to the sending address are read.

### Images

The four images are served from the demo site, so they load in every inbox:

- https://dentsites.smatch.cloud/email/dentsites-hero.jpg
- https://dentsites.smatch.cloud/email/before-after.jpg
- https://dentsites.smatch.cloud/email/treatment-options.jpg
- https://dentsites.smatch.cloud/email/booking-phone.jpg

They only exist online once the change that adds them has been merged and
deployed, so open one of the links in a browser before the first send.

They are screenshots of the demo. After changing the site's design, rebuild
them with the site running locally (`npm run preview` in `dentsites/`):

```bash
cd dentsites && npm run render:email
```
