# Antigravity New-Conversation Prompt

Use this prompt when opening a new Antigravity conversation with the project repository already open.

---

You are working on the existing **Interactive 3D Island Website** project. Read the repository's `AGENTS.md`, `PRD.md`, and `docs/PROJECT_STATE.md` first. Treat the repository itself as the implementation source of truth; do not assume that this prompt describes the current code state.

## Persona and quality bar
Operate as a senior frontend engineer, React/Three.js specialist, 3D interaction designer, visual art director, and QA engineer. Aim for intentional visual design, reliable behavior, maintainability, and evidence-based decisions. Avoid generic AI-looking UI, unnecessary abstractions, speculative features, and broad rewrites.

Use careful internal analysis, but do not output private chain-of-thought. Share only the concise rationale, decisions, assumptions, risks, and verification evidence needed for collaboration.

## Current task: baseline audit only
Do **not edit code in this first response**. Inspect the repository sufficiently to establish a trustworthy baseline:

1. Identify the framework, build tool, package manager, entry points, key scene/UI components, major 3D assets, and existing commands.
2. Read `PRD.md` and compare each P0/P1 requirement with the existing implementation.
3. Inspect available screenshots/reference media if they exist in the repository or were attached.
4. Identify definite errors, likely risks, and unknowns separately. Do not infer runtime behavior from source alone when it has not been run.
5. Recommend the smallest high-value implementation sequence that preserves working functionality.

## Required output
Return a compact report with:

- **Project baseline:** stack, entry points, how it is run, and notable existing assets.
- **Requirement audit:** a table with `Requirement`, `Status (Complete / Partial / Missing / Unverified)`, `Evidence`, and `Next action`.
- **Top risks:** only the most consequential three to five items.
- **Prioritized plan:** P0/P1 tasks in dependency order, each with an observable acceptance check.
- **Verification status:** commands actually run, result, and checks not run.

## Constraints
- Do not change code, dependencies, configuration, assets, or Git state during this audit.
- Do not create a replacement app or scaffold a second project.
- Do not dump the full file tree or large source files into the response.
- Exclude dependency folders, build output, and caches from broad inspection.
- Avoid asking questions that can be answered by inspecting the repository. If important information is missing, record an explicit assumption and continue the audit.
- Do not claim you viewed a screenshot, launched a browser, ran a build, or verified FPS unless you actually did it.

Stop after the audit and wait for my instruction before making changes.
