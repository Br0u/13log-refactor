# next-refactor

Next.js first-pass refactor for the original Hugo site.

## Commands

```bash
npm.cmd install
npm.cmd run dev
npm.cmd run build
npm.cmd start
```

## Scope (phase 1)

- Read Markdown from `../content`
- Routes: `/`, `/posts`, `/posts/[slug]`, `/link`, `/about`
- Parse frontmatter in Hugo `+++ TOML` and `--- YAML`