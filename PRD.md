# Product Requirements Document (PRD)

## Interactive 3D Island Website

**Document status:** Initial product baseline — validate against the existing prototype before implementation  
**Owner:** Project owner (user)  
**Primary implementation agent:** Google Antigravity  
**Last updated:** 2026-10-28

---

## 1. Product summary

Build a polished, responsive, interactive 3D island website. A broad, calm blue ocean establishes the environment, while a small island remains the primary visual focal point. The island contains several recognizable landmarks—initial examples include a house, a windmill, and a farm. Selecting a landmark should smoothly direct the camera toward it and reveal an elegant HTML information panel containing editable content.

This document defines the product intent and acceptance criteria. It does **not** authorize a ground-up rewrite of an existing prototype. The current repository, working features, installed dependencies, existing 3D assets, and supplied screenshots must be inspected before the implementation plan is chosen.

## 2. Problem and product intent

The project should feel like a small, art-directed interactive world rather than a generic landing page with a 3D object placed behind standard cards. Exploration of the island should be intuitive, visually coherent, and technically reliable on ordinary consumer hardware.

The finished site should combine:

- A distinctive 3D environment and clear visual composition.
- Useful, discoverable landmark interactions.
- Smooth camera movement and restrained motion design.
- Readable, editable information panels.
- Maintainable code that can be iterated on without repeatedly rebuilding the application.

## 3. Goals

1. Present a calm, visually compelling ocean-and-island scene, with the island as the main focal point.
2. Make each interactive landmark visually recognizable and easy to select.
3. Move the camera smoothly to frame a selected landmark without disorienting jumps.
4. Show and dismiss landmark information through a conventional HTML UI layer.
5. Preserve responsive behavior across desktop and mobile layouts.
6. Keep the code modular, understandable, and compatible with the existing project where feasible.
7. Establish measurable acceptance checks so changes can be verified rather than judged only by appearance.
8. Minimize unnecessary dependencies, broad rewrites, duplicated work, and unverified claims.

## 4. Non-goals for the initial release

Unless the owner explicitly expands the scope, do not build:

- Multiplayer, accounts, authentication, payments, or a backend CMS.
- A complete game, economy, quests, or complex simulated ecosystem.
- A free-flight camera or physics system beyond what the experience needs.
- A large content-management interface.
- Unrequested analytics, telemetry, tracking, or collection of personal data.
- Decorative sections unrelated to exploring the island.

## 5. Users and usage context

### Primary user
A visitor arriving at the website who should immediately understand that the island can be explored and that its landmarks contain information.

### Project owner
A developer/creator who needs to edit landmark content, refine visual presentation, and continue development with AI coding tools. Code and project documentation should be clear enough for a developing programmer to maintain.

### Expected devices
Desktop and laptop browsers first, with mobile/tablet support as a required responsive behavior. The implementation should not assume a high-end discrete GPU.

## 6. Product experience and design direction

### 6.1 Scene composition

- Use a broad blue ocean as the environmental base.
- Keep the island clearly readable and visually dominant, without filling the viewport with unnecessary objects.
- Establish depth through purposeful scale, lighting, materials, shoreline shape, terrain levels, and restrained environmental detail.
- Keep the key landmarks recognizable at the default camera distance.
- Avoid a scene that looks like unrelated primitive meshes assembled without intentional composition.

### 6.2 Art direction

The final look should be coherent, deliberate, and distinctive. Favor a consistent material palette, controlled lighting, clear silhouettes, restrained color use, and motion with a clear purpose. The exact visual style must be reconciled with the user's existing prototype and screenshot references before changing the art direction.

Do not automatically add common AI-generated design patterns—such as excessive glassmorphism, random gradients, glowing borders, floating UI cards, decorative badges, or constant animation—unless they serve a specific and demonstrated design purpose.

### 6.3 Interaction language

- Interactive landmarks should have a clear visual affordance, without adding distracting labels everywhere.
- Pointer hover feedback should be subtle and reversible.
- Click/tap should select the landmark and animate the camera toward a useful framing.
- The information panel should appear with restrained motion and readable hierarchy.
- Users must have an obvious way to close the panel and return to the overview.
- Selection, camera movement, and panel state must remain synchronized.

### 6.4 Information panel

Use HTML/React UI layered above the 3D canvas rather than rendering long text into the 3D scene. Panels should:

- Present a landmark name, concise description, and optional fields where the product content supports them.
- Remain legible at the supported viewport sizes.
- Avoid obscuring the subject more than necessary.
- Be dismissible and keyboard-accessible.
- Read content from a centralized data structure rather than hard-coded text scattered across scene components.

## 7. Functional requirements

Priority definitions: **P0** = required for a usable first release; **P1** = important quality; **P2** = optional enhancement.

### FR-001 — Scene initialization (P0)
The site must load a functioning 3D scene containing the ocean and island. Initial loading must not permanently leave the user with a blank canvas if an asset fails.

**Acceptance criteria**
- The main scene renders in the supported browser environment.
- The island is visible in the initial camera view.
- A loading or fallback state is provided when scene initialization or required asset loading takes noticeable time or fails.
- Console/runtime errors caused by the normal startup path are resolved or clearly documented.

