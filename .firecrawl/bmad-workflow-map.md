⚡ Workflow Map V6

# BMad Method

Context engineering for AI-powered development

→ arrows show artifact flow between workflows

1

Analysis

Optional

brainstormopt

M

Mary

brainstorming-report.md

researchopt

M

Mary

findings

create-product-brief

M

Mary

product-brief.md →

→

2

Planning

create-prd

J

John

PRD.md →

Has UI?

create-ux-designif yes

S

Sally

ux-spec.md →

→

3

Solutioning

create-architecture

W

Winston

architecture.md →

create-epics-and-stories

J

John

epics.md →

check-implementation-readiness

J

John

gate check

→

4

Implementation

sprint-planning

B

Bob

sprint-status.yaml →

create-story

B

Bob

story-\[slug\].md →

dev-story

A

Amelia

code →

code-review

A

Amelia

approve

correct-coursead-hoc

J

John

updated plan

retrospectiveper epic

B

Bob

lessons

⚡

## Quick Flow (Parallel Track)

For small, well-understood changes — skip phases 1-3

B

Barry

`quick-spec`

→ tech-spec.md

→

B

Barry

`quick-dev`

→ working code

📚 Context Flow

Each document becomes context for the next phase.

`create-story`loads epics, PRD, architecture, UX`dev-story`loads story file`code-review`loads architecture, story`quick-dev`loads tech-spec

Analysis

Planning

Solutioning

Implementation

Quick Flow