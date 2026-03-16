# Admin Stage Width Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Widen the admin main stage while keeping the navigation rail narrow and stable.

**Architecture:** Limit the change to the admin shell CSS and a small layout class update if needed. Keep the rail width fixed, increase the total shell width and stage breathing room, and avoid touching page-specific content panels so the current editorial admin structure stays intact.

**Tech Stack:** Next.js layout component, global CSS, Vitest, Next build.

---
