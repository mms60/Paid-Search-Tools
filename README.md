# AEOGEO Search — Paid AI Crawler & Schema Studio

This is an additive, standalone Netlify application package for a paid subscriber tool. It does **not** replace your existing website or free robots.txt checker.

## What is included

- Paid subscriber gate using Supabase Auth + Stripe subscription status.
- Stripe Checkout using your existing monthly/annual Price IDs.
- Stripe subscription webhook to sync active/trialing/cancelled status.
- Netlify background crawler audit: robots.txt rules, representative user-agent HTTP probes, sitemap discovery, HTTP status, HTML text availability, noindex directives, page title and JSON-LD presence. Groq can summarize crawler findings.
- Schema audit and AI-assisted JSON-LD generation through Groq.
- Supabase scan history, findings, generated schema storage and Row Level Security.
- A basic responsive dashboard.

## Important implementation boundaries

1. This package is a new standalone application. Do not overwrite your current production site's `index.html` or existing functions.
2. Deploy this as a separate Netlify site or add the files into a separate folder/path and merge only after reviewing your current repository.
3. The browser uses only the Supabase anon/publishable key. Supabase service-role and Groq/Stripe secrets stay in Netlify environment variables.
4. The crawler uses representative user-agent strings. A user-agent simulation does not prove that a real AI crawler's IP range can pass your CDN/WAF. For definitive confirmation, compare provider IP ranges and server/CDN logs.
5. Schema output is a draft. The tool performs lightweight JSON-LD parsing/type checks; it is not a full Schema.org validator or a guarantee of Google rich-result eligibility.
6. `Google-Extended` is not tested as an HTTP crawler user agent. It is a robots.txt control token. This MVP tests actual fetch user agents only.
7. The current subscription gate checks for an active/trialing Stripe subscription synced by the webhook. It does not yet enforce plan-specific scan quotas or metered credits.
8. The crawler is deliberately read-only. It does not install schema on customer websites or edit robots.txt.
9. Before production use, have the security review harden outbound fetch networking against DNS rebinding and add rate limiting, concurrency controls, abuse monitoring and per-plan quotas. URL validation and redirect revalidation are included, but application-level DNS checks alone are not a complete network egress firewall.

## 1. Create / prepare Supabase

1. Open your Supabase project.
2. Go to SQL Editor.
3. Run `supabase/migrations/001_paid_ai_tools.sql`.
4. In Authentication > URL Configuration, set the Site URL to your deployed app URL and add that URL to Redirect URLs.
5. Enable email OTP/magic-link authentication.
6. Confirm the email template's link redirects to your app.

The migration creates dedicated tables and does not alter your existing robots.txt tool tables. If your project already has tables named `profiles` or `subscriptions` with different columns, inspect and reconcile those before applying the migration.

## 2. Configure Netlify environment variables

Add the variables from `.env.example` in Site configuration > Environment variables.

- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_ANON_KEY`: public anon/publishable key.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only service role key.
- `GROQ_API_KEY`: server-only Groq API key.
- `GROQ_MODEL`: model available to your Groq account.
- `STRIPE_SECRET_KEY`: Stripe secret key.
- `STRIPE_WEBHOOK_SECRET`: signing secret for the webhook endpoint.
- Six Stripe Price IDs: your existing Starter/Pro/Agency monthly and annual price IDs.
- `SITE_URL`: full deployed app URL, e.g. `https://your-tool.netlify.app`.
- `URL`: Netlify's canonical site URL; set it explicitly if needed by the background function.

Never place secret keys in `public/config.js`, HTML, browser JavaScript, GitHub, or a public issue.

## 3. Configure the public Supabase browser settings

Edit `public/config.js` and set:
- `window.SUPABASE_URL`
- `window.SUPABASE_ANON_KEY`

These are public browser settings. Never use the service-role key here.

## 4. Configure Stripe

1. Keep your existing products and prices. This code references existing Price IDs; it does not create or modify prices.
2. In Stripe Dashboard > Developers > Webhooks, add:
   `https://YOUR-DEPLOYED-APP/.netlify/functions/stripe-webhook`
3. Subscribe to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.
5. Add all six existing Price IDs to the matching Netlify variables.
6. Test with Stripe test mode first. Use test keys and test Price IDs together; use live keys and live Price IDs together.

## 5. Install and deploy

```bash
npm install
npm run dev
```

For deployment:
1. Push this package to a new GitHub repository or a dedicated feature branch.
2. In Netlify, import the repository.
3. Build command: leave blank (static app).
4. Publish directory: `public`.
5. Functions directory: `netlify/functions` (configured in `netlify.toml`).
6. Add environment variables.
7. Deploy to a Netlify preview/site URL first.
8. Test auth, checkout, webhook and scans before attaching a production domain.

## 6. Test checklist

- [ ] Sign-in email arrives and returns to the app.
- [ ] Signed-out user cannot call paid endpoints.
- [ ] User without an active Stripe subscription sees the paywall.
- [ ] Test checkout completes.
- [ ] Stripe webhook creates/updates the `subscriptions` row.
- [ ] Active subscriber can queue a crawler scan.
- [ ] Scan history shows the scan.
- [ ] Schema audit reads existing JSON-LD.
- [ ] Schema generation returns valid JSON and stores it.
- [ ] One user cannot read another user's scan or schema records.
- [ ] Groq key and Supabase service-role key are not present in browser source/maps.

## 7. Known next production upgrades

- Add strict plan-specific scan allowances and add-on credit accounting.
- Add agency organizations, seats and multi-domain permissions.
- Add a complete Schema.org validator and Google Rich Results eligibility checks where applicable.
- Add schema types and field templates tailored to page context; FAQPage/Product/LocalBusiness must only be used when the page/business qualifies and supplied facts support the properties.
- Add customer-approved schema export/install paths (CMS plugin, copy/paste, or GitHub PR).
- Add recurring monitoring and before/after comparisons.
- Add crawler registry versioning and provider IP/log verification.
- Add an egress proxy/firewall, rate limiting and crawl budget enforcement.

## API endpoints

All endpoints are Netlify Functions:
- `subscription-status`
- `stripe-checkout`
- `stripe-webhook`
- `stripe-portal`
- `start-scan`
- `scan-background` (background function)
- `scan-status`
- `scan-history`
- `schema-generate`

All user endpoints except the Stripe webhook require a Supabase bearer access token. Paid endpoints check the subscription table.
