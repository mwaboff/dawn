---
name: typescript-angular-readability
description: >-
  Analyzes TypeScript/Angular code for readability issues and applies fixes.
  Use whenever the user wants feedback on TypeScript or Angular code quality,
  structure, or maintainability. This includes explicit review requests, but
  also any situation where the user asks for opinions, suggestions, or
  improvements to existing TypeScript/Angular code. Example triggers: "review
  this component", "refactoring advice", "what can I improve", "clean up this
  code", "code quality feedback", "any issues with this code", "how does this
  look", "critique this", "check this component", "suggestions for this file",
  "improve readability", "review the code in [path]", "refactor this".
version: 2.0.0
---

# Phase 1: Discover Target Code

Before analyzing, identify what code to review.

1. If the user provided a specific path, use that. Otherwise, run `git diff --name-only` and `git diff --cached --name-only` to find recently changed TypeScript/HTML files.
2. If no changes are found, list TypeScript files in the current working directory.
3. Present the discovered files to the user using AskUserQuestion: "I found these files to review: [list]. Should I review all of them, or would you like to select specific files?"
4. Read all confirmed files before proceeding to analysis.

# Phase 2: Analyze Readability

Apply the rules below to the code read in Phase 1. **Project-level conventions (CLAUDE.md, AGENTS.md) take precedence over these rules.** If a rule below conflicts with a project convention, skip it.

Assess severity for each finding based on:
- **Bug risk**: Could this cause runtime errors or incorrect behavior?
- **Maintainability impact**: How much harder does this make future changes?
- **Frequency**: Does this pattern appear in many places across the codebase?

Use these severity levels:
- **Critical**: Likely to cause bugs or silently swallow errors
- **High**: Significantly harms maintainability or readability
- **Medium**: Noticeable readability issue but low bug risk
- **Low**: Style preference or minor improvement

## Readability Rules

### Typing & Values

#### Use Strict Typing
Always use strict typing for all variables and function parameters.

##### Example
```typescript
function calculateTotal(price: number): number {
    const tax: number = 0.1;
    return price + (price * tax);
}
```

#### Avoid Magic Numbers
Never use magic numbers in code. Always define them as constants or enums with descriptive names.

##### Example
```typescript
const TAX_RATE = 0.1;
const DISCOUNT_RATE = 0.15;
const DISCOUNT_THRESHOLD = 100;

function calculateTotal(price: number): number {
    if (price > DISCOUNT_THRESHOLD) {
        return price * (1 - DISCOUNT_RATE);
    }
    return price * (1 + TAX_RATE);
}
```

### Functions

#### Keep Functions Single Responsibility
Keep functions small and focused on a single responsibility. If a function is doing too much, break it down into smaller functions.

##### Example
```typescript
function calculateTotal(price: number): number {
    const tax: number = 0.1;
    return price + (price * tax);
}

function calculateDiscount(price: number): number {
    const discount: number = 0.1;
    return price * (1 - discount);
}
```

#### Few Function Arguments
Keep the number of function arguments to a minimum (2 or less when possible). If a function has too many arguments, consider using an object or a type alias to group them.

##### Example (without type alias)
```typescript
function calculateTotal(price: number, tax: number, discount: number): number {
    return price + (price * tax) - discount;
}
```

##### Example (with type alias)
```typescript
type PriceDetails = {
    price: number;
    tax: number;
    discount: number;
    conversionRate: number;
}

function calculateTotal(details: PriceDetails): number {
    return (details.price + (details.price * details.tax) - details.discount) * details.conversionRate;
}
```

### Conditionals

#### Encapsulate Complex Conditionals
Extract complex conditional logic into well-named functions or methods to improve readability.

##### Example
```typescript
// Instead of this:
if (user.age >= 18 && user.hasLicense && user.hasInsurance) {
    // Process adult driver
}

// Do this:
function isEligibleDriver(user: User): boolean {
    return user.age >= 18 && user.hasLicense && user.hasInsurance;
}
```

#### Avoid Negative Conditionals
Use positive conditionals instead of negative ones when possible.

##### Example
```typescript
// Instead of this:
if (user.isNotAllowed) {
    // throw exception
}

// Do this:
if (!user.isAllowed) {
    // throw exception
}
```

