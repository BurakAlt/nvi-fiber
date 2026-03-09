⚠️

**Security Update**: Classic tokens have been revoked. Granular tokens are now limited to 90 days and require 2FA by default. Update your CI/CD workflows to avoid disruption. [Learn more](https://gh.io/all-npm-classic-tokens-revoked).

×

# @jonahschulte/bmad-method

6.2.0-Beta.1 • Public • Published a month ago

- [Readme](https://www.npmjs.com/package/@jonahschulte/bmad-method?activeTab=readme)
- [Code Beta](https://www.npmjs.com/package/@jonahschulte/bmad-method?activeTab=code)
- [17 Dependencies](https://www.npmjs.com/package/@jonahschulte/bmad-method?activeTab=dependencies)
- [0 Dependents](https://www.npmjs.com/package/@jonahschulte/bmad-method?activeTab=dependents)
- [27 Versions](https://www.npmjs.com/package/@jonahschulte/bmad-method?activeTab=versions)

[![BMad Method](https://raw.githubusercontent.com/jschulte/BMAD-METHOD/HEAD/banner-bmad-method.png)](https://github.com/jschulte/BMAD-METHOD/blob/HEAD/banner-bmad-method.png)

[![Version](https://img.shields.io/npm/v/bmad-method?color=blue&label=version)](https://www.npmjs.com/package/bmad-method)[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/jschulte/BMAD-METHOD/blob/HEAD/LICENSE)[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)[![Discord](https://img.shields.io/badge/Discord-Join%20Community-7289da?logo=discord&logoColor=white)](https://discord.gg/gk8jAdXWmj)

**Breakthrough Method of Agile AI Driven Development** — An AI-driven agile development framework with 21 specialized agents, 50+ guided workflows, and scale-adaptive intelligence that adjusts from bug fixes to enterprise systems.

**100% free and open source.** No paywalls. No gated content. No gated Discord. We believe in empowering everyone, not just those who can pay.

## Why BMad?

[Permalink: Why BMad?](https://www.npmjs.com/package/@jonahschulte/bmad-method?activeTab=code#why-bmad)

Traditional AI tools do the thinking for you, producing average results. BMad agents and facilitated workflow act as expert collaborators who guide you through a structured process to bring out your best thinking in partnership with the AI.

- **AI Intelligent Help**: Brand new for beta - AI assisted help will guide you from the beginning to the end - just ask for `/bmad-help` after you have installed BMad to your project
- **Scale-Domain-Adaptive**: Automatically adjusts planning depth and needs based on project complexity, domain and type - a SaaS Mobile Dating App has different planning needs from a diagnostic medical system, BMad adapts and helps you along the way
- **Structured Workflows**: Grounded in agile best practices across analysis, planning, architecture, and implementation
- **Specialized Agents**: 12+ domain experts (PM, Architect, Developer, UX, Scrum Master, and more)
- **Party Mode**: Bring multiple agent personas into one session to plan, troubleshoot, or discuss your project collaboratively, multiple perspectives with maximum fun
- **Complete Lifecycle**: From brainstorming to deployment, BMad is there with you every step of the way

## Quick Start

[Permalink: Quick Start](https://www.npmjs.com/package/@jonahschulte/bmad-method?activeTab=code#quick-start)

**Prerequisites**: [Node.js](https://nodejs.org/) v20+

```
npx bmad-method install
```

Follow the installer prompts, then open your AI IDE (Claude Code, Cursor, Windsurf, etc.) in the project folder.

> **Not sure what to do?** Run `/bmad-help` — it tells you exactly what's next and what's optional. You can also ask it questions like:

- `/bmad-help How should I build a web app for my TShirt Business that can scale to millions?`
- `/bmad-help I just finished the architecture, I am not sure what to do next`

And the amazing thing is BMad Help evolves depending on what modules you install also!

- `/bmad-help Im interested in really exploring creative ways to demo BMad at work, what do you recommend to help plan a great slide deck and compelling narrative?`, and if you have the Creative Intelligence Suite installed, it will offer you different or complimentary advice than if you just have BMad Method Module installed!

The workflows below show the fastest path to working code. You can also load agents directly for a more structured process, extensive planning, or to learn about agile development practices — the agents guide you with menus, explanations, and elicitation at each step.

### Simple Path (Quick Flow)

[Permalink: Simple Path (Quick Flow)](https://www.npmjs.com/package/@jonahschulte/bmad-method?activeTab=code#simple-path-quick-flow)

Bug fixes, small features, clear scope — 3 commands - 1 Optional Agent:

1. `/quick-spec` — analyzes your codebase and produces a tech-spec with stories
2. `/dev-story` — implements each story
3. `/code-review` — validates quality

### Full Planning Path (BMad Method)

[Permalink: Full Planning Path (BMad Method)](https://www.npmjs.com/package/@jonahschulte/bmad-method?activeTab=code#full-planning-path-bmad-method)

Products, platforms, complex features — structured planning then build:

1. `/product-brief` — define problem, users, and MVP scope
2. `/create-prd` — full requirements with personas, metrics, and risks
3. `/create-architecture` — technical decisions and system design
4. `/create-epics-and-stories` — break work into prioritized stories
5. `/sprint-planning` — initialize sprint tracking
6. **Repeat per story:**`/create-story` → `/dev-story` → `/code-review`

Every step tells you what's next. Optional phases (brainstorming, research, UX design) are available when you need them — ask `/bmad-help` anytime. For a detailed walkthrough, see the [Getting Started Tutorial](http://docs.bmad-method.org/tutorials/getting-started/).

## Modules

[Permalink: Modules](https://www.npmjs.com/package/@jonahschulte/bmad-method?activeTab=code#modules)

BMad Method extends with official modules for specialized domains. Modules are available during installation and can be added to your project at any time. After the V6 beta period these will also be available as Plugins and Granular Skills.

| Module | GitHub | NPM | Purpose |
| --- | --- | --- | --- |
| **BMad Method (BMM)** | [bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) | [bmad-method](https://www.npmjs.com/package/bmad-method) | Core framework with 34+ workflows across 4 development phases |
| **BMad Builder (BMB)** | [bmad-code-org/bmad-builder](https://github.com/bmad-code-org/bmad-builder) | [bmad-builder](https://www.npmjs.com/package/bmad-builder) | Create custom BMad agents, workflows, and domain-specific modules |
| **Test Architect (TEA)** 🆕 | [bmad-code-org/tea](https://github.com/bmad-code-org/bmad-method-test-architecture-enterprise) | [tea](https://www.npmjs.com/package/bmad-method-test-architecture-enterprise) | Risk-based test strategy, automation, and release gates (8 workflows) |
| **Game Dev Studio (BMGD)** | [bmad-code-org/bmad-module-game-dev-studio](https://github.com/bmad-code-org/bmad-module-game-dev-studio) | [bmad-game-dev-studio](https://www.npmjs.com/package/bmad-game-dev-studio) | Game development workflows for Unity, Unreal, and Godot |
| **Creative Intelligence Suite (CIS)** | [bmad-code-org/bmad-module-creative-intelligence-suite](https://github.com/bmad-code-org/bmad-module-creative-intelligence-suite) | [bmad-creative-intelligence-suite](https://www.npmjs.com/package/bmad-creative-intelligence-suite) | Innovation, brainstorming, design thinking, and problem-solving |

- More modules are coming in the next 2 weeks from BMad Official, and a community marketplace for the installer also will be coming with the final V6 release!

## Testing Agents

[Permalink: Testing Agents](https://www.npmjs.com/package/@jonahschulte/bmad-method?activeTab=code#testing-agents)

BMad provides two testing options to fit your needs:

### Quinn (QA) - Built-in

[Permalink: Quinn (QA) - Built-in](https://www.npmjs.com/package/@jonahschulte/bmad-method?activeTab=code#quinn-qa---built-in)

**Quick test automation for rapid coverage**

- ✅ **Always available** in BMM module (no separate install)
- ✅ **Simple**: One workflow (`QA` \- Automate)
- ✅ **Beginner-friendly**: Standard test framework patterns
- ✅ **Fast**: Generate tests and ship

**Use Quinn for:** Small projects, quick coverage, standard patterns

### Test Architect (TEA) - Optional Module

[Permalink: Test Architect (TEA) - Optional Module](https://www.npmjs.com/package/@jonahschulte/bmad-method?activeTab=code#test-architect-tea---optional-module)

**Enterprise-grade test strategy and quality engineering**

- 🆕 **Standalone module** (install separately)
- 🏗️ **Comprehensive**: 8 workflows covering full test lifecycle
- 🎯 **Advanced**: Risk-based planning, quality gates, NFR assessment
- 📚 **Knowledge-driven**: 34 testing patterns and best practices
- 📖 [Test Architect Documentation](https://bmad-code-org.github.io/bmad-method-test-architecture-enterprise/)

**Use TEA for:** Enterprise projects, test strategy, compliance, release gates

* * *

## Documentation

[Permalink: Documentation](https://www.npmjs.com/package/@jonahschulte/bmad-method?activeTab=code#documentation)

**[BMad Documentation](http://docs.bmad-method.org/)** — Tutorials, how-to guides, concepts, and reference
**[Test Architect Documentation](https://bmad-code-org.github.io/bmad-method-test-architecture-enterprise/)** — TEA standalone module documentation

- [Getting Started Tutorial](http://docs.bmad-method.org/tutorials/getting-started/)
- [Upgrading from Previous Versions](http://docs.bmad-method.org/how-to/upgrade-to-v6/)
- [Test Architect Migration Guide](https://bmad-code-org.github.io/bmad-method-test-architecture-enterprise/migration/) — Upgrading from BMM-embedded TEA

### For v4 Users

[Permalink: For v4 Users](https://www.npmjs.com/package/@jonahschulte/bmad-method?activeTab=code#for-v4-users)

- **[v4 Documentation](https://github.com/bmad-code-org/BMAD-METHOD/tree/V4/docs)**

## Community

[Permalink: Community](https://www.npmjs.com/package/@jonahschulte/bmad-method?activeTab=code#community)

- [Discord](https://discord.gg/gk8jAdXWmj) — Get help, share ideas, collaborate
- [Subscribe on YouTube](https://www.youtube.com/@BMadCode) — Tutorials, master class, and podcast (launching Feb 2025)
- [GitHub Issues](https://github.com/bmad-code-org/BMAD-METHOD/issues) — Bug reports and feature requests
- [Discussions](https://github.com/bmad-code-org/BMAD-METHOD/discussions) — Community conversations

## Support BMad

[Permalink: Support BMad](https://www.npmjs.com/package/@jonahschulte/bmad-method?activeTab=code#support-bmad)

BMad is free for everyone — and always will be. If you'd like to support development:

- ⭐ Please click the star project icon near the top right of this page
- ☕ [Buy Me a Coffee](https://buymeacoffee.com/bmad) — Fuel the development
- 🏢 Corporate sponsorship — DM on Discord
- 🎤 Speaking & Media — Available for conferences, podcasts, interviews (BM on Discord)

## Contributing

[Permalink: Contributing](https://www.npmjs.com/package/@jonahschulte/bmad-method?activeTab=code#contributing)

We welcome contributions! See [CONTRIBUTING.md](https://github.com/jschulte/BMAD-METHOD/blob/HEAD/CONTRIBUTING.md) for guidelines.

## License

[Permalink: License](https://www.npmjs.com/package/@jonahschulte/bmad-method?activeTab=code#license)

MIT License — see [LICENSE](https://github.com/jschulte/BMAD-METHOD/blob/HEAD/LICENSE) for details.

* * *

**BMad** and **BMAD-METHOD** are trademarks of BMad Code, LLC. See [TRADEMARK.md](https://github.com/jschulte/BMAD-METHOD/blob/HEAD/TRADEMARK.md) for details.

[![Contributors](https://contrib.rocks/image?repo=bmad-code-org/BMAD-METHOD)](https://github.com/bmad-code-org/BMAD-METHOD/graphs/contributors)

See [CONTRIBUTORS.md](https://github.com/jschulte/BMAD-METHOD/blob/HEAD/CONTRIBUTORS.md) for contributor information.

## /@jonahschulte/bmad-method/

/@jonahschulte/bmad-method/

| Name | Type | Size |
| --- | --- | --- |
| ![](<Base64-Image-Removed>)<br>.github/ | folder | 23.8 kB |
| ![](<Base64-Image-Removed>)<br>.husky/ | folder | 447 B |
| ![](<Base64-Image-Removed>)<br>.vscode/ | folder | 2.09 kB |
| ![](<Base64-Image-Removed>)<br>docs/ | folder | 70.4 kB |
| ![](<Base64-Image-Removed>)<br>src/ | folder | 1.45 MB |
| ![](<Base64-Image-Removed>)<br>test/ | folder | 71.5 kB |
| ![](<Base64-Image-Removed>)<br>tools/ | folder | 855 kB |
| ![](<Base64-Image-Removed>)<br>website/ | folder | 6.41 MB |
| ![](<Base64-Image-Removed>)<br>.coderabbit.yaml | text/yaml | 1.36 kB |
| ![](<Base64-Image-Removed>)<br>.markdownlint-cli2.yaml | text/yaml | 910 B |
| ![](<Base64-Image-Removed>)<br>.nvmrc | text/plain | 2 B |
| ![](<Base64-Image-Removed>)<br>.prettierignore | text/plain | 206 B |
| ![](<Base64-Image-Removed>)<br>CHANGELOG.md | text/markdown | 69.6 kB |
| ![](<Base64-Image-Removed>)<br>CNAME | text/plain | 20 B |
| ![](<Base64-Image-Removed>)<br>CONTRIBUTING.md | text/markdown | 5.46 kB |
| ![](<Base64-Image-Removed>)<br>CONTRIBUTORS.md | text/markdown | 1.33 kB |
| ![](<Base64-Image-Removed>)<br>LICENSE | text/plain | 1.57 kB |
| ![](<Base64-Image-Removed>)<br>README.md | text/markdown | 10.2 kB |
| ![](<Base64-Image-Removed>)<br>SECURITY.md | text/markdown | 3.2 kB |
| ![](<Base64-Image-Removed>)<br>TRADEMARK.md | text/markdown | 2.81 kB |
| ![](<Base64-Image-Removed>)<br>Wordmark.png | image/png | 23.5 kB |
| ![](<Base64-Image-Removed>)<br>banner-bmad-method.png | image/png | 375 kB |
| ![](<Base64-Image-Removed>)<br>eslint.config.mjs | application/javascript | 4.41 kB |
| ![](<Base64-Image-Removed>)<br>package.json | application/json | 3.82 kB |
| ![](<Base64-Image-Removed>)<br>prettier.config.mjs | application/javascript | 658 B |

Viewing @jonahschulte/bmad-method version 6.2.0-Beta.1