# [Feature Name]

**Created:** [Date]
**Status:** Draft | Ready for Implementation | In Progress | Complete
**Branch:** [feature-branch-name]

---

## 1. Overview

Brief description of what this feature does and why it's needed. Include the user story or problem statement.

**User Story:**
> As a [type of user], I want [goal/desire] so that [benefit/value].

**Context:**
[Additional context about why this feature is needed, what problem it solves, or what value it provides.]

**Scope:**
- **In Scope:** [What's included]
- **Out of Scope:** [What's explicitly excluded]

---

## 2. Technical Approach

### Architecture Overview
High-level description of how the feature will be implemented, including key design decisions.

### Approach Selection
**Selected Approach:** [Name of chosen approach]

**Why this approach:**
- [Reason 1]
- [Reason 2]

**Alternatives Considered:**
| Approach | Trade-offs | Why Not Selected |
|----------|------------|------------------|
| [Alt 1] | [Trade-offs] | [Reason] |
| [Alt 2] | [Trade-offs] | [Reason] |

### File Changes Overview

**Files to Create:**
- `path/to/file.ts` - Description

**Files to Modify:**
- `path/to/existing.ts` - Description of changes

---

## 3. Data Model Implementation

> Skip this section if the feature has no data model changes.

### Interfaces & Types

```typescript
// src/app/feature/feature.types.ts

interface ExampleEntity {
  id: number;
  name: string;
  // Complete interface definition
}

interface ExampleRequest {
  // Request payload
}

interface ExampleResponse {
  // Response structure
}
```

### API Endpoints

**[METHOD] /api/endpoint**
- **Description:** What it does
- **Auth:** Required/None
- **Request:** `ExampleRequest`
- **Response:** `ExampleResponse`
- **Errors:** 400, 401, 404, 500

### Database Changes
[Describe any schema changes, migrations, or new tables if applicable]

---

## 4. Service Implementation

> Skip this section if the feature has no service layer.

### Service Structure

```typescript
// src/app/feature/feature.service.ts

@Injectable({ providedIn: 'root' })
export class FeatureService {
  private readonly http = inject(HttpClient);

  // Signal-based state
  private readonly _state = signal<State>(initialState);
  readonly state = this._state.asReadonly();

  // Public methods with signatures
  methodName(params: ParamType): Observable<ReturnType> {
    // Implementation approach described
  }
}
```

### State Management
- [Signal 1]: Description of what it holds
- [Computed 1]: Description of derived state

---

## 5. Component Implementation

> Skip this section for backend-only features.

### Component Structure

```typescript
// src/app/feature/feature.ts

@Component({
  selector: 'app-feature',
  templateUrl: './feature.html',
  styleUrl: './feature.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Feature {
  // Injected dependencies
  private readonly service = inject(FeatureService);

  // Component state
  readonly state = signal<ComponentState>(initial);

  // Event handlers
  onAction(): void {
    // Implementation approach
  }
}
```

### Template Structure
```html
<!-- Key template sections with explanation -->
<section class="...">
  <!-- Describe UI structure -->
</section>
```

### User Flow
1. User does X
2. System responds with Y
3. User sees Z

---

## 6. Edge Cases & Error Handling

### Error Scenarios

| Scenario | User Impact | Handling Strategy |
|----------|-------------|-------------------|
| Network failure | Cannot complete action | Show error message with retry button |
| Invalid input | Form won't submit | Display field-level validation errors |
| Unauthorized | Cannot access feature | Redirect to login, preserve return URL |
| Not found | Resource missing | Show 404 state with navigation options |

### Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| Empty state | Show empty state UI with CTA |
| Maximum data | Paginate or virtual scroll |
| Concurrent edits | [Strategy: last-write-wins, optimistic locking, etc.] |
| Slow network | Show loading after 200ms, timeout at 10s |

---

## 7. Testing Strategy

### Unit Tests

**Service Tests (`feature.service.spec.ts`):**
- [ ] Test [method] returns correct data
- [ ] Test [method] handles errors properly
- [ ] Test [signal] updates on [action]

**Component Tests (`feature.spec.ts`):**
- [ ] Test initial render state
- [ ] Test [interaction] triggers [expected behavior]
- [ ] Test error state displays correctly

### Integration Tests

- [ ] Test component-service interaction for [flow]
- [ ] Test API integration with mock backend

### E2E Tests

- [ ] Test complete user flow: [describe happy path]
- [ ] Test error recovery flow

---

## 8. Implementation Phases

Each phase is a discrete unit of work that can be implemented, reviewed, and verified independently.

### Phase 1: [Foundation/Data Model/etc.]

**Goal:** [What this phase accomplishes]

**Tasks:**
1. [ ] Task description - `file/path.ts`
2. [ ] Task description - `file/path.ts`
3. [ ] Task description

**Code Examples:**
```typescript
// Include complete code for this phase
```

**Phase Verification:**
- [ ] Code compiles without errors
- [ ] Linting passes (`npm run lint`)
- [ ] Unit tests pass (`npm test`)

---

### Phase 2: [Core Functionality/Service Layer/etc.]

**Goal:** [What this phase accomplishes]

**Tasks:**
1. [ ] Task description
2. [ ] Task description

**Code Examples:**
```typescript
// Include complete code for this phase
```

**Phase Verification:**
- [ ] Code compiles without errors
- [ ] Linting passes
- [ ] New unit tests written and passing
- [ ] No regression in existing tests

---

### Phase 3: [Integration/UI/etc.]

**Goal:** [What this phase accomplishes]

**Tasks:**
1. [ ] Task description
2. [ ] Task description

**Code Examples:**
```typescript
// Include complete code for this phase
```

**Phase Verification:**
- [ ] Code compiles without errors
- [ ] Linting passes
- [ ] All unit tests pass
- [ ] Manual testing checklist complete

---

### Phase 4: [Polish/Accessibility/etc.]

**Goal:** [What this phase accomplishes]

**Tasks:**
1. [ ] Task description
2. [ ] Task description

**Phase Verification:**
- [ ] Code compiles without errors
- [ ] Linting passes
- [ ] All tests pass
- [ ] Accessibility audit passes (aXe)
- [ ] Cross-browser testing complete

---

## 9. Acceptance Criteria

### Specification Requirements
- [ ] [Requirement 1 from spec]
- [ ] [Requirement 2 from spec]
- [ ] [Requirement 3 from spec]

### Quality Gates
- [ ] **Linting:** All checks pass (`npm run lint`)
- [ ] **Unit Tests:** All pass, no regressions (`npm test`)
- [ ] **Integration Tests:** All pass (`npm run test:integration`)
- [ ] **E2E Tests:** All pass (`npm run test:e2e`)
- [ ] **Build:** Application builds successfully (`npm run build`)
- [ ] **Accessibility:** Passes aXe audit (WCAG AA)

### Final Verification
- [ ] Feature works on Chrome, Firefox, Safari, Edge (latest 2 versions)
- [ ] Responsive design works on mobile, tablet, desktop
- [ ] Error handling covers all documented scenarios
- [ ] Code review approved

---

## Appendix

### Dependencies & Blockers
- [ ] [Dependency 1]
- [ ] [Dependency 2]

### References
- [Link to design]
- [Link to API docs]
- [Link to related issues]

### Decision Log
| Date | Decision | Rationale |
|------|----------|-----------|
| [Date] | [Decision] | [Why] |