### FR-002 — Ocean and island composition (P0)
The ocean and island must form the main composition and remain visually distinct.

**Acceptance criteria**
- The island reads clearly against the ocean at the default camera position.
- The shoreline/terrain boundary is deliberate rather than accidental.
- The scene uses consistent lighting and materials.
- No obvious z-fighting, severe clipping, or accidental object overlap is visible in the standard view.

### FR-003 — Landmark objects (P0)
The island supports distinct landmarks. The current conceptual examples are a house, windmill, and farm; the actual prototype assets and the owner's references take precedence over replacement with arbitrary models.

**Acceptance criteria**
- Every intended interactive landmark has a distinct identity and position.
- Landmarks do not float, sink, or visibly intersect terrain unless this is an intentional design choice.
- Landmark names/IDs are stable and not based on brittle array indices.

### FR-004 — Landmark selection (P0)
A visitor can select a landmark using a pointer or touch input.

**Acceptance criteria**
- Each intended landmark can be selected reliably.
- Selection feedback is perceptible but not visually noisy.
- The same input does not accidentally trigger unrelated landmarks through overlapping hit targets.
- Touch targets and selection behavior remain usable on small screens.

### FR-005 — Camera focus transition (P0)
Selecting a landmark triggers smooth camera movement that focuses on the selected landmark.

**Acceptance criteria**
- Camera position and orientation/target transition smoothly rather than teleporting.
- The selected object remains sufficiently visible after movement.
- Repeated selection and quick switching do not produce uncontrolled motion or stale transitions.
- Returning to overview restores a useful composition.
- Camera behavior respects existing project controls and does not introduce incompatible control systems.

### FR-006 — Landmark information panel (P0)
The selected landmark displays an HTML/React information panel.

**Acceptance criteria**
- Panel content matches the selected landmark.
- Text is readable and does not depend on 3D text rendering.
- Panel content is data-driven and straightforward to edit.
- The panel can be closed; closing it clears or consistently resets selection state.
- The UI remains usable when camera focus changes.

### FR-007 — State consistency (P0)
Selected landmark, camera target, active panel, and interaction affordances must agree.

**Acceptance criteria**
- Only the correct landmark is shown as selected.
- Closing/resetting selection does not leave the camera or UI in a contradictory state.
- Rapid successive interactions do not leave stale panel content visible.

### FR-008 — Responsive layout (P1)
The experience should adapt to desktop, tablet, and mobile viewport sizes.

**Acceptance criteria**
- The canvas resizes with the viewport without distortion or layout overflow.
- Landmark information remains legible and dismissible on a narrow viewport.
- UI does not cover every important part of the island on common screen sizes.
- Mobile interactions do not rely solely on hover.

### FR-009 — Accessible interaction (P1)
Provide reasonable accessibility for UI layered on the 3D scene.

**Acceptance criteria**
- Information panels have semantic headings and buttons.
- Close controls have accessible names and visible focus treatment.
- Escape may close a panel when this matches the project's interaction model.
- If feasible in the current architecture, provide keyboard-accessible landmark controls or an equivalent landmark list; document any 3D-only accessibility limitation.
- Motion should be restrained, and reduced-motion preferences should be respected where practicable.

### FR-010 — Performance and resource management (P0)
The project should avoid wasteful rendering work and unnecessarily heavy assets.

**Acceptance criteria**
- No unneeded animation loop, repeated state update, or continuously running effect is introduced without a reason.
- Event listeners, subscriptions, timers, and GPU resources are correctly cleaned up when applicable.
- Images, models, and textures are inspected before replacing or duplicating them.
- Canvas pixel ratio and expensive visual effects are selected with ordinary integrated graphics in mind.
- The developer records available performance observations and test conditions instead of claiming an unmeasured FPS result.

### FR-011 — Failure handling (P1)
Missing assets or unsupported capabilities should degrade gracefully.

**Acceptance criteria**
- Asset paths and loading failures are checked.
- A useful error or fallback appears where feasible instead of silently failing.
- Failure of an optional enhancement does not break core scene interaction.

### FR-012 — Maintainable content and components (P0)
Landmark content and major scene elements should be organized to support future expansion.

**Acceptance criteria**
- Landmark metadata is centralized.
- The 3D scene, landmark interaction/camera behavior, and HTML overlay are separated into logical components or modules appropriate to the existing codebase.
- Shared behavior is not copied across each building without justification.
- Names and types communicate intent.

## 8. Technical constraints and stack policy

The current repository must be inspected before any stack decision is made.

Preferred technologies when compatible with the existing codebase:

- React and TypeScript.
- Three.js through React Three Fiber (`@react-three/fiber`) where the project is already React-based or a new React architecture is justified.
- React Three Drei (`@react-three/drei`) for capabilities it demonstrably simplifies.
- Tailwind CSS if already installed or if it materially improves UI consistency.
- Framer Motion for DOM animation only when useful and compatible; do not add it solely for decoration.