### Classes

#### Keep Classes Small
Keep classes small and focused on a single responsibility. If a class is too large or contains too many methods, break it down into smaller classes.

##### Example
```typescript
// order.service.ts
export class OrderService {
    // Order-related methods only
}

// price.service.ts
export class PriceService {
    // Price-related methods only
}
```

#### Use Private/Protected Members
Use private and protected accessors on class members. Use getters and setters to encapsulate data access.

##### Example
```typescript
export class Currency {
    private _code: string;

    constructor(code: string) {
        this._code = code;
    }

    get code(): string {
        return this._code;
    }

    set code(value: string) {
        this._code = value;
    }
}
```

#### Prefer Method Chaining
Prefer method chaining over multiple separate method calls when it improves readability.

##### Example
```typescript
class PriceBuilder {
    private price: number = 0;
    private tax: number = 0;
    private discount: number = 0;

    setPrice(price: number): this {
        this.price = price;
        return this;
    }

    setTax(tax: number): this {
        this.tax = tax;
        return this;
    }

    setDiscount(discount: number): this {
        this.discount = discount;
        return this;
    }
}

const price = new PriceBuilder()
    .setPrice(100)
    .setTax(0.1)
    .setDiscount(0.05);
```

### Structure

#### Promote Components to Feature Directories
When a component grows beyond a simple, single-purpose view, it should be promoted to a **feature directory** with sub-components, models, and services. This is a **High** severity issue because it compounds over time — the longer a monolithic component lives, the harder it is to break apart.

##### When to promote (trigger if ANY apply):
- The template contains **2+ distinct UI sections** with their own state or logic (e.g., a tab navigation AND a form AND a content area)
- The component manages **unrelated concerns** (e.g., drawer/navigation state alongside form validation)
- The template has **repeated structural patterns** (e.g., the same tab button rendered in both mobile and desktop views)
- The template exceeds ~100 lines or the TypeScript file exceeds ~80 lines
- The component contains **inline data/config** that represents a domain model (e.g., a list of tab definitions, character classes, equipment options)

##### Feature directory structure
```plaintext
src/app/
├── core/
│   ├── services/                        # Shared app-wide services
│   │   └── auth.service.ts
│   └── guards/                          # Route guards
│       └── auth-session.guard.ts
├── features/
│   └── {feature}/
│       ├── {feature}.ts                 # Page-level container component
│       ├── {feature}.html
│       ├── {feature}.css
│       ├── {feature}.spec.ts
│       ├── components/
│       │   ├── {sub-component}/
│       │   │   ├── {sub-component}.ts   # Child component
│       │   │   ├── {sub-component}.html
│       │   │   ├── {sub-component}.css
│       │   │   └── {sub-component}.spec.ts
│       ├── models/
│       │   └── {feature}.model.ts       # Interfaces, types, constants
│       └── services/
│           └── {feature}.service.ts     # Feature-specific business logic
├── layout/
│   ├── navbar/                          # Navigation component
│   └── footer/                          # Footer component
```

##### How to identify extractable sub-components
Look for these patterns in the template:
- **Tab/navigation sections**: Any group of buttons or links used for navigation within the component (mobile drawer, desktop tabs, steppers) → extract to a `tab-nav` component
- **Forms or form sections**: Groups of inputs with their own validation logic → extract to a `{feature}-form` component
- **Repeated `@for` blocks**: Especially when the same `@for` renders in multiple places (e.g., tabs rendered for both mobile and desktop) → extract to a shared component that both views use
- **`@switch`/`@if` content blocks**: Distinct content panels that swap based on state → candidates for child components as they gain real content
- **Inline data arrays or config objects**: Arrays of objects (e.g., tab definitions, option lists) → extract to a `models/` file as typed constants

##### Example: Before (flat component)
```typescript
// create-character.ts — doing too much
export class CreateCharacter {
    mobileDrawerOpen = signal(false);
    activeTab = signal('class');
    tabs = [ { id: 'class', label: 'Class' }, ... ];
    characterForm = this.fb.nonNullable.group({ name: [''], pronouns: [''] });
    // navigation methods, form methods, drawer methods all mixed together
}
```

