# Developer Portfolio + CMS

A dynamic personal portfolio for an application developer, with an admin dashboard that manages every section of the public site.

- **Public site** — hero, about, selected projects, trusted-by logos, testimonials, contact form, footer, `/projects` and `/projects/[slug]`
- **Admin dashboard** at `/admin` — content, projects, testimonials, clients, leads, media, navigation, social links, SEO, redirects, settings, users
- **Stack** — Next.js 16 (App Router, Server Actions), React 19, TypeScript, Tailwind CSS 4, Motion, Lenis, PostgreSQL, Prisma 7, React Hook Form, Zod

All demo content (name, statistics, projects, client logos, reviews) is placeholder material. Replace it from the dashboard before going live.

---

## 1. Requirements

- Node.js 20.9 or newer
- PostgreSQL 14 or newer

## 2. Local installation

```bash
cp .env.example .env          # then edit DATABASE_URL and AUTH_SECRET
npm install                   # also runs `prisma generate`
npm run db:migrate            # applies prisma/migrations to the database
npm run db:seed               # demo content + the first admin user
npm run dev                   # http://localhost:3000
```

Sign in at `http://localhost:3000/admin` with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `.env`, then change the password under **My profile**.

The seed is safe to re-run: it only creates content that does not exist yet and never overwrites your edits.

## 3. Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `NEXT_PUBLIC_SITE_URL` | yes | Public base URL without trailing slash; used for canonical URLs, sitemap, OG tags |
| `AUTH_SECRET` | yes | Signs admin sessions. Generate with `openssl rand -base64 48` |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_DEVELOPER_NAME` | seed only | First admin account and the name used in demo content |
| `RESEND_API_KEY` | for email | Resend API key. Without it, emails are written to the server log and leads are still saved |
| `EMAIL_FROM` | for email | Sender address on a domain verified in Resend |
| `STORAGE_DRIVER` | no | `local` (default) or `cloudinary` |
| `UPLOAD_DIR` | no | Folder for local uploads (default `./storage/uploads`); must be writable and persistent |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER` | for Cloudinary | Credentials for the Cloudinary driver |

Secrets are only read on the server. Nothing except `NEXT_PUBLIC_SITE_URL` reaches the browser.

## 4. Using the dashboard

| Area | What it manages |
| --- | --- |
| **Dashboard** | Page views, visitors, top pages and referrers, lead counts, recent inquiries |
| **Content** | Each home-page section: text, images, visibility of individual elements, section order, hero statistics, skill tags, about statistics and highlights, contact form options |
| **Projects** | Create, edit, duplicate, delete, reorder, feature, publish/unpublish, schedule, gallery, per-project SEO |
| **Testimonials / Clients** | Reviews and logos with ordering and visibility |
| **Leads** | Search, filter, status (new / contacted / qualified / closed), internal notes, CSV export |
| **Media** | Upload library with alt text; JPG, PNG, WebP, AVIF, GIF, ICO, PDF up to 10 MB |
| **Navigation & social** | Header links and social profiles |
| **SEO** | Titles, descriptions, canonical URL, OG/Twitter, robots directives, schema type, sitemap inclusion, redirects, live search and social previews |
| **Settings** | Identity, logo, favicon, profile photo, CV, contact details, colours, typefaces, motion options, email settings |
| **Users** | Administrators and editors |

### Drafts, preview and publishing

- **Content sections:** *Save draft* keeps changes private, *Publish* makes them live. *Preview* opens `/preview`, which shows drafts and is only available to signed-in users.
- **Projects and testimonials:** have a Draft / Published state. Projects can also have a scheduled publish time; a scheduled project appears within five minutes of that time (the public cache window).
- Public pages are statically cached and refreshed immediately whenever something is saved in the dashboard.

### Roles

- **Administrator** — everything.
- **Editor** — content, projects, testimonials, clients, media, navigation and leads; no settings, redirects, users or lead deletion.

Permissions are enforced on the server in every action, not only in the menu.

## 5. Project structure

```
app/
  (public)/            home, /projects, /projects/[slug], redirects + 404
  admin/               login and the dashboard (panel) pages
  preview/             authenticated draft preview
  api/                 lead CSV export, page-view tracking
  media/[...path]/     serves locally stored uploads
  sitemap.ts robots.ts
components/
  public/              site sections, animation helpers
  admin/               shell, schema-driven forms, tables, media picker, rich text
  shared/
lib/
  actions/             server actions (admin + contact form)
  auth/                sessions, password hashing
  services/            data access for the public site and dashboard
  seo/                 metadata + JSON-LD builders
  email/ storage/ validation/
  fields.ts            field definitions for every editable section
prisma/
  schema.prisma  migrations/  seed.ts
scripts/
  smoke-test.ts  generate-seed-assets.mjs
```

## 6. Testing

```bash
npm run typecheck            # TypeScript
npm run build                # production build (needs the database to be reachable)
npm run start                # serve the build
npm run test:smoke           # in a second terminal; HTTP checks against BASE_URL
```

`test:smoke` verifies public pages, metadata, JSON-LD, sitemap, robots, security headers, 404 handling and that admin routes reject anonymous requests. It does not modify data.

Manual checklist worth running after deployment:

1. Submit the contact form; confirm the lead appears under **Leads** and both emails arrive.
2. Upload an image in **Media** and use it in a project.
3. Save a draft in **Content**, check `/preview`, then publish and check the live page.
4. Change a published project's slug and confirm the old URL redirects.
5. Run PageSpeed Insights and the Rich Results Test against the live domain.

## 7. Deployment

The app runs anywhere that provides Node.js and PostgreSQL.

### VPS or any Node host

```bash
npm ci
npm run db:migrate           # prisma migrate deploy
npm run db:seed              # first deployment only
npm run build
npm run start                # or: pm2 start npm --name portfolio -- start
```

- Put a reverse proxy (Nginx, Caddy) in front for HTTPS and forward `X-Forwarded-For` so rate limiting sees real client addresses.
- Keep `UPLOAD_DIR` on a persistent disk and include it in backups.
- Set `NEXT_PUBLIC_SITE_URL` to the final `https://` domain **before** building.

### Serverless platforms (Vercel and similar)

- Use a hosted PostgreSQL (Neon, Supabase, RDS…) and a pooled connection string.
- Set `STORAGE_DRIVER=cloudinary` — serverless file systems are not persistent.
- Run `npm run db:migrate` as part of the build or release step.
- The in-memory rate limiter is per instance; the contact form additionally enforces a database-backed limit that holds across instances.

### Email

1. Create a Resend account and verify your sending domain.
2. Set `RESEND_API_KEY` and `EMAIL_FROM`.
3. In **Settings → Email**, set the notification address and the confirmation message.

### Domain and HTTPS

Point the domain at the host, enable HTTPS at the proxy or platform, and make sure `NEXT_PUBLIC_SITE_URL` matches. The app sends HSTS and other security headers itself.

## 8. Security notes

- Passwords are hashed with bcrypt; sessions are signed, HTTP-only, same-site cookies.
- Every dashboard action re-checks the session and role on the server.
- Input is validated with Zod on the server; rich text is sanitised before storage.
- Uploads are restricted by type, size and file signature and are served with `nosniff`.
- The contact form uses a honeypot, a minimum fill time, and per-address rate limits. IP addresses are stored only as salted hashes.
- `/admin` and `/preview` are excluded from indexing via headers and `robots.txt`.

## 9. Changing the database schema

```bash
# edit prisma/schema.prisma, then
npm run db:migrate:dev -- --name describe_change
```
