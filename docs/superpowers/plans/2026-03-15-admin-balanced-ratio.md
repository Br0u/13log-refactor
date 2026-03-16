# Admin Balanced Ratio Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebalance the admin shell so the rail and main stage scale together without overflowing the page.

**Architecture:** Replace the over-aggressive near-fullscreen modifier with a balanced-ratio modifier. Update only the admin layout class and shell CSS: give the rail a more realistic desktop width, reduce overall shell aggressiveness, and keep the main stage fluid within safe viewport margins.

**Tech Stack:** Next.js layout component, global CSS, Vitest, Next build.

---
