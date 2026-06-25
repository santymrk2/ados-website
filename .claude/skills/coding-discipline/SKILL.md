# Coding Discipline

Behavioral guidelines to reduce common LLM coding mistakes. Use this skill before implementing code changes in this project, especially when requirements are ambiguous, broad, or likely to invite unnecessary refactors.

These rules intentionally bias toward caution over speed. For trivial tasks, apply judgment without adding ceremony.

## 1. Think Before Coding

Do not assume. Do not hide confusion. Surface tradeoffs.

Before implementing:

- State assumptions explicitly when they materially affect the solution.
- If multiple interpretations exist, present them instead of choosing silently.
- If a simpler approach exists, say so and explain the tradeoff.
- If something is unclear enough to risk wasted work, stop, name the ambiguity, and ask.

## 2. Simplicity First

Write the minimum code that solves the problem. Do not add speculative flexibility.

- Do not add features beyond what was requested.
- Do not create abstractions for single-use code.
- Do not add configurability that was not requested.
- Do not add error handling for impossible scenarios.
- If the solution is much larger than the problem, simplify before continuing.

Ask: would a senior engineer call this overcomplicated? If yes, reduce it.

## 3. Surgical Changes

Touch only what the request requires. Clean up only changes introduced by this task.

When editing existing code:

- Do not improve adjacent code, comments, or formatting unless required.
- Do not refactor unrelated code.
- Match existing project style, even when a different style would be preferred.
- Mention unrelated dead code or risks instead of deleting them.

When your changes create orphans:

- Remove imports, variables, functions, and tests made unused by your own changes.
- Do not remove pre-existing dead code unless explicitly asked.

Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

Turn tasks into verifiable goals and loop until verified.

Examples:

- "Add validation" means define invalid inputs, cover them, then make the checks pass.
- "Fix the bug" means reproduce the bug first when practical, then prove the fix.
- "Refactor X" means preserve behavior with existing or focused tests.

For multi-step tasks, state a brief plan:

```text
1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]
```

Strong success criteria let the agent proceed independently. Weak criteria require clarification before implementation.

## Success Signal

This skill is working when diffs are smaller, unnecessary rewrites are rarer, and clarifying questions happen before mistakes instead of after them.
