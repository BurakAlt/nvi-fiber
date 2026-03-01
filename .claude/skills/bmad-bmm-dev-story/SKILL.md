---
name: bmad-bmm-dev-story
description: "BMAD Method: Implement a story using its acceptance criteria and dev notes"
triggers:
  - dev story
  - DS
  - implement story
  - build the story
  - code the story
  - story implementation
---

# BMAD Dev Story Workflow

Phase 4 Implementation workflow from the BMAD Method (Breakthrough Method for Agile AI Development). Implements a story by following its acceptance criteria and dev notes through a structured 10-step process.

## When to Use
- User says "dev story", "DS", "implement story", "build the story", or "code the story"
- User wants to implement a specific story from the BMAD planning pipeline
- User references a story file in `_bmad-output/implementation-artifacts/`
- Continuing implementation after a code review

## Precondition Gate — MANDATORY

**Before activating this workflow, verify a completed story context document exists:**

1. Check `_bmad-output/implementation-artifacts/` for a story file matching the target story
2. If NO story document exists, **DO NOT proceed**. Tell the user: "No story document exists for this story yet. Run `/bmad-bmm-create-story` first to produce it."
3. If a story document exists but its Status is NOT `ready-for-dev` or `in-progress`, **DO NOT proceed**. Tell the user the current status and ask how to proceed.

## Activation

When this skill is triggered, execute the BMAD workflow by following these steps exactly:

### 1. Load the Workflow Engine

Read the BMAD workflow execution engine:
`_bmad/core/tasks/workflow.xml`

### 2. Load the Workflow Configuration

Pass this workflow configuration file to the engine:
`_bmad/bmm/workflows/4-implementation/dev-story/workflow.yaml`

### 3. Execute

Follow the workflow engine instructions precisely, processing the workflow YAML through all steps in order. The workflow engine handles:

- Configuration loading from `_bmad/bmm/config.yaml`
- Story file discovery and loading
- Sprint status tracking (`_bmad-output/implementation-artifacts/sprint-status.yaml`)
- Project context loading (`_bmad-output/project-context.md` if exists)
- Instructions execution from `_bmad/bmm/workflows/4-implementation/dev-story/instructions.xml`
- Checklist validation from `_bmad/bmm/workflows/4-implementation/dev-story/checklist.md`

## Config Reference

From `_bmad/bmm/config.yaml`:
- **Project**: NVI FIBER
- **User**: BURAK
- **Communication**: TURKISH
- **Document output**: TURKISH
- **Skill level**: intermediate
- **Story directory**: `_bmad-output/implementation-artifacts/`

## Step Summary

The workflow has 10 steps — you are NOT done until the final step is complete:

01. **Find & load story** — discover next `ready-for-dev` story from sprint status or user-provided path
02. **Load project context** — load `project-context.md` and parse story sections (AC, tasks, dev notes)
03. **Detect review continuation** — check if resuming after a code review (look for "Senior Developer Review" section)
04. **Mark story in-progress** — update `sprint-status.yaml` status to `in-progress`
05. **Implement tasks** — red-green-refactor cycle: write failing tests → implement → refactor. Follow story tasks/subtasks exactly
06. **Author comprehensive tests** — unit, integration, and e2e tests as required by the story
07. **Run validations** — full test suite, linting, acceptance criteria verification
08. **Validate & mark tasks complete** — only mark [x] when ALL validation gates pass. Update File List and Dev Agent Record
09. **Story completion** — verify ALL tasks done, update story Status to `review`, update sprint status
10. **Completion communication** — summarize to user, suggest code review as next step

## Critical Rules

- **NEVER skip steps** — every step exists for a reason
- **NEVER auto-proceed past WAIT points** — stop and wait for user input
- **NEVER mark a task complete unless ALL validation gates pass** — no lying or cheating
- **NEVER implement anything not mapped to a specific task/subtask** in the story file
- **NEVER stop early** — steps 9 and 10 (status updates, completion communication) are commonly skipped and MUST be executed
- **Execute continuously** without pausing until all tasks/subtasks are complete or an explicit HALT condition
- Only modify permitted story file sections: Tasks/Subtasks checkboxes, Dev Agent Record, File List, Change Log, Status
- The agent plans its OWN implementation approach from acceptance criteria — do not use pre-scripted task checklists

## Project-Specific Notes (FiberPlan Chrome Extension)

This is a **Manifest V3 Chrome Extension** with no build step (vanilla JS, IIFE modules). Key considerations:

- **No test framework** — use `fiber-chrome/dashboard/test-topology.html` for topology tests
- **Load order matters** — module dependencies defined in `manifest.json`
- **Ada-scoped operations** — every feature works within ada context
- **Recalculation pipeline** — changes trigger `PonEngine.recalculateAda()`
- **GPON standards** — 28 dB max loss budget, ITU-T G.984 Class B+
- **Debug logging** — `python scripts/log-monitor.py` for real-time logs

## What's Next

After implementing a story:
- Run **Code Review** (`/bmad-bmm-code-review`) — recommended with a different LLM
- Check sprint status to see project progress

## Learnings
<!-- Updated by self-annealing loop -->
