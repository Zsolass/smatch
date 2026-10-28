# LabSites

Marketing website for LabSites, a service that builds websites for dental labs.
Live at **https://labsites.smatch.cloud**.

The site is a static Cloudflare Worker: everything in `public/` is served as-is,
and `wrangler.jsonc` attaches the `labsites.smatch.cloud` custom domain on deploy.

## Local development

```bash
npm install
npm run dev        # http://localhost:8787
```

## Deployment

Cloudflare Workers Builds deploys from this GitHub repo:

- Pushes to the production branch run `npx wrangler deploy` and go live on
  `labsites.smatch.cloud`.
- Pushes to any other branch run `npx wrangler versions upload` and get a
  preview URL, without touching production.

### One-time Cloudflare setup

1. **Zone**: `smatch.cloud` must be an active zone in the Cloudflare account
   (Dashboard → Add a domain, then point the registrar's nameservers at Cloudflare).
   Make sure no DNS record already exists for `labsites`; the deploy creates it.
2. **Connect the repo**: Workers & Pages → Create application → Import a
   repository → GitHub → `Zsolass/smatch`.
   - Project name: `labsites` (must match `name` in `wrangler.jsonc`)
   - Build command: leave empty
   - Deploy command: `npx wrangler deploy`
   - Non-production branch deploy command: `npx wrangler versions upload`
3. **Production branch**: Worker → Settings → Build → Branch control → `main`.

The first production deploy creates the `labsites.smatch.cloud` DNS record and
certificate automatically.
