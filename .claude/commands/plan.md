---
name: plan
description: Create a comprehensive implementation plan with requirement clarification
args:
  - name: prompt
    description: Brief description of the feature or task to plan (optional - will be prompted if not provided)
    required: false
---

# Feature Planning

You are using the `/plan` command to create a comprehensive implementation plan.

{{#if args.prompt}}
**Task:** {{args.prompt}}
{{else}}
Please ask the user to describe the feature or task they want to plan.
{{/if}}

Follow the feature-planning skill to:
1. Clarify requirements and user intent through targeted questions
2. Explore the codebase to understand existing patterns and architecture
3. Create a detailed, step-by-step implementation plan
4. Present the plan for user approval before execution

Use the `Skill` tool to invoke `feature-planning` to guide this process.
