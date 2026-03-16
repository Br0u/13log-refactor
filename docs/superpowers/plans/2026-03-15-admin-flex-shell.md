# Admin Flex Shell Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the admin page width issues by switching the outer shell from grid to a balanced two-column flex layout.

**Architecture:** Keep the rail and stage markup unchanged, but move the shell layout responsibility to a dedicated `flex` modifier class. The rail gets a fixed flex-basis, the stage becomes `flex: 1`, and mobile continues to collapse to a vertical stack.

**Tech Stack:** Next.js layout component, global CSS, Vitest, Next build.

---
