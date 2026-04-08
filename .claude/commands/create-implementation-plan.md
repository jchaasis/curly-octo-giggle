---
name: create-implementation-plan
description: Create a new implementation plan file for new features, refactoring existing code, upgrading packages, design, architecture, infrastructure changes, or defect resolution. Use this skill whenever the user wants to plan out work, document steps for a task, create a plan for a bug fix, or structure an upcoming implementation. Trigger this for any "plan", "planning", "write a plan for", "create a plan", "document the steps", or "how should I implement" requests.
arguments: topic
---

# Create Implementation Plan

## Your Goal

Create a structured implementation plan file for: **$ARGUMENTS**

If `$ARGUMENTS` is empty, begin by asking the user what they want to plan.

## Step 1: Gather Context

Before writing anything, collect the information you need. Start by asking the user (or inferring from `$ARGUMENTS`) about:

1. **What is being planned?** (new feature, refactor, bug fix, dependency upgrade, architectural change, etc.)
2. **What component or area of the codebase is affected?** (e.g., auth module, API layer, database schema)
3. **What is the desired outcome or goal?**
4. **Are there any known constraints, deadlines, or requirements?**

If `$ARGUMENTS` provides enough context to infer the answers, skip asking and proceed — but briefly confirm your interpretation before writing the plan.

## Step 2: Explore the Codebase

Once you understand the scope, explore the relevant parts of the codebase to populate the plan with specific, accurate details. Look for:

- Relevant source files and their paths
- Existing patterns and conventions in the area you're changing
- Current dependencies that may be affected
- Existing tests that cover the affected code
- Any related configuration files

Use this exploration to make the plan concrete. A good plan references actual file paths, function names, and module names — not vague descriptions.

## Step 3: Determine the Output File

Determine the file name using this convention:

- **Purpose prefix**: `feature` | `refactor` | `upgrade` | `bugfix` | `architecture` | `infrastructure` | `design` | `data` | `process`
- **Component**: a short kebab-case name for the affected area (e.g., `auth-module`, `user-api`, `payment-flow`)
- **Version**: start at `1`; increment if a plan file with the same name already exists

**Format**: `plan/[purpose]-[component]-[version].md`

**Examples**: `plan/feature-auth-module-1.md`, `plan/bugfix-payment-flow-1.md`, `plan/refactor-api-layer-1.md`

Check whether the `plan/` directory exists at the workspace root before writing. Create it if needed.

## Step 4: Write the Plan

Generate the plan using the template below. Every section is required. Do not leave placeholder text — populate each section with specific, actionable content derived from your understanding of the goal and codebase.

### Naming identifiers

Use these prefixes consistently:
- `REQ-` for functional requirements
- `SEC-` for security requirements  
- `CON-` for constraints
- `GUD-` for guidelines
- `PAT-` for patterns to follow
- `ALT-` for alternatives considered
- `DEP-` for dependencies
- `FILE-` for affected files
- `TEST-` for tests to write
- `RISK-` for risks
- `ASSUMPTION-` for assumptions
- `GOAL-` for phase goals
- `G#-TASK-` for individual tasks (numbered sequentially within a phases)

### Status badge colors

| Status | Color |
|--------|-------|
| Completed | `brightgreen` |
| In progress | `yellow` |
| Planned | `blue` |
| Deprecated | `red` |
| On Hold | `orange` |

New plans should use status `Planned`.

---

## Template

```md
---
goal: [Concise title describing what this plan achieves]
version: [e.g., 1]
date_created: [YYYY-MM-DD]
last_updated: [YYYY-MM-DD]
owner: [Optional: team or person responsible]
status: 'Planned'
tags: [e.g., feature, upgrade, chore, architecture, migration, bug]
---

# [Plan Title]

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

[2-3 sentence introduction: what is being built or changed, why it matters, and what success looks like.]

## 1. Requirements & Constraints

[List all requirements and constraints that shape how this plan must be implemented.]

- **REQ-001**: [Functional requirement]
- **CON-001**: [Constraint, e.g., must not break existing API contracts]
- **GUD-001**: [Guideline or convention to follow]
- **PAT-001**: [Existing pattern this plan must adhere to]

## 2. Implementation Steps

[Break the work into sequential phases. Each phase should have a clear goal and result in a working, testable increment. Tasks within a phase can be done in parallel unless dependencies are noted.]

### Phase 1: [Phase Name]

- GOAL-001: [What this phase delivers and why it comes first]

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| G001-TASK-001 | [Specific action with file path or function name where relevant] | | |
| G001-TASK-002 | [Specific action] | | |

### Phase 2: [Phase Name]

- GOAL-002: [What this phase delivers]

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| G002-TASK-003 | [Specific action] | | |
| G002-TASK-004 | [Specific action] | | |

## 3. Alternatives

[Document approaches that were considered but not chosen, and why. This provides rationale and prevents relitigating decisions.]

- **ALT-001**: [Alternative approach] — Not chosen because [reason].
- **ALT-002**: [Alternative approach] — Not chosen because [reason].

## 4. Dependencies

[List external libraries, services, or internal modules this plan depends on.]

- **DEP-001**: [Dependency name and version if applicable] — [Why it's needed]
- **DEP-002**: [Dependency name] — [Why it's needed]

## 5. Files

[List source files that will be created, modified, or deleted. Be specific.]

- **FILE-001**: `[path/to/file.ts]` — [What changes and why]
- **FILE-002**: `[path/to/other-file.ts]` — [What changes and why]

## 6. Testing

[Define what tests need to be written or updated to validate this plan's implementation.]

- **TEST-001**: [What is being tested and how] — [File path if applicable]
- **TEST-002**: [What is being tested and how]

## 7. Risks & Assumptions

[Surface uncertainty. Risks are things that could go wrong; assumptions are things believed to be true that haven't been verified.]

- **RISK-001**: [Risk] — Mitigation: [how to reduce likelihood or impact]
- **ASSUMPTION-001**: [Assumption that, if wrong, would change the plan]

## 8. Related Specifications / Further Reading

- [Link to related plan, PRD, or ticket]
- [Link to relevant documentation, RFC, or ADR]
```

---

## Step 5: Confirm and Save

After writing the plan:
1. State the file path where the plan was saved
2. Briefly summarize what the plan covers (2-3 sentences)
3. Call out any areas where you made assumptions due to missing information, so the user can correct them
