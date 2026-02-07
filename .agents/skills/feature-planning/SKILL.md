---
name: feature-planning
description: Use when the user asks to "plan a feature", "create a feature", "let's build", "help me build", "spec out a feature", "design a feature", or uses the /plan command.
version: 2.0.0
---

# Feature Planning Skill

Creates phased implementation plans with requirement clarification, approach selection, and code examples. The output is a markdown plan file designed for:
- Human review before implementation
- Phase-by-phase execution by an implementation agent
- Clear verification criteria at each checkpoint

## When to Use

**Use for:** New features, components, non-trivial implementations, modifications to existing features.

**Skip for:** Simple bug fixes, typo fixes, style tweaks, exploratory research, or when a detailed spec already exists.

## Plan Output Structure

Plans follow this mandatory structure (see `assets/plan-template.md`):

1. **Overview** - Feature description, user story, scope
2. **Technical Approach** - Selected approach with rationale, alternatives considered
3. **Data Model Implementation** - Interfaces, types, API endpoints (when applicable)
4. **Service Implementation** - Service structure, state management (when applicable)
5. **Component Implementation** - Component structure, templates (when applicable)
6. **Edge Cases & Error Handling** - Error scenarios, edge cases with handling strategies
7. **Testing Strategy** - Unit, integration, E2E test specifications
8. **Implementation Phases** - Discrete, reviewable phases with verification criteria
9. **Acceptance Criteria** - Spec requirements checklist + mandatory quality gates

## Workflow

### Phase 1: Understand Requirements

Ask 3-5 questions to understand the feature. Keep questions simple and direct.

**REQUIRED:** Use `AskUserQuestion` tool for questions with 2-4 discrete options. Plain text is acceptable only for truly open-ended questions (naming, descriptions).

Focus on:
- What is the feature and why is it needed?
- Who will use it and how should it work?
- What are the key constraints or requirements?

### Phase 2: Research Codebase

**REQUIRED:** Spawn 2-3 Explore agents in parallel using `Task` tool with `subagent_type=Explore`.

Example prompts:
- "Find existing implementations similar to [feature]. Document file paths and patterns used."
- "Research patterns for [domain] in this codebase. Provide concrete code examples."
- "Identify reusable code for [feature]: utilities, base components, existing types."

Synthesize findings into patterns and reuse opportunities that inform the plan, include file paths and code snippets where relevant.

### Phase 3: Clarify Details

Based on feature type, ask up to 3-5 domain-specific questions. Consult `references/question-frameworks.md` for templates.

Cover edge cases, error handling, and critical implementation details. Use `AskUserQuestion` for discrete choices.

### Phase 4: Present Approach Options

**REQUIRED:** Generate 2-3 distinct implementation approaches before committing to a plan.

For each approach, document:
- **Name:** Short title (e.g., "Minimal MVP", "Full-Featured")
- **Description:** 2-3 sentences
- **Trade-offs:** What you gain vs. sacrifice
- **Complexity:** Low/Medium/High

**Provide a recommendation with reasoning:**
```
**Recommendation: [Approach Name]**

Reasoning:
- [Why this approach fits the requirements]
- [Why it aligns with codebase patterns]
- [Why the trade-offs are acceptable]
```

**REQUIRED:** Present options using `AskUserQuestion`:
```
Question: "Which implementation approach should we use?"
Header: "Approach"
Options:
- [Recommended Name] (Recommended) - [Brief summary]
- [Option B Name] - [Brief summary]
- [Option C Name] - [Brief summary]
```

List the recommended option first with "(Recommended)" suffix.

### Phase 5: Generate Plan Document

After user selects an approach:

1. **Create plan file:**
   ```bash
   ./.agents/skills/feature-planning/scripts/create_plan_file.sh "feature-name" "plan-title"
   ```

2. **Write the plan** using `assets/plan-template.md` as a guide.

3. **REQUIRED: Structure implementation as discrete phases.**

   Each phase must be:
   - **Self-contained:** Can be implemented and reviewed independently
   - **Verifiable:** Has clear criteria to confirm completion
   - **Ordered:** Later phases can depend on earlier ones

   Example phase structure:
   ```markdown
   ### Phase 2: Service Layer

   **Goal:** Implement the feature service with API integration

   **Tasks:**
   1. [ ] Create FeatureService in `src/app/feature/feature.service.ts`
   2. [ ] Add HTTP methods for CRUD operations
   3. [ ] Implement signal-based state management

   **Code Examples:**
   [Complete, working code for this phase]

   **Phase Verification:**
   - [ ] Code compiles without errors
   - [ ] Linting passes (`npm run lint`)
   - [ ] Unit tests written and passing (`npm test`)
   - [ ] No regression in existing tests
   ```

4. **REQUIRED: Include code examples for all new files:**

   Code examples must:
   - Cover ALL new files to be created
   - Include complete interface/type definitions
   - Show actual method signatures (no `// TODO` placeholders)
   - Demonstrate integration with existing patterns
   - Be organized by phase

5. **REQUIRED: Include mandatory acceptance criteria:**

   ```markdown
   ## 9. Acceptance Criteria

   ### Specification Requirements
   - [ ] [Each requirement from the spec]

   ### Quality Gates
   - [ ] **Linting:** All checks pass (`npm run lint`)
   - [ ] **Unit Tests:** All pass, no regressions (`npm test`)
   - [ ] **Integration Tests:** All pass (`npm run test:integration`)
   - [ ] **E2E Tests:** All pass (`npm run test:e2e`)
   - [ ] **Build:** Application builds successfully (`npm run build`)
   - [ ] **Accessibility:** Passes aXe audit (WCAG AA)
   ```

6. **Present to user** for final validation before considering the plan complete.

## Plan Quality Checklist

Before finalizing, verify:
- [ ] 2-3 approaches presented with recommendation
- [ ] User confirmed selected approach
- [ ] Plan follows the 9-section structure
- [ ] Implementation broken into discrete, reviewable phases
- [ ] Each phase has verification criteria
- [ ] All new files have complete code examples
- [ ] Interfaces and types are complete
- [ ] Edge cases and error handling documented
- [ ] Testing strategy covers unit, integration, and E2E
- [ ] Acceptance criteria includes all spec requirements
- [ ] Acceptance criteria includes mandatory quality gates

## Resources

- `references/question-frameworks.md` — Domain-specific question templates
- `assets/plan-template.md` — Plan structure template
- `examples/` — Sample plans for reference
