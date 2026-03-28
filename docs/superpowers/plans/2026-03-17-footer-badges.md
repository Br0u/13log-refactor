# Footer Badges Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current global footer with a divider-led footer that includes two native editorial badges and a quieter copyright line.

**Architecture:** Keep the footer global in `app/layout.js`, render the badge content directly in the existing layout, and style it through `app/papermod-custom.css` so the new footer extends the current PaperMod-derived design language. Add focused tests around the layout markup and footer CSS selectors so the structure, links, and responsive hooks stay stable.

**Tech Stack:** Next.js App Router, React server layout markup, project CSS in `app/papermod-custom.css`, Vitest + Testing Library.

---

## File Map

- Modify: `app/layout.js`
  - Replace the current two-span footer body with a three-layer footer structure.
- Modify: `app/papermod-custom.css`
  - Add footer badge layout, interaction, responsive, and dark-mode rules.
- Modify: `tests/app/admin-layout.test.js`
  - Reuse layout render coverage or add footer structure assertions if this is the closest existing root layout test.
- Create or Modify: `tests/app/layout-footer.test.jsx`
  - Assert the new footer badges, links, and copyright line render correctly.
- Create or Modify: `tests/components/footer-styles.test.js`
  - Assert the presence of the new footer CSS hooks if the repo already uses style-level selector tests for global UI sections.

## Chunk 1: Footer Markup

### Task 1: Add failing layout test coverage

**Files:**
- Modify or Create: `tests/app/layout-footer.test.jsx`
- Reference: `app/layout.js`

- [ ] **Step 1: Write the failing test**

```jsx
import { render, screen } from "@testing-library/react";
import RootLayout from "../../app/layout";

describe("root layout footer", () => {
  it("renders the editorial footer badges and copyright", () => {
    render(RootLayout({ children: <div>content</div> }));

    expect(screen.getByRole("link", { name: /human written/i })).toHaveAttribute("href", "https://notbyai.fyi/");
    expect(screen.getByRole("link", { name: /cc by-nc-sa/i })).toHaveAttribute("href", "https://creativecommons.org/licenses/by-nc-sa/4.0/");
    expect(screen.getByText(/13log/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node ./node_modules/vitest/vitest.mjs run tests/app/layout-footer.test.jsx`

Expected: FAIL because the current footer does not render the badge links or new text.

- [ ] **Step 3: Write minimal implementation**

Update `app/layout.js` to render:

```jsx
<footer className="footer">
  <div className="footer__badges" aria-label="Footer certifications">
    <a
      className="footer-badge"
      href="https://notbyai.fyi/"
      target="_blank"
      rel="noreferrer"
      aria-label="Human Written"
    >
      <span className="footer-badge__plate">HUMAN WRITTEN</span>
      <span className="footer-badge__label">/ 非 AI 创作</span>
    </a>
    <a
      className="footer-badge"
      href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
      target="_blank"
      rel="license noreferrer"
      aria-label="CC BY-NC-SA"
    >
      <span className="footer-badge__plate">CC BY-NC-SA</span>
      <span className="footer-badge__label">/ 内容许可协议</span>
    </a>
  </div>
  <p className="footer__meta">13log © {new Date().getFullYear()} Br0u.</p>
</footer>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node ./node_modules/vitest/vitest.mjs run tests/app/layout-footer.test.jsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/layout.js tests/app/layout-footer.test.jsx
git commit -m "feat: add editorial footer badge markup"
```

## Chunk 2: Footer Styling

### Task 2: Add failing footer style coverage

**Files:**
- Modify or Create: `tests/components/footer-styles.test.js`
- Modify: `app/papermod-custom.css`

- [ ] **Step 1: Write the failing test**

Add selector assertions for:

```js
expect(css).toContain(".footer__badges");
expect(css).toContain(".footer-badge");
expect(css).toContain(".footer-badge__plate");
expect(css).toContain(".footer__meta");
expect(css).toContain("@media (max-width:");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node ./node_modules/vitest/vitest.mjs run tests/components/footer-styles.test.js`

Expected: FAIL because the footer badge selectors do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add footer styles in `app/papermod-custom.css` covering:

```css
.footer {
  border-top: 1px solid var(--border);
  padding: 3rem 0 var(--gap);
  display: grid;
  gap: 1.6rem;
  justify-items: center;
}

.footer__badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem 1.25rem;
}

.footer-badge {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-width: 9rem;
  text-decoration: none;
}

.footer-badge__plate {
  border: 1.5px solid var(--primary);
  border-top-right-radius: 0.95rem;
  border-bottom-left-radius: 0.95rem;
  padding: 0.55rem 1rem;
}

.footer__meta {
  color: var(--secondary);
  font-size: 0.78rem;
}

@media (max-width: 640px) {
  .footer__badges {
    flex-direction: column;
    align-items: center;
  }

  .footer-badge {
    width: min(100%, 12rem);
  }
}
```

Also add matching hover/focus-visible and dark-mode rules that stay restrained.

- [ ] **Step 4: Run test to verify it passes**

Run: `node ./node_modules/vitest/vitest.mjs run tests/components/footer-styles.test.js`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/papermod-custom.css tests/components/footer-styles.test.js
git commit -m "style: add editorial footer badge styles"
```

## Chunk 3: Regression Verification

### Task 3: Verify footer behavior in the existing suite

**Files:**
- Run-only: `tests/app/layout-footer.test.jsx`
- Run-only: `tests/components/footer-styles.test.js`
- Run-only: existing layout/global tests such as `tests/app/about-page.test.jsx`

- [ ] **Step 1: Run focused footer tests**

Run: `node ./node_modules/vitest/vitest.mjs run tests/app/layout-footer.test.jsx tests/components/footer-styles.test.js`

Expected: PASS

- [ ] **Step 2: Run nearby regression tests**

Run: `node ./node_modules/vitest/vitest.mjs run tests/app/about-page.test.jsx tests/app/posts-page.test.jsx tests/app/admin-layout.test.js`

Expected: PASS

- [ ] **Step 3: Run full suite**

Run: `npm test`

Expected: `47`+ passing test files and `0` failures, matching the current project baseline or higher if new tests were added.

- [ ] **Step 4: Commit**

```bash
git add app/layout.js app/papermod-custom.css tests/app/layout-footer.test.jsx tests/components/footer-styles.test.js
git commit -m "test: verify editorial footer badges"
```
