# Admin Near Fullscreen Width Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the admin workspace to a near-fullscreen desktop layout while preserving the narrow navigation rail.

**Architecture:** Keep the current admin shell structure and only adjust the layout modifier class and shell CSS. The rail remains compact; the stage expands to `vw`-based width with a sensible max cap so the admin feels much wider without becoming edge-to-edge.

**Tech Stack:** Next.js layout component, global CSS, Vitest, Next build.

---
