# About Map Width And Copy Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Widen the About page map section while keeping the guestbook narrow, and replace the guestbook helper copy with the new two-line literary phrasing.

**Architecture:** Limit the change to the About page presentation layer: update the About page test and guestbook component test first, then adjust the guestbook copy in the component and widen only the map shell/container styles in `app/papermod-custom.css`.

**Tech Stack:** Next.js App Router, React, global CSS, Vitest.

---