##### Example: After (feature directory)
```plaintext
src/app/features/create-character/
├── create-character.ts              # Container: composes child components
├── create-character.html            # <app-tab-nav> + <app-character-form> + <router-outlet> or content
├── create-character.css
├── create-character.spec.ts
├── components/
│   ├── tab-nav/
│   │   ├── tab-nav.ts               # Handles tab list rendering, active state, mobile drawer
│   │   ├── tab-nav.html
│   │   ├── tab-nav.css
│   │   └── tab-nav.spec.ts
│   ├── character-form/
│   │   ├── character-form.ts        # Name, pronouns, validation
│   │   ├── character-form.html
│   │   ├── character-form.css
│   │   └── character-form.spec.ts
├── models/
│   └── create-character.model.ts    # Tab interface, CharacterFormField type, tab config constant
└── services/
    └── create-character.service.ts  # API calls, character state management
```

```typescript
// models/create-character.model.ts
export interface Tab {
    id: string;
    label: string;
}

export const CHARACTER_TABS: Tab[] = [
    { id: 'class', label: 'Class' },
    { id: 'heritage', label: 'Heritage' },
    // ...
];
```

```typescript
// components/tab-nav/tab-nav.ts
@Component({ selector: 'app-tab-nav', ... })
export class TabNav {
    readonly tabs = input.required<Tab[]>();
    readonly activeTab = model.required<string>();
}
```

#### Keep Files Small
Keep files small and focused on a single responsibility. If a file is too large or contains unrelated functionality, break it down into smaller files. Use the feature directory structure above as the target when splitting.

### Code Hygiene

#### Find Reusable Patterns
Look for patterns and duplicated code across functions and files that can be extracted into reusable components, services, or utilities.

##### Example
```typescript
// order-utils.ts
export function calculateTax(order: Order): number {
    return order.total * TAX_RATE;
}
```

#### Clean Up Unused Code
Remove unused code, variables, and imports to improve readability. If there is commented-out code that is no longer needed, ask the user if it should be removed.

#### Never Ignore Caught Errors
If nothing should be done, log the error to the console or a logging service.

### Style & Organization

#### Organize Imports
- Alphabetize imports within each group
- Group imports by type, separated by blank lines: external, then internal, then local
- Remove unused imports
- Define import aliases to avoid long relative paths

##### Example
```typescript
// External imports (alphabetized)
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

// Internal imports (alphabetized)
import { AuthService } from '@app/core/services/auth.service';
import { OrderService } from '@app/features/order/order.service';

// Local imports (alphabetized)
import { OrderFormComponent } from './order-form/order-form';
import { OrderSummaryComponent } from './order-summary/order-summary';
```

#### Comments
- Avoid positional markers (such as "HELPER FUNCTIONS" or "MAIN LOGIC")
- Use comments to explain why something is done, not what is done

# Phase 3: Present Findings

Provide your analysis in this format:

```
## Readability Issues Found (sorted by severity)

1. **Issue title**: Description of the issue
   - **Severity**: Critical/High/Medium/Low
   - **Location**: File path and line number
   - **Suggestion**: How to fix it

2. ...

## Recommendations

- General recommendations for improving code readability across the reviewed files
```

After presenting the summary, ask the user how they'd like to proceed using AskUserQuestion with these options:
- **"Fix all"**: Apply all suggested fixes automatically, one by one.
- **"Let me pick"**: Present each issue and let the user accept or skip it.
- **"Walk me through each"**: For each issue, present 2-3 fix options with trade-offs, ask which to apply, then move to the next.

# Phase 4: Apply Fixes

For each approved fix, use the Edit tool to apply the change immediately. Confirm the change was applied before moving to the next issue. If the user chose "Let me pick" or "Walk me through each", use AskUserQuestion for each issue before applying.

# Phase 5: Verification and Summary

After all fixes are applied:

1. **Run the project linter** using the project's lint command. If any unexpected issues are found, alert the user immediately and ask how to proceed before continuing.
2. **Run the project tests** using the project's test command. If any tests fail, alert the user immediately and ask how to proceed before continuing.
3. **Provide a final summary**:
   - List all changes that were made (file, line, what changed)
   - List any issues the user chose to skip
   - Note any remaining recommendations that couldn't be automated
