# Admin Latin Font Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply `Iosevka Charon Mono` to the admin workspace and admin login UI without changing front-end typography.

**Architecture:** Reuse the existing global `--latin-font` token and attach it to the admin containers and their high-frequency controls in `app/globals.css`. Keep the change CSS-only so all admin pages inherit the font consistently.

**Tech Stack:** Next.js, global CSS, Vitest server-render tests.

---
