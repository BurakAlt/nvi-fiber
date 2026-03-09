[SkillRefiner](https://skills-refiner.com/)

[Explore](https://skills-refiner.com/) [Terminal](https://skills-refiner.com/terminal) [AI Community](https://skills-refiner.com/intro)

EN

[Log In](https://skills-refiner.com/login)

EN

[Skill Hall](https://skills-refiner.com/)/KatTate/bmad-dev-story

# bmad-dev-story

BMAD Method: Implement a story using its acceptance criteria and dev notes. Use when user says "dev story", "DS", "implement story", "build the story", "code the story", or requests story implementation. Phase 4 Implementation workflow.

Updated on:2/17/2026

0

0

## Skill Specification

| Name | Description |
| --- | --- |
| bmad-dev-story | BMAD Method: Implement a story using its acceptance criteria and dev notes. Use when user says "dev story", "DS", "implement story", "build the story", "code the story", or requests story implementation. Phase 4 Implementation workflow. |

# BMAD Dev Story Workflow

This skill activates the BMAD Dev Story workflow. The agent plans its own
implementation approach from the story's acceptance criteria and dev notes,
then builds, tests, verifies, and updates all tracking artifacts.

## Activation

When this skill is triggered, execute the BMAD workflow by following these steps exactly:

### 1\. Load the Workflow Engine

Read the BMAD workflow execution engine:
`_bmad/core/tasks/workflow.xml`

### 2\. Load the Workflow Configuration

Pass this workflow configuration file to the engine:
`_bmad/bmm/workflows/4-implementation/dev-story/workflow.yaml`

### 3\. Execute

Follow the workflow engine instructions precisely, processing the workflow YAML
through all steps in order. The workflow engine handles:

- Configuration loading from `_bmad/bmm/config.yaml`
- Story file discovery and loading
- Sprint status tracking
- Project context loading (if exists)
- Instructions execution from the workflow's instructions.xml
- Checklist validation from the workflow's checklist.md

## Precondition Gate — MANDATORY

**Before activating this workflow, verify that a completed story context document exists:**

1. Check `_bmad-output/implementation-artifacts/` for a story file matching the target story (e.g., `5-4-balance-sheet-cash-flow-tabs.md`).
2. If NO story document exists, **DO NOT proceed with this workflow.** Instead, tell the user: "No story document exists for this story yet. I need to run create-story (CS) first to produce it." Then activate `bmad-create-story` instead.
3. If a story document exists but its Status is NOT `ready-for-dev` or `in-progress`, **DO NOT proceed.** Tell the user the current status and ask how to proceed.

**This gate exists because an agent once skipped story creation entirely and jumped straight to writing implementation code, bypassing all BMAD quality checks. The story document is the quality gate — without it, acceptance criteria completeness, anti-patterns, and integration gotchas are unvalidated.**

## Critical Rules

- This workflow has **11 steps**. You are NOT done until step 11 is complete.
- NEVER skip steps or optimize the sequence — every step exists for a reason
- NEVER auto-proceed past WAIT points — stop and wait for user input
- ALWAYS follow the instructions.xml referenced in the workflow YAML
- ALWAYS apply the checklist.md validation before completing
- The agent plans its OWN implementation approach from acceptance criteria — do not use pre-scripted task checklists
- Steps 10 and 11 (update story/sprint status, communicate completion) are MANDATORY — these are the steps most commonly skipped and must always be executed
- Do NOT stop after implementation. You MUST continue through testing, verification, documentation updates, and completion communication.
- **NEVER write implementation code outside of this workflow.** If you find yourself writing application code (components, routes, styles, tests) without having loaded a story file through Step 1, you are violating the BMAD process. Stop immediately.

## Step Summary

For reference, the 11 steps in this workflow are:

01. Load story file
02. Load project context
03. Detect review continuation
04. Mark story in-progress (update sprint status)
05. Plan implementation approach
06. Implement the plan
07. Test implementation
08. Verify ALL acceptance criteria
09. Platform verification (LSP, git, screenshots)
10. **Update story file AND sprint status** ← commonly missed
11. **Communicate completion** ← commonly missed

## What's Next

After implementing a story, the typical next steps are:

- **Code Review (CR)** — review implemented code against acceptance criteria
- Recommend starting a **new chat session** for Code Review to keep context fresh

![KatTate](https://github.com/KatTate.png)

KatTate

0

0

Verified repository

[View Source](https://github.com/KatTate/Katalyst_Franchise_Planner/tree/main/.agents/skills/bmad-dev-story/)

License Agreement: MITState: Active

npxnpm

[CLI 使用指南](https://skills-refiner.com/terminal#guide)

npx skills-refiner KatTate/bmad-dev-story -l zh-CN

### Refactoring tools

Target language中文 (简体) (zh-CN)中文 (繁體) (zh-TW)English (en-US)हिन्दी (Hindi) (hi-IN)Español (es-ES)Français (fr-FR)العربية (Arabic) (ar-SA)বাংলা (Bengali) (bn-BD)Português (pt-BR)Русский (Russian) (ru-RU)اردو (Urdu) (ur-PK)Bahasa Indonesia (id-ID)Deutsch (de-DE)日本語 (Japanese) (ja-JP)Nigerian Pidgin (pcm-NG)मराठी (Marathi) (mr-IN)తెలుగు (Telugu) (te-IN)Türkçe (tr-TR)தமிழ் (Tamil) (ta-IN)廣東話 (Cantonese) (yue-HK)Tiếng Việt (vi-VN)Tagalog (tl-PH)吴语 (Wu Chinese) (wuu-CN)한국어 (Korean) (ko-KR)فارسی (Persian) (fa-IR)Hausa (ha-NG)Kiswahili (sw-KE)Basa Jawa (Javanese) (jv-ID)Italiano (it-IT)ਪੰਜਾਬੀ (Punjabi) (pa-PK)ಕನ್ನಡ (Kannada) (kn-IN)ગુજરાતી (Gujarati) (gu-IN)ไทย (Thai) (th-TH)አማርኛ (Amharic) (am-ET)भोजपुरी (Bhojpuri) (bho-IN)閩南語 (Hokkien) (nan-TW)晋语 (Jin Chinese) (cjy-CN)Yorùbá (yo-NG)客家话 (Hakka) (hak-CN)မြန်မာစာ (Burmese) (my-MM)ଓଡ଼ିଆ (Odia) (or-IN)Afaan Oromoo (om-ET)پښتو (Pashto) (ps-AF)Kurdî (Kurdish) (ku-TR)Asụsụ Igbo (ig-NG)മലയാളം (Malayalam) (ml-IN)الدارجة (الجزائر) (ar-DZ)Azərbaycan dili (az-AZ)Polski (pl-PL)Oʻzbekcha (uz-UZ)سنڌي (Sindhi) (sd-PK)

Refactor

## You Might Like

[Discover more](https://skills-refiner.com/)

![a2f0](https://avatars.githubusercontent.com/u/1569853?v=4)

### preen-enhancements

High-risk maintenance workflow for evolving the preen ecosystem (registry, parity checks, new categories, and automation guardrails).

0

View Details

![NeverSight](https://avatars.githubusercontent.com/u/199295973?v=4)

### scientific-email-polishing

Use when writing or polishing professional scientific emails, journal cover letters, or responses to reviewers. Invoke when user mentions email to collaborator, cover letter to editor, reviewer response, professional correspondence, or needs help with professional tone, clear asks, or diplomatic communication in academic/scientific contexts.

17

View Details

![NeverSight](https://avatars.githubusercontent.com/u/199295973?v=4)

### developer-growth-analysis

Analyzes your recent Claude Code chat history to identify coding patterns, development gaps, and areas for improvement, curates relevant learning resources from HackerNews, and automatically sends a personalized growth report to your Slack DMs.

17

View Details

Translation / Refactoring

v2.1.0