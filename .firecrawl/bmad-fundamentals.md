[Sitemap](https://theonlymittal.medium.com/sitemap/sitemap.xml)

[Open in app](https://play.google.com/store/apps/details?id=com.medium.reader&referrer=utm_source%3DmobileNavBar&source=post_page---top_nav_layout_nav-----------------------------------------)

Sign up

[Sign in](https://medium.com/m/signin?operation=login&redirect=https%3A%2F%2Ftheonlymittal.medium.com%2Fbmad-fundamentals-70f1d0e912f2&source=post_page---top_nav_layout_nav-----------------------global_nav------------------)

[Medium Logo](https://medium.com/?source=post_page---top_nav_layout_nav-----------------------------------------)

Get app

[Write](https://medium.com/m/signin?operation=register&redirect=https%3A%2F%2Fmedium.com%2Fnew-story&source=---top_nav_layout_nav-----------------------new_post_topnav------------------)

[Search](https://medium.com/search?source=post_page---top_nav_layout_nav-----------------------------------------)

Sign up

[Sign in](https://medium.com/m/signin?operation=login&redirect=https%3A%2F%2Ftheonlymittal.medium.com%2Fbmad-fundamentals-70f1d0e912f2&source=post_page---top_nav_layout_nav-----------------------global_nav------------------)

![](https://miro.medium.com/v2/resize:fill:32:32/1*dmbNkD5D-u45r44go_cf0g.png)

[Mastodon](https://me.dm/@kredittclub)

# BMAD Fundamentals

[![Abhishek Mittal](https://miro.medium.com/v2/resize:fill:32:32/1*9MV_rja6E8e8ehDTnhCj0w.jpeg)](https://theonlymittal.medium.com/?source=post_page---byline--70f1d0e912f2---------------------------------------)

[Abhishek Mittal](https://theonlymittal.medium.com/?source=post_page---byline--70f1d0e912f2---------------------------------------)

Follow

5 min read

·

4 days ago

[Listen](https://medium.com/m/signin?actionUrl=https%3A%2F%2Fmedium.com%2Fplans%3Fdimension%3Dpost_audio_button%26postId%3D70f1d0e912f2&operation=register&redirect=https%3A%2F%2Ftheonlymittal.medium.com%2Fbmad-fundamentals-70f1d0e912f2&source=---header_actions--70f1d0e912f2---------------------post_audio_button------------------)

Share

Master the core architecture of the BMAD Method — agents, workflows, tasks, templates, the 4-phase lifecycle, and your first complete project setup.

Press enter or click to view image in full size

![](https://miro.medium.com/v2/resize:fit:700/1*oAF774yDhx3KGt6PmC1WaA.png)

## The Analogy That Makes Everything Click

Imagine hiring a consulting firm. They send you one person for every meeting — and that person reads the briefing notes before walking in. The PM attends strategy sessions. The architect attends design reviews. The developer attends build sessions. Each brings their specific expertise. Each reads what the previous person documented. Nobody starts from scratch.

That’s BMAD. Except the consultants live in your project folder, remember everything through files, and cost you token credits instead of hourly rates.

Traditional AI usage is the _opposite_: one generalist who forgets everything between every meeting. BMAD solves this with structure, not smarter models.

## What “BMAD” Stands For

Breakthrough Method for Agile AI Driven Development

- Breakthrough: A genuine shift in how humans + AI collaborate — from chat to structured workflow
- Agile: Borrows the Sprint/Epic/Story model from software development
- AI Driven: AI agents are first-class actors, not just assistants
- Development: Covers the full lifecycle from idea to deployed code

Current state (Feb 2026): v6.0.3, 37,400+ GitHub stars, 4,600+ forks, 117 contributors. MIT license. 100% free, no paywalls.

## The Core Problem BMAD Solves

A senior PM once spent 2 hours in a wandering AI conversation about market analysis. She got 47 screenshots, 3 documents, and no clear next steps. The next day, she couldn’t replicate a single insight.

The root cause: Unstructured inputs create unreliable outputs. Always.

The model wasn’t the problem. The lack of:

- Roles (who is responsible for what kind of thinking)
- Handoffs (what information transfers between phases)
- Memory (what persists between sessions in versioned files)
- Quality gates (what checks exist before proceeding)

BMAD addresses all four.

## The BMAD Architecture

Press enter or click to view image in full size

![](https://miro.medium.com/v2/resize:fit:700/1*gmEV6RDI-LQqsbBf7shaBQ.png)

## The Building Blocks

Press enter or click to view image in full size

![](https://miro.medium.com/v2/resize:fit:700/1*GyrtpDwhsPGmkUFAWEIqlQ.png)

## The 12+ Specialized Agents

BMAD ships with agents that mirror a real software team:

Press enter or click to view image in full size

![](https://miro.medium.com/v2/resize:fit:700/1*pe06YnSDFddy_U_GJTlMAQ.png)

Party Mode: Bring multiple agents into one chat session for collaborative discussion. Useful when you need the architect and PM to debate a design trade-off together.

## The Official Modules (v6.0.3)

Press enter or click to view image in full size

![](https://miro.medium.com/v2/resize:fit:700/1*Xg6aJrKd3QDte_2RWhBb3Q.png)

## The 4 Development Phases

Press enter or click to view image in full size

![](https://miro.medium.com/v2/resize:fit:700/1*MkxSJ-26kN6SSdjSAYQvXA.png)

## Phase 1: Analysis (Optional but Recommended)

- `/bmad-brainstorming` — Guided ideation with the Analyst agent
- `/bmad-bmm-research` — Market and technical research
- `/bmad-bmm-create-product-brief` — A foundation document that feeds into the PRD

_When to skip:_ You already have clear requirements and need to move fast.

## Phase 2: Planning (Required for Every Track)

- Quick Flow: Run `/bmad-bmm-quick-spec` → get a tech-spec → jump to implementation
- BMad Method: Load PM agent → run `/bmad-bmm-create-prd` → output: `PRD.md`
- Enterprise: Same as BMad Method, plus security and DevOps planning layers

_Key output:_ A structured `PRD.md` that all subsequent phases reference.

## Phase 3: Solutioning (BMad Method + Enterprise Only)

- Load Architect agent → run `/bmad-bmm-create-architecture` → output: `architecture.md`
- After architecture: Load PM agent → run `/bmad-bmm-create-epics-and-stories`
- Why after architecture? Because database and API decisions directly determine how work breaks down into stories.
- Run `/bmad-bmm-check-implementation-readiness` to validate cohesion across all planning docs.

## Phase 4: Implementation

```
For each story:
  1. SM agent: /bmad-bmm-create-story   → story file
  2. Dev agent: /bmad-bmm-dev-story     → implement the story
  3. Dev agent: /bmad-bmm-code-review   → validate quality (recommended)
```

```
After all stories in an epic:
  SM agent: /bmad-bmm-retrospective
```

Copy code

## Get Abhishek Mittal’s stories in your inbox

Join Medium for free to get updates from this writer.

Subscribe

Subscribe

Critical rule: Always start a fresh chat for each workflow. Context window limits cause quality degradation if you don’t.

## The 3 Planning Tracks

Press enter or click to view image in full size

![](https://miro.medium.com/v2/resize:fit:700/1*C1_Je_1zSG_5djlfeNXwsA.png)

> _Note: Story counts are guidance, not hard rules. Choose your track based on how much upfront planning your project needs, not story math._

## Quick Start: Your First 15 Minutes

## Step 1: Install

```
# Prerequisites: Node.js v20+
npx bmad-method install
```

Copy code

Follow the prompts. Select the BMad Method (BMM) module.

The installer creates:

- `_bmad/` — the framework (agents, workflows, tasks, templates)
- `_bmad-output/` — empty; your artifacts will live here

## Step 2: Let BMad-Help Orient You

Open your AI IDE (Claude Code or Cursor) in your project folder. Run:

```
/bmad-help
```

Copy code

BMad-Help will:

1. Detect what modules you have installed
2. Inspect what you’ve already completed
3. Recommend exactly what to do next
4. Answer your questions in plain language

You can ask it anything:

```
/bmad-help I have a SaaS idea, I know all the features I want, where do I start?
/bmad-help I just finished the architecture, what do I do next?
/bmad-help what's the difference between Quick Flow and BMad Method?
```

Copy code

## Step 3: Create Your project-context.md (Optional but High-Value)

Before any agent runs, create `_bmad-output/project-context.md`. This file captures your conventions:

- Tech stack preferences
- Naming conventions
- Deployment targets
- Code style rules

Every agent will respect these rules throughout the project. Generate it with `/bmad-bmm-generate-project-context` after architecture, or write it manually.

## The Build Cycle (Phase 4 in Detail)

Press enter or click to view image in full size

![](https://miro.medium.com/v2/resize:fit:700/1*lJCGYlGVoG8F8C-0FDSUiw.png)

The sprint-status YAML is your living project dashboard. It tracks which epics and stories are done, in progress, or blocked.

## The Rule That Changes Everything

> _Fresh chat for every workflow._

This is BMAD’s most counterintuitive but important constraint. Each workflow is designed to run in a clean context. Carrying stale context from a previous workflow degrades quality. BMAD’s persistent memory lives in the _files_ (`PRD.md`, `architecture.md`, `sprint-status.yaml`), not the chat session.

This is a feature, not a limitation. Your project state is always in version control.

## Check for Understanding

1. What’s the difference between an agent and a workflow in BMAD?
2. You’re building a landing page with a contact form. Which planning track do you choose?
3. Why does BMAD recommend creating stories _after_ the architecture document, not before?
4. What command gives you context-aware guidance at any point in a BMAD project?
5. Where does BMAD store persistent project memory — in the chat, or in files?

## What’s Next

You’ve mastered the architecture. Next, you’ll learn:

- How BMAD compares to CrewAI, LangGraph, and MetaGPT
- When to use each framework (the honest decision table)
- How to build a domain-specific Expansion Pack from scratch

#Thanks

[Agents](https://medium.com/tag/agents?source=post_page-----70f1d0e912f2---------------------------------------)

[Workflows](https://medium.com/tag/workflows?source=post_page-----70f1d0e912f2---------------------------------------)

[Product Lifecycle](https://medium.com/tag/product-lifecycle?source=post_page-----70f1d0e912f2---------------------------------------)

[Bmad](https://medium.com/tag/bmad?source=post_page-----70f1d0e912f2---------------------------------------)

[Fundamentals](https://medium.com/tag/fundamentals?source=post_page-----70f1d0e912f2---------------------------------------)

[![Abhishek Mittal](https://miro.medium.com/v2/resize:fill:48:48/1*9MV_rja6E8e8ehDTnhCj0w.jpeg)](https://theonlymittal.medium.com/?source=post_page---post_author_info--70f1d0e912f2---------------------------------------)

[![Abhishek Mittal](https://miro.medium.com/v2/resize:fill:64:64/1*9MV_rja6E8e8ehDTnhCj0w.jpeg)](https://theonlymittal.medium.com/?source=post_page---post_author_info--70f1d0e912f2---------------------------------------)

Follow

[**Written by Abhishek Mittal**](https://theonlymittal.medium.com/?source=post_page---post_author_info--70f1d0e912f2---------------------------------------)

[6 followers](https://theonlymittal.medium.com/followers?source=post_page---post_author_info--70f1d0e912f2---------------------------------------)

· [14 following](https://theonlymittal.medium.com/following?source=post_page---post_author_info--70f1d0e912f2---------------------------------------)

Follow

## No responses yet

![](https://miro.medium.com/v2/resize:fill:32:32/1*dmbNkD5D-u45r44go_cf0g.png)

Write a response

[What are your thoughts?](https://medium.com/m/signin?operation=register&redirect=https%3A%2F%2Ftheonlymittal.medium.com%2Fbmad-fundamentals-70f1d0e912f2&source=---post_responses--70f1d0e912f2---------------------respond_sidebar------------------)

Cancel

Respond

## More from Abhishek Mittal

![BMAD Comparisons & Expansion Packs](https://miro.medium.com/v2/resize:fit:679/format:webp/1*2Bdux3wKdjbs4dbMpg---Q.jpeg)

[![Abhishek Mittal](https://miro.medium.com/v2/resize:fill:20:20/1*9MV_rja6E8e8ehDTnhCj0w.jpeg)](https://theonlymittal.medium.com/?source=post_page---author_recirc--70f1d0e912f2----0---------------------7ffe0d12_fa43_461b_aa16_f3a4978cc547--------------)

[Abhishek Mittal](https://theonlymittal.medium.com/?source=post_page---author_recirc--70f1d0e912f2----0---------------------7ffe0d12_fa43_461b_aa16_f3a4978cc547--------------)

[**BMAD Comparisons & Expansion Packs**\\
\\
**Compare BMAD to CrewAI, LangGraph, MetaGPT, and raw Cursor Rules. Learn the decision framework for choosing between them. Build your first…**](https://theonlymittal.medium.com/bmad-comparisons-expansion-packs-7961f6d9ddc0?source=post_page---author_recirc--70f1d0e912f2----0---------------------7ffe0d12_fa43_461b_aa16_f3a4978cc547--------------)

2d ago

![BMAD Method: Agile AI-Driven Development](https://miro.medium.com/v2/resize:fit:679/format:webp/1*xk0ItVOJ2Vz6n97DuPlJhQ.jpeg)

[![Abhishek Mittal](https://miro.medium.com/v2/resize:fill:20:20/1*9MV_rja6E8e8ehDTnhCj0w.jpeg)](https://theonlymittal.medium.com/?source=post_page---author_recirc--70f1d0e912f2----1---------------------7ffe0d12_fa43_461b_aa16_f3a4978cc547--------------)

[Abhishek Mittal](https://theonlymittal.medium.com/?source=post_page---author_recirc--70f1d0e912f2----1---------------------7ffe0d12_fa43_461b_aa16_f3a4978cc547--------------)

[**BMAD Method: Agile AI-Driven Development**\\
\\
**Master the Breakthrough Method for Agile AI Driven Development — the framework that transforms AI coding assistants from forgetful chat…**](https://theonlymittal.medium.com/bmad-method-agile-ai-driven-development-2fcb5864af4f?source=post_page---author_recirc--70f1d0e912f2----1---------------------7ffe0d12_fa43_461b_aa16_f3a4978cc547--------------)

4d ago

[A clap icon2](https://theonlymittal.medium.com/bmad-method-agile-ai-driven-development-2fcb5864af4f?source=post_page---author_recirc--70f1d0e912f2----1---------------------7ffe0d12_fa43_461b_aa16_f3a4978cc547--------------)

![Minimalistic Tools for Developer Documentation](https://miro.medium.com/v2/resize:fit:679/format:webp/0*qQmW2FR5NI2juHJg.jpg)

[![Abhishek Mittal](https://miro.medium.com/v2/resize:fill:20:20/1*9MV_rja6E8e8ehDTnhCj0w.jpeg)](https://theonlymittal.medium.com/?source=post_page---author_recirc--70f1d0e912f2----2---------------------7ffe0d12_fa43_461b_aa16_f3a4978cc547--------------)

[Abhishek Mittal](https://theonlymittal.medium.com/?source=post_page---author_recirc--70f1d0e912f2----2---------------------7ffe0d12_fa43_461b_aa16_f3a4978cc547--------------)

[**Minimalistic Tools for Developer Documentation**\\
\\
**Writing documentation doesn’t have to be overwhelming. Developers thrive on tools that are lightweight, effective, and tailored to their…**](https://theonlymittal.medium.com/minimalistic-tools-for-developer-documentation-8babc0e2c0d9?source=post_page---author_recirc--70f1d0e912f2----2---------------------7ffe0d12_fa43_461b_aa16_f3a4978cc547--------------)

Jan 6, 2025

![Tools and Platforms for Smarter Documentation Management](https://miro.medium.com/v2/resize:fit:679/format:webp/1*J7CfPRCPMB5_PSW7MBUx-Q.png)

[![Abhishek Mittal](https://miro.medium.com/v2/resize:fill:20:20/1*9MV_rja6E8e8ehDTnhCj0w.jpeg)](https://theonlymittal.medium.com/?source=post_page---author_recirc--70f1d0e912f2----3---------------------7ffe0d12_fa43_461b_aa16_f3a4978cc547--------------)

[Abhishek Mittal](https://theonlymittal.medium.com/?source=post_page---author_recirc--70f1d0e912f2----3---------------------7ffe0d12_fa43_461b_aa16_f3a4978cc547--------------)

[**Tools and Platforms for Smarter Documentation Management**\\
\\
**Documentation is the backbone of any successful project, yet keeping it relevant and up-to-date can feel like an uphill battle. As…**](https://theonlymittal.medium.com/tools-and-platforms-for-smarter-documentation-management-defa283bb477?source=post_page---author_recirc--70f1d0e912f2----3---------------------7ffe0d12_fa43_461b_aa16_f3a4978cc547--------------)

Jan 5, 2025

[See all from Abhishek Mittal](https://theonlymittal.medium.com/?source=post_page---author_recirc--70f1d0e912f2---------------------------------------)

## Recommended from Medium

![Google Is Quietly Dismantling Everything OpenAI Built](https://miro.medium.com/v2/resize:fit:679/format:webp/1*S6MjGmQYT-jeK8W2RlkSJw.png)

[![Level Up Coding](https://miro.medium.com/v2/resize:fill:20:20/1*5D9oYBd58pyjMkV_5-zXXQ.jpeg)](https://levelup.gitconnected.com/?source=post_page---read_next_recirc--70f1d0e912f2----0---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

In

[Level Up Coding](https://levelup.gitconnected.com/?source=post_page---read_next_recirc--70f1d0e912f2----0---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

by

[Teja Kusireddy](https://medium.com/@teja.kusireddy23?source=post_page---read_next_recirc--70f1d0e912f2----0---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

[**Google Is Quietly Dismantling Everything OpenAI Built**\\
\\
**The most dangerous failure in Silicon Valley isn’t bankruptcy. It’s becoming the engine inside someone else’s car.**](https://medium.com/@teja.kusireddy23/google-is-quietly-dismantling-everything-openai-built-4edc406f572d?source=post_page---read_next_recirc--70f1d0e912f2----0---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

Feb 17

[A clap icon3.8K\\
\\
A response icon128](https://medium.com/@teja.kusireddy23/google-is-quietly-dismantling-everything-openai-built-4edc406f572d?source=post_page---read_next_recirc--70f1d0e912f2----0---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

![Why Thousands Are Buying Mac Minis to Escape Issues with Big Tech AI Subscriptions Forever |…](https://miro.medium.com/v2/resize:fit:679/format:webp/1*YZcveDctIOQ2Zsf2z2_Ztg.png)

[![CodeX](https://miro.medium.com/v2/resize:fill:20:20/1*VqH0bOrfjeUkznphIC7KBg.png)](https://medium.com/codex?source=post_page---read_next_recirc--70f1d0e912f2----1---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

In

[CodeX](https://medium.com/codex?source=post_page---read_next_recirc--70f1d0e912f2----1---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

by

[MayhemCode](https://medium.com/@mayhemcode?source=post_page---read_next_recirc--70f1d0e912f2----1---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

[**Why Thousands Are Buying Mac Minis to Escape Issues with Big Tech AI Subscriptions Forever \|…**\\
\\
**Something strange happened in early 2026. Apple stores started running low on Mac Minis. Tech forums exploded with setup guides. Developers…**](https://medium.com/@mayhemcode/why-thousands-are-buying-mac-minis-to-escape-big-tech-ai-subscriptions-forever-clawdbot-10c970c72404?source=post_page---read_next_recirc--70f1d0e912f2----1---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

Feb 15

[A clap icon3.1K\\
\\
A response icon53](https://medium.com/@mayhemcode/why-thousands-are-buying-mac-minis-to-escape-big-tech-ai-subscriptions-forever-clawdbot-10c970c72404?source=post_page---read_next_recirc--70f1d0e912f2----1---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

![Anthropic Automatic Prompt Caching](https://miro.medium.com/v2/resize:fit:679/format:webp/1*Z1M5NtDMC8udF7MvxGIKpQ.png)

[![AI Software Engineer](https://miro.medium.com/v2/resize:fill:20:20/1*RZVWENvZRwVijHDlg5hw7w.png)](https://medium.com/ai-software-engineer?source=post_page---read_next_recirc--70f1d0e912f2----0---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

In

[AI Software Engineer](https://medium.com/ai-software-engineer?source=post_page---read_next_recirc--70f1d0e912f2----0---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

by

[Joe Njenga](https://medium.com/@joe.njenga?source=post_page---read_next_recirc--70f1d0e912f2----0---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

[**Anthropic Just Fixed the Biggest Hidden Cost in AI Agents (Automatic Prompt Caching)**\\
\\
**With just one change, you can cut Claude API costs to 10 cents on the dollar and stop bleeding cash on every single API call.**](https://medium.com/@joe.njenga/anthropic-just-fixed-the-biggest-hidden-cost-in-ai-agents-using-automatic-prompt-caching-9d47c95903c5?source=post_page---read_next_recirc--70f1d0e912f2----0---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

Feb 19

[A clap icon706\\
\\
A response icon14](https://medium.com/@joe.njenga/anthropic-just-fixed-the-biggest-hidden-cost-in-ai-agents-using-automatic-prompt-caching-9d47c95903c5?source=post_page---read_next_recirc--70f1d0e912f2----0---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

![Top 7 MCP for Product Designers](https://miro.medium.com/v2/resize:fit:679/format:webp/1*kSl7ovbIG_YsaRJisH3UMg.png)

[![UX Planet](https://miro.medium.com/v2/resize:fill:20:20/1*A0FnBy5FBoVQC02SZXLXPg.png)](https://uxplanet.org/?source=post_page---read_next_recirc--70f1d0e912f2----1---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

In

[UX Planet](https://uxplanet.org/?source=post_page---read_next_recirc--70f1d0e912f2----1---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

by

[Nick Babich](https://medium.com/@101?source=post_page---read_next_recirc--70f1d0e912f2----1---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

[**Top 7 MCP for Product Designers**\\
\\
**Model Context Protocol (MCP) is a technology that enables AI models to connect with external tools and data sources (such as GitHub, Slack…**](https://medium.com/@101/top-7-mcp-for-product-designers-4bd77f4e281c?source=post_page---read_next_recirc--70f1d0e912f2----1---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

Feb 17

[A clap icon413\\
\\
A response icon3](https://medium.com/@101/top-7-mcp-for-product-designers-4bd77f4e281c?source=post_page---read_next_recirc--70f1d0e912f2----1---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

![Screenshot of a desktop with the Cursor application open](https://miro.medium.com/v2/resize:fit:679/format:webp/0*7x-LQAg1xBmi-L1p)

[![Jacob Bennett](https://miro.medium.com/v2/resize:fill:20:20/1*abnkL8PKTea5iO2Cm5H-Zg.png)](https://jacob.blog/?source=post_page---read_next_recirc--70f1d0e912f2----2---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

[Jacob Bennett](https://jacob.blog/?source=post_page---read_next_recirc--70f1d0e912f2----2---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

[**The 5 paid subscriptions I actually use in 2026 as a Staff Software Engineer**\\
\\
**Tools I use that are (usually) cheaper than Netflix**](https://jacob.blog/the-5-paid-subscriptions-i-actually-use-in-2026-as-a-staff-software-engineer-b4261c2e1012?source=post_page---read_next_recirc--70f1d0e912f2----2---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

Jan 18

[A clap icon3.4K\\
\\
A response icon85](https://jacob.blog/the-5-paid-subscriptions-i-actually-use-in-2026-as-a-staff-software-engineer-b4261c2e1012?source=post_page---read_next_recirc--70f1d0e912f2----2---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

![Stop Memorizing Design Patterns: Use This Decision Tree Instead](https://miro.medium.com/v2/resize:fit:679/format:webp/1*xfboC-sVIT2hzWkgQZT_7w.png)

[![Women in Technology](https://miro.medium.com/v2/resize:fill:20:20/1*kd0DvPkLdn59Emtg_rnsqg.png)](https://medium.com/womenintechnology?source=post_page---read_next_recirc--70f1d0e912f2----3---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

In

[Women in Technology](https://medium.com/womenintechnology?source=post_page---read_next_recirc--70f1d0e912f2----3---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

by

[Alina Kovtun✨](https://medium.com/@akovtun?source=post_page---read_next_recirc--70f1d0e912f2----3---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

[**Stop Memorizing Design Patterns: Use This Decision Tree Instead**\\
\\
**Choose design patterns based on pain points: apply the right pattern with minimal over-engineering in any OO language.**](https://medium.com/@akovtun/stop-memorizing-design-patterns-use-this-decision-tree-instead-e84f22fca9fa?source=post_page---read_next_recirc--70f1d0e912f2----3---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

Jan 29

[A clap icon5K\\
\\
A response icon42](https://medium.com/@akovtun/stop-memorizing-design-patterns-use-this-decision-tree-instead-e84f22fca9fa?source=post_page---read_next_recirc--70f1d0e912f2----3---------------------9327a64b_0ecb_4c93_bf8f_93fb2df6a74e--------------)

[See more recommendations](https://medium.com/?source=post_page---read_next_recirc--70f1d0e912f2---------------------------------------)

[Help](https://help.medium.com/hc/en-us?source=post_page-----70f1d0e912f2---------------------------------------)

[Status](https://status.medium.com/?source=post_page-----70f1d0e912f2---------------------------------------)

[About](https://medium.com/about?autoplay=1&source=post_page-----70f1d0e912f2---------------------------------------)

[Careers](https://medium.com/jobs-at-medium/work-at-medium-959d1a85284e?source=post_page-----70f1d0e912f2---------------------------------------)

[Press](mailto:pressinquiries@medium.com)

[Blog](https://blog.medium.com/?source=post_page-----70f1d0e912f2---------------------------------------)

[Privacy](https://policy.medium.com/medium-privacy-policy-f03bf92035c9?source=post_page-----70f1d0e912f2---------------------------------------)

[Rules](https://policy.medium.com/medium-rules-30e5502c4eb4?source=post_page-----70f1d0e912f2---------------------------------------)

[Terms](https://policy.medium.com/medium-terms-of-service-9db0094a1e0f?source=post_page-----70f1d0e912f2---------------------------------------)

[Text to speech](https://speechify.com/medium?source=post_page-----70f1d0e912f2---------------------------------------)

reCAPTCHA