Stack rules:

1. Preserve the established framework/build tooling unless a verified blocker justifies migration.
2. Do not migrate Vite to Next.js or Next.js to Vite for preference alone.
3. Do not install a library before checking the current `package.json`, installed APIs, and whether existing primitives can solve the task.
4. Avoid duplicate libraries solving the same problem.
5. For a new project without an existing framework, propose a minimal stack first and explain the trade-offs before scaffolding.
6. Follow current package APIs verified from installed typings or official documentation when using new/uncertain APIs.

## 9. Architecture expectations

Adapt these guidelines to the actual repository; do not force an architecture that conflicts with working code.

- **Scene composition:** a clear scene entry point that coordinates environment, island, landmarks, lighting, and camera.
- **Landmark model:** stable ID, display name, description, world position or object reference, and optional view/focus metadata.
- **Interaction layer:** selection state and camera focus logic managed through a small number of well-defined interfaces.
- **HTML overlay:** information UI kept separate from scene meshes and sourced from landmark data.
- **Asset management:** stable, traceable asset paths; avoid silently replacing existing assets.
- **Configuration:** reusable constants for camera targets, scene scale, content, and key visual parameters where beneficial.

Avoid overengineering: do not introduce a global state library, event bus, dependency injection framework, or complex abstraction unless the current requirements warrant it.

## 10. Non-functional requirements

### Reliability
- The default user journey should not require a reload to recover from ordinary selection changes.
- Preserve existing working interactions unless the change explicitly replaces them.

### Maintainability
- Prefer small changes with clear intent over broad rewrites.
- Make the smallest coherent patch that satisfies the requirement.
- Keep documentation accurate and update the project state after significant milestones.

### Visual quality
- Use a consistent design language across scene and UI.
- Avoid unrequested visual clutter and generic template styling.
- Judge scene quality in the running application or screenshots, not only by reading source code.

### Privacy and security
- Do not add user tracking or personal-data collection unless explicitly required.
- Never commit API keys, `.env` values, passwords, or credentials.

## 11. Existing prototype handling

Before code changes, the agent must:

1. Read this PRD and `AGENTS.md`.
2. Inspect the repository structure, entry points, package manifests, key components, and referenced assets. Exclude generated directories such as `node_modules`, build output, and caches from broad inspection.
3. Identify which requirements are complete, partial, missing, or unverified.
4. Review supplied screenshots or reference media if available.
5. Identify the smallest high-value implementation steps and the tests that can verify them.
6. Preserve the existing prototype and explain any proposed breaking or architectural change before executing it.

Do not claim the prototype was visually inspected, executed, or tested unless that actually occurred.

## 12. Validation strategy

Use the checks that fit the actual project scripts and environment:

- Start/development server check where supported.
- Production build.
- TypeScript/type-check command where configured.
- Lint/test commands where configured.
- Browser or screenshot inspection of the initial scene and key interactions when tools are available.
- Manual checks for selecting a landmark, switching to another landmark, closing the panel, restoring overview, resizing the viewport, and refreshing the page.
- Check browser console and terminal output for relevant errors.

Do not invent test results. When a check cannot run, list it as **Not verified**, state why, and provide the exact next check needed.

## 13. Acceptance checklist for the initial release

The initial release is acceptable when:

- [ ] The ocean/island scene starts reliably.
- [ ] The island and required landmarks are visually coherent in the default view.
- [ ] Every intended landmark is selectable.
- [ ] Camera focus animation works and can return to overview.
- [ ] A correct, editable information panel appears per landmark.
- [ ] Selection and panel states do not get out of sync.
- [ ] Desktop and narrow viewport behavior has been checked.
- [ ] Key loading/runtime errors are resolved or documented.
- [ ] Build/type/test checks that exist in the repository have been run or explicitly marked unverified.
- [ ] No unrequested feature or dependency was added without justification.
- [ ] Project state/documentation reflects what is actually implemented.

## 14. Assumptions and open decisions

These items must be validated from the repository, existing design, or owner-provided references; do not block the first audit to ask every question.

- Exact visual style (stylized low-poly, realistic, miniature diorama, or another direction): inspect prototype/screenshots first.
- Exact content for each landmark: currently unspecified; preserve existing content and use explicit editable sample content only if required.
- Exact list of landmarks: house, windmill, and farm are initial conceptual examples, not permission to delete other existing landmarks.
- Source and licenses of 3D models/textures: inspect available asset metadata and documentation; do not assume a license.
- Required browsers and minimum devices: default to modern desktop/mobile browsers unless the owner specifies otherwise.
- Deployment target and domain: not specified; do not add deployment work to the first implementation task unless requested.

## 15. Definition of done for each development task

A task is done only when:

1. Its acceptance criteria are clear and addressed.
2. The relevant code change is implemented in the existing project.
3. Relevant available checks are executed.
4. The final response distinguishes implemented, verified, and unverified items.
5. The summary names changed files and any meaningful limitations.
6. `docs/PROJECT_STATE.md` is updated after a meaningful milestone.
7. No unrelated features were added.
