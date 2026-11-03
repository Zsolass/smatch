# Labsites offer email

`labsites-offer.html` is a complete HTML email for GoHighLevel. It points lab
owners to the demo at https://labsites.smatch.cloud and to its Inquire form
(`/#inquire`), and offers a personalised website for a one-time $999.

## Subject line

Pick one; the first is the recommended default.

1. What your lab's website could look like (live demo)
2. Give dentists a reason to send you the next case
3. A new website for your dental lab: one-time $999

**Preview text** (already hidden at the top of the HTML, repeat it if
GoHighLevel has its own field for it):

> Click through a live demo dental lab website with online case submission. Yours, personalised, for a one-time $999.

## Pasting into GoHighLevel

- Create the email with GoHighLevel's option for pasting your own HTML code,
  not the drag-and-drop builder, and paste the whole file.
- `{{contact.first_name}}` fills in the greeting. If many contacts have no
  first name, change `Hi {{contact.first_name}},` to `Hello,`.
- `{{unsubscribe_link}}` in the footer must be GoHighLevel's unsubscribe
  merge tag. Check it against GoHighLevel's merge-field list; if GoHighLevel
  adds its own unsubscribe footer, delete that line instead.
- Send a test to yourself (Gmail, Outlook and a phone) before scheduling.

## Images

The two images are served from the site, so they load in every inbox:

- https://labsites.smatch.cloud/email/labsites-hero.jpg
- https://labsites.smatch.cloud/email/case-chart.jpg

They are screenshots of the demo. After changing the site's design, rebuild
them with the site running locally (`npm run preview`):

```bash
node scripts/email-images.mjs
```
