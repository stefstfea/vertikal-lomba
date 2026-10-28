---
name: visual-quality-audit
description: Audits the existing 3D island website's visual quality and interactions against its PRD and references, detecting generic styling, composition problems, UI obstruction, and misleading claims.
---

# Visual Quality Audit

Use this skill when evaluating the scene, reviewing screenshots, improving art direction, polishing the information panel, or checking a visual implementation.

## Evidence first
- Use the running application and current screenshots whenever available.
- If only source code is available, label visual conclusions as inferred rather than verified.
- Compare against the PRD, existing art direction, and owner-provided references; do not invent unseen reference requirements.

## Scene checklist
1. **Composition:** the island reads as the focal point; ocean negative space frames it; important landmarks remain visible.
2. **Silhouette and scale:** buildings are distinct at the default view and correctly grounded on terrain.
3. **Material and lighting:** consistent palette, readable forms, coherent shadows, no unintended clipping or z-fighting.
4. **Depth:** terrain, shoreline, water, and landmarks have intentional depth cues; added details do not create noise.
5. **Motion:** camera focus is smooth and controlled; movement helps orientation rather than showing off.
6. **Performance clues:** avoid needless transparent layers, excessive real-time shadows, overly dense geometry, full-resolution rendering on every device, and always-running effects where unnecessary.

## UI checklist
- The HTML panel has a clear title/body hierarchy, readable line length, intentional spacing, and a visible close action.
- Panel placement complements the scene and does not hide the selected landmark needlessly.
- Controls have clear states and accessible focus/labels.
- Responsive composition is checked on narrow screens where browser testing is available.
- The panel content corresponds to the selected landmark and does not become stale after fast selection changes.

## Anti-slop test
For each proposed visual effect or UI element, answer: what user problem does this solve? If there is no clear answer, remove it or do not add it. Do not add generic gradients, glowing outlines, glass cards, fake stats, badges, decorative icons, excessive animations, or stock-looking UI merely to make the page appear more elaborate.

## Findings and fixes
Report only consequential issues. Separate:
- **Observed:** directly seen in an image or running app.
- **Inferred:** likely from source inspection, not visually verified.
- **Unverified:** could not be checked.

Prioritize issues by user impact and fix them in small, reviewable passes. After a visual change, inspect the result again if the environment permits. Never claim that a screenshot or browser was inspected when it was not.
