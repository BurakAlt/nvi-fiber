[BuildMode](https://buildmode.dev/)

[Home](https://buildmode.dev/) [About](https://buildmode.dev/about)

![BMad Method in Action: Your Complete Implementation Guide (Part 2)](https://buildmode.dev/bmad-implementation-hero.svg)

# BMad Method in Action: Your Complete Implementation Guide (Part 2)

Jul 26, 2025

In [Part 1](https://buildmode.dev/blog/mastering-bmad-method-2025/bmad-method-deep-dive), I shared my discovery story and explained why traditional AI development is broken. If you haven’t read it yet, I recommend starting there for the full context. 📚

Now let’s get practical. **This guide will show you exactly how to implement BMad Method in your development process.** We’ll walk through complete workflows, real examples, and everything you need to transform chaotic AI development into systematic success. 🚀

## Setting Up BMad Method ⚙️

_Skip this if you’ve already read Part 1 - let’s jump straight into the implementation! 🚀_

### Quick Start: Web UI Approach ⚡

The fastest way to experience BMad is through the web UI approach. Here’s exactly how to set it up:

**Step 1: Get the Team Bundle** 📦

1. Go to the [BMad Method repository](https://github.com/bmadcode/BMAD-METHOD/)
2. Navigate to `dist/teams/`
3. Download `team-fullstack.txt` (or whichever matches your project type)

**Step 2: Create Your AI Workspace** 💻

- **For Claude**: Create a new project and upload the team file as project knowledge 🤖
- **For ChatGPT**: Create a custom GPT and upload the file with instructions: “Your critical operating instructions are attached, do not break character as directed” 💬
- **For Gemini**: Create a new Gem and upload the file 💎

**Step 3: Initialize Your First Project** 🚀
Start with this exact prompt:

```
*help
```

This will show you all available agents and commands. You’re now ready to begin! 🎉

## The Complete BMad Workflow 🔄

BMad Method follows a systematic two-phase approach. Let me walk you through the complete workflow with a real example. 📊

### Phase 1: Strategic Planning (Web UI Recommended) 💰

This phase creates the foundation documents that guide everything else. Use the web UI with large context models (Gemini, Claude, or GPT-4) for cost-effectiveness. 🧠

#### Step 1: Project Analysis 🔍

**Agent**: Analyst 👨‍💼

**Command**: `*analyst`

**Goal**: Create comprehensive project brief 📊

**Example session**:

```
*analyst

I want to build a goal and task management app called "Steps" that helps users break big life goals into achievable milestones and manageable daily steps. It should help active professionals and Gen Z users regain control over their calendars and achieve work-life balance.
```

The Analyst will ask probing questions like:

- “Who is your target user? Active professionals aged 30-40 or goal-oriented Gen Z users?” 🤔
- “What specific pain points are you solving that existing productivity apps don’t?” 🎯
- “What does success look like in 6 months? How will users’ lives improve?” 📈
- “What’s your competitive landscape in the productivity space?” 🏁

**Expected output**: A comprehensive project brief (10-15 pages) that includes market analysis, user personas, competitive insights, and success criteria. 🏆

#### Step 2: Requirements Engineering 📋

**Agent**: PM (Product Manager) 👨‍💼

**Command**: `*pm`

**Goal**: Transform brief into detailed PRD 📝

**Example session**:

```
*agent pm

Create a comprehensive PRD from our project brief for the Steps goal management app.
```

The PM agent will:

- Convert your brief into structured requirements 📊
- Create detailed user stories with acceptance criteria 📖
- Define functional and non-functional requirements ⚙️
- Break down epics and features 📦
- Establish success metrics 🎯

**Expected output**: A detailed PRD (15-25 pages) with user stories, requirements, acceptance criteria, and epic breakdown. 📚

#### Step 3: System Architecture 🏗️

**Agent**: Architect 👷

**Command**: `*architect`

**Goal**: Design technical implementation 📊

**Example session**:

```
*agent architect

Design the system architecture for our Steps app based on the PRD. Focus on the Goals → Milestones → Steps hierarchy, user authentication, and a scalable SvelteKit + FastAPI architecture.
```

The Architect will create:

- Database schema with relationships 📊
- API specifications 🔌
- Security architecture 🔒
- Component hierarchy 🏠
- Technology stack recommendations 🛠️
- Deployment strategy 🚀

**Expected output**: Complete architecture document (10-20 pages) with diagrams, specifications, and implementation guidelines. 📑

#### Step 4: Validation & Alignment ✅

**Agent**: PO (Product Owner) 👨‍💼

**Command**: `*po`

**Goal**: Ensure consistency and feasibility 🎯

**Example session**:

```
*agent po

Run the master checklist to validate alignment between our PRD and Architecture documents.
```

The PO will:

- Verify PRD and Architecture alignment 🔗
- Identify potential issues or gaps 🔍
- Suggest optimizations ✨
- Validate feasibility 🎯

**Expected output**: Validation report with any issues identified and recommendations for fixes. 📈

#### **Phase 3: Architecture Design**

The **Architect** agent took over:

```
*agent architect
Design system architecture from our PRD, focusing on the Steps Method hierarchy and user goal management
```

What emerged was a **comprehensive architecture document** that included:

- **System diagrams** showing Goals → Milestones → Steps data flow
- **Security architecture** with JWT authentication and secure user data
- **API design** with REST endpoints for goal management
- **Database design** with user goals, milestones, and daily steps
- **Deployment architecture** with SvelteKit frontend and FastAPI backend
- **User experience strategy** for the Steps Method onboarding

But here’s the crucial part: the Architect didn’t just create pretty diagrams. It created **executable context** with specific technology choices, security patterns, and implementation guidelines that the Dev agent could follow directly.

#### **Phase 4: Document Sharding & Development Prep**

Before jumping into code, I used the **PO** agent to “shard” the documents:

```
*agent po
Shard our PRD and Architecture documents for development workflow
```

This broke down the massive planning documents into focused, actionable pieces:

- **Epic files** with specific user stories
- **Architecture components** focused on individual services
- **Coding standards** and patterns to follow
- **Security requirements** for each component

#### **Phase 5: Story-Driven Development**

Now came the magic. Instead of staring at a blank code editor wondering where to start, I had the **SM (Scrum Master)** agent create detailed stories:

```
*agent sm
Create the next development story from Epic 1
```

The SM created a story that included:

- **Complete context** from the architecture decisions
- **Specific implementation tasks** with acceptance criteria
- **Security requirements** for this specific feature
- **Testing requirements** and edge cases to consider
- **Dependencies** and integration points

#### **Phase 6: Context-Rich Implementation**

Finally, the **Dev** agent took over:

```
*agent dev
Implement the user authentication story
```

But here’s what made this different from normal AI coding: the Dev agent had **complete context**. It knew:

- Why we chose JWT tokens over sessions (architectural decision)
- How to implement HIPAA-compliant logging (security requirement)
- Which encryption standards to use (compliance requirement)
- How to integrate with our specific OAuth provider (technical specification)

The result? **Production-ready code that followed all our architectural decisions without me having to explain them again**.

### **The Results Spoke for Themselves**

- **Planning time**: 6 hours vs. my usual 2-3 weeks of gradual requirements discovery
- **Architecture consistency**: 100% alignment between design and implementation
- **Technical debt**: Virtually zero, because every decision was documented
- **Client confidence**: Through the roof, because they could see our complete thinking process
- **Development speed**: 3x faster than my typical project timeline
- **Code quality**: Higher than anything I’d produced manually

## The Deep Dive: How BMad Actually Works 🔧

Let me pull back the curtain and show you exactly how this framework operates under the hood.

### **The Agent Architecture**

Each BMad agent isn’t just a personality—it’s a complete system with:

**1\. Persona Definition**: Role, style, focus areas, core principles
**2\. Dependencies**: Specific templates, tasks, checklists, and data files
**3\. Workflows**: Prescribed sequences for their domain
**4\. Startup Instructions**: How they initialize and maintain context

Here’s what the Dev agent configuration looks like:

```
agent:
  name: Dev
  role: Senior Full-Stack Developer
  focus: Implementation with architectural alignment

dependencies:
  templates:
    - code-review-template
    - test-strategy-template
  tasks:
    - implement-feature
    - run-validations
  checklists:
    - code-quality-checklist
    - security-checklist
  data:
    - coding-standards
    - tech-stack-preferences
```

When you activate the Dev agent, it doesn’t just pretend to be a developer—it loads specific resources that give it deep expertise in your project’s context.

### **The Context Engine**

This is where BMad gets truly innovative. Traditional AI development relies on you providing context every time. BMad builds **persistent context** through:

**Document Sharding**: Large planning documents get broken into focused, consumable pieces that agents can load as needed.

**Dependency Chains**: When the Dev agent needs to implement authentication, it automatically references the Architect’s security decisions and the PM’s requirements.

**Decision Traceability**: Every choice links back to its original reasoning, so changes propagate correctly through the system.

**Living Documentation**: Documents update automatically as the system evolves.

### **The Template System**

BMad templates aren’t static documents—they’re **interactive workflows**. Each template contains:

- **Structure**: What the final document should look like
- **Processing Logic**: How the AI should work with users to create it
- **Validation Rules**: How to ensure quality and completeness
- **Integration Points**: How it connects to other system components

For example, the PRD template doesn’t just give you a requirements document format—it guides the PM agent through a complete requirements gathering process, asks probing questions, identifies gaps, and ensures consistency with your project brief and architectural constraints.

### **The Workflow Engine**

BMad includes predefined workflows for different project types:

- **Greenfield Full-Stack**: Starting a new application from scratch
- **Brownfield Enhancements**: Adding features to existing systems
- **Service-Only**: Backend API development
- **UI-Focused**: Frontend-heavy projects

Each workflow defines:

- **Agent sequences**: Which agents work when
- **Deliverables**: What artifacts each phase produces
- **Decision points**: When to branch or iterate
- **Quality gates**: How to ensure each phase is complete before proceeding

## Practical Workflows: Your Step-by-Step Guide 📋

Let me give you the exact workflows I use for different project types.

### **Greenfield Project Workflow**

**Phase 1: Strategic Foundation (Web UI Recommended)**

```
1. *analyst
   - Create project brief through guided brainstorming
   - Optional: Market research and competitive analysis

2. *agent pm
   - Generate comprehensive PRD from brief
   - Define epics and initial story breakdown

3. *agent architect
   - Design system architecture from PRD
   - Create technical specifications and constraints

4. *agent po
   - Run master checklist to ensure document alignment
   - Iterate if gaps found
```

**Phase 2: Development Preparation (Switch to IDE)**

```
5. *agent po
   - Shard PRD into focused epic files
   - Shard Architecture into component-specific docs

6. Setup project structure with BMad configuration
```

**Phase 3: Iterative Development**

```
7. *agent sm
   - Create detailed story from next epic
   - Include full context and acceptance criteria

8. *agent dev
   - Implement story with architectural alignment
   - Run all validations (tests, linting, security)

9. *agent qa (optional)
   - Review implementation
   - Suggest improvements and optimizations

10. Repeat steps 7-9 for each story
```

### **Brownfield Enhancement Workflow**

Working with existing codebases requires a different approach:

```
1. *agent analyst
   - Analyze current system architecture
   - Identify integration points and constraints

2. *agent architect
   - Review existing codebase
   - Design enhancement that fits current patterns

3. *agent sm
   - Create brownfield-specific stories
   - Account for legacy code and migration needs

4. *agent dev
   - Implement with minimal disruption
   - Follow existing code patterns and standards
```

### **Advanced Techniques I’ve Discovered**

**Context Layering**: Load multiple architecture documents for complex integrations

```
*agent dev
Load both our goal management architecture and the Steps Method hierarchy documentation before implementing the milestone completion feature
```

**Cross-Agent Collaboration**: Have agents review each other’s work

```
*agent architect
Review the Dev agent's implementation of the authentication system against our security requirements
```

**Iterative Refinement**: Use QA agent as a senior developer reviewer

```
*agent qa
Perform a comprehensive code review of the user management module, focusing on security and maintainability
```

## The Economics of BMad Development 💰

Let’s talk numbers, because this stuff matters:

### **Time Investment**

- **Learning curve**: 1-2 weeks to understand the methodology
- **Setup per project**: 30 minutes (vs. hours of manual configuration)
- **Planning phase**: 4-8 hours (vs. weeks of gradual discovery)
- **Development**: 2-3x faster than traditional development
- **Documentation**: Essentially zero extra time (it’s built into the process)

### **Quality Improvements**

- **Architectural consistency**: Near 100% (vs. my previous ~60%)
- **Requirements coverage**: Complete from day one
- **Technical debt**: Minimal, because decisions are documented
- **Code review time**: Reduced by 70% due to consistent patterns
- **Bug discovery**: Earlier in the process, cheaper to fix

### **Cost Breakdown**

For a typical medium-complexity project:

**Traditional Approach:**

- Planning: 40 hours @ $150/hr = $6,000
- Development: 200 hours @ $150/hr = $30,000
- Refactoring/Debugging: 60 hours @ $150/hr = $9,000
- Documentation: 20 hours @ $150/hr = $3,000
- **Total: $48,000**

**BMad Method Approach:**

- Planning: 8 hours @ $150/hr = $1,200
- Development: 120 hours @ $150/hr = $18,000
- Refactoring: 10 hours @ $150/hr = $1,500
- Documentation: 0 hours (built-in)
- **Total: $20,700**

**Savings: $27,300 (57% reduction)**

But the real value isn’t just cost—it’s the **predictability and quality** that come from systematic approaches.

## Beyond Software: The Expansion Pack Ecosystem 🚀

Here’s where BMad gets really exciting: it’s not just for software development. The framework is domain-agnostic, which means you can create “expansion packs” for any field.

### **Game Development Pack**

I’ve been experimenting with the 2D Unity Game Development expansion:

- **Game Designer**: Mechanics, progression systems, player psychology
- **Game Developer**: Unity-specific implementation patterns
- **Game SM**: Story creation focused on game features and levels

The templates include game design documents, level design specifications, and character development frameworks.

### **Infrastructure & DevOps Pack**

For platform engineering projects:

- **Infra-DevOps Platform Agent**: Specialized in cloud architecture, CI/CD, monitoring
- **Infrastructure templates**: Terraform patterns, monitoring dashboards, deployment strategies
- **DevOps workflows**: From infrastructure planning to production deployment

### **Creative Writing Pack** (Theoretical, but possible)

Imagine agents for:

- **Story Analyst**: Character development, plot structure, market research
- **Editor**: Grammar, style, pacing feedback
- **Publishing Manager**: Marketing strategy, publication planning

## The Learning Curve: What to Expect 📚

Let me be honest about the journey:

### **Week 1: Overwhelming but Exciting**

- **Challenge**: Understanding the agent system and workflows
- **Solution**: Start with simple projects, follow the user guide exactly
- **Tip**: Use the web UI first—it’s more forgiving than IDE setup

### **Week 2: First Success**

- **Milestone**: Complete your first small project end-to-end
- **Focus**: Don’t customize anything yet, just follow the standard workflows
- **Win**: Experience the magic of context-driven development

### **Month 1: Finding Your Rhythm**

- **Development**: Start adapting workflows to your specific needs
- **Customization**: Begin modifying templates and checklists
- **Confidence**: Trust the process even when it feels like “too much planning”

### **Month 2: Mastery Emerging**

- **Advanced techniques**: Cross-agent collaboration, complex context layering
- **Custom expansions**: Maybe create your first domain-specific agents
- **Teaching others**: You’ll start evangelizing the methodology

## Common Pitfalls and How I Avoided Them ⚠️

### **Pitfall \#1: Skipping the Planning Phase**

**What I did wrong**: Tried to jump straight to the Dev agent
**Why it failed**: No context means generic, unhelpful responses
**Solution**: Always do Analyst → PM → Architect → PO before development

### **Pitfall \#2: Over-Customizing Too Early**

**What I did wrong**: Started modifying templates before understanding them
**Why it failed**: Broke the carefully designed workflows
**Solution**: Use standard templates for at least 3 projects before customizing

### **Pitfall \#3: Not Trusting the Process**

**What I did wrong**: Felt like document sharding was “wasted time”
**Why it failed**: Ended up with context loss and confusion during development
**Solution**: Trust that planning time pays dividends during implementation

### **Pitfall \#4: Using Wrong Agents for Tasks**

**What I did wrong**: Asked the Dev agent to create requirements
**Why it failed**: Each agent is specialized for specific domains
**Solution**: Use the right agent for each task—the orchestrator helps with this

## Advanced BMad Techniques 🎓

Once you’ve mastered the basics, here are advanced techniques I’ve developed:

### **Context Stacking**

For complex features that touch multiple system areas:

```
*agent dev
Before implementing the Dynamic Priority Assistant, load:
1. Our Goals → Milestones → Steps hierarchy architecture
2. The user authentication patterns
3. The daily task prioritization logic
4. The goal completion tracking requirements

Then implement the intelligent daily task prioritization feature
```

### **Cross-Project Learning**

Create a “lessons learned” knowledge base that agents can reference:

```
customTechnicalDocuments:
  - lessons-learned/api-design-patterns.md
  - lessons-learned/database-optimization.md
  - lessons-learned/security-incidents.md
```

### **Agent Specialization**

Customize agents for your specific technology stack:

```
agent:
  customization: |
    You are specialized in React + TypeScript + Tailwind CSS applications.
    Always prefer functional components with hooks.
    Use Zustand for state management.
    Follow our established component patterns in /src/components/common/
```

### **Workflow Branching**

Create decision trees in your workflows:

```
decision-points:
  - condition: "Is this a user-facing feature?"
    true: "Include UX Expert review"
    false: "Proceed to implementation"
  - condition: "Does this affect data models?"
    true: "Include database migration planning"
    false: "Skip data layer changes"
```

## The Future I See Coming 🔮

BMad Method represents something bigger than just a development framework—it’s a glimpse into the future of knowledge work.

### **AI Teams, Not AI Tools**

We’re moving from “AI that helps me code” to “AI team members with specialized expertise.” BMad is pioneering what I think will become the standard: **persistent, context-aware AI agents** that maintain expertise and memory across projects.

### **Context as Competitive Advantage**

Companies that master context engineering will build faster, more consistently, and with higher quality. The ability to maintain and transfer knowledge through AI systems will become a core competitive differentiator.

### **Domain Expansion**

Software development is just the beginning. I’m already seeing possibilities for:

- **Legal document generation** with specialized legal agents
- **Scientific research** with domain expert agents
- **Goal achievement coaching** with specialized productivity agents
- **Education** with personalized tutor agents

### **Human-AI Collaboration Evolution**

The role of humans is shifting from “doing the work” to “directing the work and ensuring quality.” BMad teaches us how to be effective AI orchestrators rather than just AI users.

## Getting Started: Your Action Plan 🎯

Ready to transform your development process? Here’s your step-by-step plan:

### **Phase 1: Foundation (Week 1)**

1. **Install BMad Method** in a new project directory:


```
npx bmad-method install
```

2. **Start with Web UI** for your first project:
   - Save the [team-fullstack.txt](https://github.com/bmadcode/BMAD-METHOD/blob/main/dist/teams/team-fullstack.txt) file
   - Create a new Gemini Gem or CustomGPT
   - Upload the file with instructions: “Your critical operating instructions are attached, do not break character as directed”
3. **Pick a simple project** (don’t start with your most complex system)

4. **Follow the standard workflow** exactly—no customization yet


### **Phase 2: First Success (Week 2)**

1. **Complete a full cycle**: Analyst → PM → Architect → PO → SM → Dev
2. **Document your experience**: What felt weird? What was surprisingly good?
3. **Compare results** to your usual development process

### **Phase 3: Skill Building (Month 1)**

1. **Try different project types**: Greenfield, brownfield, UI-focused, API-focused
2. **Experiment with different agents**: See how QA agent reviews differ from Dev agent implementations
3. **Start customizing templates**: Add your company’s specific requirements

### **Phase 4: Mastery Path (Month 2+)**

1. **Create your first expansion pack** for your specific domain
2. **Develop advanced workflows** for your common project patterns
3. **Share your experience** and help others adopt the methodology

## The Bottom Line: Why This Matters 🚨

I’ve been developing software professionally for over a decade. I’ve tried every methodology, framework, and productivity hack out there. **BMad Method is the first approach that fundamentally changed how I think about software development**.

It’s not just about AI assistance—it’s about **systematic thinking, context preservation, and collaborative intelligence**. It’s about building software the way we always should have: with clear requirements, thoughtful architecture, and consistent execution.

The future of development isn’t about replacing developers with AI. It’s about **augmenting human creativity and expertise with AI capabilities**. BMad Method shows us how to do that effectively, systematically, and at scale.

### **Three Key Takeaways**

1. **Context is everything**: The difference between generic AI help and transformative AI collaboration is persistent, structured context.

2. **Specialization matters**: Different phases of development need different types of AI expertise. One-size-fits-all AI assistants are already obsolete.

3. **Process amplifies capability**: Good methodology + AI agents creates exponential improvements over ad-hoc AI usage.


## What’s Next for You? 🔄

If you’ve read this far, you’re already thinking about how BMad Method could transform your development process. Here’s my challenge to you:

**Pick one small project—maybe a simple CRUD app or a utility tool you’ve been meaning to build. Spend the 30 minutes to set up BMad Method and follow the workflow exactly. Don’t skip the planning phase. Don’t customize anything yet. Just experience what systematic, AI-assisted development feels like.**

I guarantee it will change how you think about building software.

The tools and methodologies I’ve described aren’t experimental anymore—they’re production-ready and battle-tested. The question isn’t whether this approach will become mainstream. The question is whether you’ll be ahead of the curve or scrambling to catch up.

**Welcome to the future of development. It’s collaborative, it’s systematic, and it’s already here.** 🚀

* * *

_P.S. - I’m documenting my ongoing experiments with BMad Method and AI-assisted development. If you try this approach, I’d love to hear about your experience at [hello@buildmode.dev](mailto:hello@buildmode.dev). The learning curve is real, but the transformation is worth it._

_P.P.S. - The BMad Method framework is open source and actively developed. The community around it is growing fast, and the expansion pack ecosystem is just getting started. Jump in now while you can still help shape its evolution._

[Back to home](https://buildmode.dev/)