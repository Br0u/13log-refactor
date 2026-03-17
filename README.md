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

Create `.env` with at least:

```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your-password"
SESSION_SECRET="a-long-random-secret"
BLOB_READ_WRITE_TOKEN="vercel-blob-read-write-token"
```

`DATABASE_URL` is used by the app runtime. `DIRECT_URL` is used by Prisma migrations.
`BLOB_READ_WRITE_TOKEN` is required for admin image paste uploads backed by Vercel Blob.

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
