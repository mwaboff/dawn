---
globs:
  - "src/**/*.ts"
paths:
  - "src/**/*.ts"
trigger: glob
---

# Testing Standards (Vitest + Angular)

## Setup
- Use Vitest with `TestBed.configureTestingModule()`
- Import standalone components directly in test configuration
- Test files: `{feature}.spec.ts` alongside source files

## Requirements
- All new or modified code must have tests
- All tests must pass before completion
- Target high coverage on logic paths; skip trivial getters/configs

## Structure
- **Arrange-Act-Assert** pattern in every test
- One logical assertion per test
- Descriptive test names explaining the behavior tested

## What to Test
- Component creation and rendering
- Signal state changes and computed derivations
- Form validation (valid, invalid, edge cases)
- Service methods (success and error paths)
- User interactions (clicks, input, keyboard)
- Conditional rendering (`@if` / `@for` outcomes)

## Edge Cases to Cover
- Null/undefined inputs
- Empty strings and arrays
- Boundary values (min/max)
- Error responses (401, 404, 500)

## Commands
```bash
npm run test:only -- src/app/feature/   # Run tests for a specific feature
npm run test:run                        # Run all tests once
npm run test:coverage                   # Coverage report
```
