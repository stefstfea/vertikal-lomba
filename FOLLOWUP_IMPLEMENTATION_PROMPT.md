# Follow-up Prompt — Implement the Approved Plan

Use after reviewing the audit and approving the proposed first task.

Implement only the first approved P0/P1 task from the audit. Follow `AGENTS.md`, `PRD.md`, and the relevant skill under `.agents/skills/`.

Before editing, identify the requirement and its observable acceptance criteria in one or two sentences. Inspect only the files and dependencies relevant to that task. Then make the smallest coherent implementation in the existing codebase. Do not bundle unrelated cleanup or introduce a new dependency unless the task requires it and the reason is clear.

After the change:
1. Run the narrowest relevant checks, then run a build/type-check/test if configured and proportionate.
2. Review the diff for accidental changes, stale logic, and regressions.
3. If browser/screenshot access is available, verify the affected UI in the running app; otherwise mark visual behavior as unverified.
4. Update `docs/PROJECT_STATE.md` with current implementation, verified checks, unresolved issues, and the next logical task.
5. Report `Status`, `Changed files`, `Verification`, and `Remaining risks` concisely.

Do not claim successful validation without evidence. Stop after this task rather than continuing into the next phase automatically.
