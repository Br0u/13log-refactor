---
name: github-submit
description: Create a safe, repeatable workflow for submitting local code changes to GitHub with git add, commit, push, and optional pull request preparation. Use when a user asks to "submit to GitHub", "commit and push", "upload code", "sync my branch", or needs help crafting commit messages and pre-push checks.
---

# Github Submit

## Overview

Follow this workflow to stage changes, create a clear commit, and push to the correct remote branch with minimal risk. Keep commits focused, verify what is being shipped, and surface blockers before push.

## Workflow

1. Inspect repository state with `git status --short --branch`.
2. Review changed files with `git diff --stat` and targeted `git diff -- <path>`.
3. Check branch and remotes with `git branch --show-current` and `git remote -v`.
4. Stage precisely with `git add <path>` (prefer targeted paths over `git add -A` unless requested).
5. Confirm staged content with `git diff --cached --stat` and `git diff --cached`.
6. Write a commit message using [commit-message-guidelines.md](references/commit-message-guidelines.md).
7. Commit with `git commit -m "<type(scope): summary>"`.
8. Push with `git push` (or `git push -u origin <branch>` for first push).
9. If requested, prepare PR context: branch name, commit summary, and key test evidence.

## Safety Rules

1. Never run destructive history commands (`git reset --hard`, force push) unless explicitly requested.
2. Never stage unrelated files when the user asked for a scoped change.
3. Ask for confirmation before pushing directly to protected or release branches.
4. If merge/rebase conflicts appear, stop and explain exact conflict files before proceeding.
5. Prefer a small atomic commit over one large mixed commit.

## Common Scenarios

1. Submit all current work
Use:
`git add -A && git commit -m "<message>" && git push`
Apply only when the user explicitly wants all modified files included.

2. Submit only selected files
Use:
`git add <file1> <file2>`
Then review staged diff and commit.

3. First push of a new branch
Use:
`git push -u origin <branch>`
Then regular `git push` for subsequent commits.

4. Conventional commit formatting
Reference [commit-message-guidelines.md](references/commit-message-guidelines.md) and choose `feat`, `fix`, `refactor`, `docs`, `test`, or `chore`.

## Output Checklist

Before finishing, include:
1. Current branch and remote target.
2. Files staged for commit.
3. Commit hash and commit message.
4. Push result (success or exact error).