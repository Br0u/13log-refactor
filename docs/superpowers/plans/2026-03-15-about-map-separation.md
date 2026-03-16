# About Map Separation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate the About page map from the guestbook footer and give the map a dedicated wide banner ratio.

**Architecture:** Keep the About page content and guestbook untouched, but move the map into its own standalone section between the article body and the footer. Add dedicated classes in the About styles so the map gets independent width and aspect handling instead of sharing footer constraints.

**Tech Stack:** Next.js App Router, React server component markup, global CSS, Vitest.

---
