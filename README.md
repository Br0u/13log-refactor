# next-refactor

Next.js first-pass refactor for the original Hugo site.

## Commands

```bash
npm.cmd install
npm.cmd run dev
npm.cmd run build
npm.cmd start
```

## Backend Extension Setup

This branch adds a database-backed admin area, article persistence, likes, and comments.

### Environment

Copy `.env.example` to `.env` and replace every placeholder:

```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
ADMIN_USERNAME="replace-with-admin-username"
ADMIN_PASSWORD=""
SESSION_SECRET=""
RISK_INTERNAL_SECRET=""
BLOB_READ_WRITE_TOKEN="vercel-blob-read-write-token"
NEXT_PUBLIC_SITE_URL="https://example.com"
```

`DATABASE_URL` is used by the app runtime. `DIRECT_URL` is used by Prisma migrations.
`BLOB_READ_WRITE_TOKEN` is required for admin image paste uploads backed by Vercel Blob.
`NEXT_PUBLIC_SITE_URL` is the public origin used for RSS, index output, and site links.

The empty `ADMIN_PASSWORD` is intentionally invalid. Set it to a strong, unique
value in a protected local `.env` before running `npm run db:seed`; the seed
fails closed when `ADMIN_USERNAME` or `ADMIN_PASSWORD` is omitted.

`SESSION_SECRET` and `RISK_INTERNAL_SECRET` are mandatory, must each contain at
least 32 characters, and must be different. The empty values in `.env.example`
are intentionally invalid so copied configuration fails closed. Before any
deployment or application startup, replace them by running the command
separately for each secret:

```bash
openssl rand -base64 48
openssl rand -base64 48
```

Use the first output for `SESSION_SECRET` and the separately generated second
output for `RISK_INTERNAL_SECRET`. Missing or short configuration causes admin
session creation and internal risk-request signing to fail closed. The risk
middleware itself fails open when internal risk evaluation or its configuration
is unavailable. This is a security degradation: access logging, blacklist
enforcement, bot blocking, and API rate-limit evaluation are disabled. It is
never an acceptable rollout configuration.
Rotating `SESSION_SECRET` invalidates all existing admin sessions and requires
administrators to sign in again.

### Database

Generate the Prisma client:

```bash
npm run db:generate
```

Run migrations:

```bash
npx prisma migrate dev --name init_backend --skip-generate
```

Seed the admin account and default category:

```bash
npm run db:seed
```

Import existing Markdown posts into the database:

```bash
node --env-file=.env scripts/migrate-markdown-to-db.mjs
```

Clean integration-test data from the database:

```bash
npm run db:cleanup:test-data
```

### Testing

Run the test suite:

```bash
npm test
```

### Admin

After `npm run dev`, the admin area is available at:

```text
/admin/login
```

Use `ADMIN_USERNAME` and `ADMIN_PASSWORD` from `.env`.

When editing posts or micro posts, you can paste an image directly into the markdown field. The image is uploaded to Vercel Blob and inserted as Markdown automatically.

## Scope (phase 1)

- Read Markdown from `../content`
- Routes: `/`, `/posts`, `/posts/[slug]`, `/link`, `/about`
- Parse frontmatter in Hugo `+++ TOML` and `--- YAML`
