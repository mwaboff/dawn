# Question Frameworks for Requirement Clarification

This document provides comprehensive question frameworks for different types of features and domains. Use these to systematically clarify user requirements before creating implementation plans.

## General Requirements (Always Ask)

### Core Functionality
- What is the primary purpose of this feature?
- What problem does it solve for users?
- What are the key user actions/interactions?
- What are the expected inputs and outputs?
- Are there any constraints or limitations?

### Success Criteria
- How will we know this feature is working correctly?
- What are the acceptance criteria?
- What edge cases should be handled?
- What should happen when things go wrong?

### Integration Points
- What existing code/features does this interact with?
- Are there any dependencies on other systems/APIs?
- What data structures or models are involved?
- Does this affect any existing functionality?

## Frontend/UI Features

### Visual Design
- What is the desired look and feel?
- Should this match existing UI patterns or introduce new ones?
- What layout/arrangement is preferred (grid, list, cards, etc.)?
- Are there specific color schemes or theming requirements?
- What responsive behavior is needed (mobile, tablet, desktop)?

### User Interactions
- What actions can users perform?
- What feedback should users receive (loading states, success/error messages)?
- Are there animations or transitions?
- What accessibility considerations are needed (keyboard navigation, screen readers)?
- Are there any keyboard shortcuts?

### State Management
- What data needs to be displayed?
- How should data be fetched/updated?
- Should state persist (localStorage, URL, etc.)?
- What happens when data is loading or fails to load?
- Are there any real-time update requirements?

### Forms and Validation
- What fields are required vs optional?
- What validation rules apply to each field?
- When should validation occur (on blur, on submit, real-time)?
- What error messages should be displayed?
- Should there be auto-save or draft functionality?

## Backend/API Features

### Data Model
- What entities/models are involved?
- What are the relationships between entities?
- What fields are required for each entity?
- What validation rules apply?
- Are there any database migrations needed?

### API Design
- What endpoints are needed (GET, POST, PUT, DELETE)?
- What request/response formats are expected?
- What authentication/authorization is required?
- What query parameters or filters are needed?
- Should responses be paginated?

### Business Logic
- What are the business rules?
- What calculations or transformations are needed?
- Are there any workflow steps or state transitions?
- What happens in error scenarios?
- Are there any background jobs or scheduled tasks?

### Performance and Scale
- What are the expected usage patterns (read/write ratio)?
- Are there any performance requirements (response time, throughput)?
- Should results be cached?
- Are there any rate limiting requirements?
- What are the data retention policies?

## Authentication/Authorization

### User Types
- What user roles exist?
- What permissions does each role have?
- Can users have multiple roles?
- How are roles assigned?

### Access Control
- What resources need protection?
- What actions can each role perform?
- Are there row-level or field-level permissions?
- How should unauthorized access be handled?

### Session Management
- How long should sessions last?
- Should there be "remember me" functionality?
- How should password resets work?
- Are there any multi-factor authentication requirements?

## Integration Features

### Third-Party Services
- What service(s) need to be integrated?
- What credentials/API keys are required?
- How should authentication be handled?
- What error handling is needed for service outages?
- Are there rate limits or quotas?

### Webhooks/Events
- What events should trigger actions?
- What data should be included in webhooks?
- How should webhook failures be handled (retries, dead letter queue)?
- Are there any signature verification requirements?

### Data Sync
- What data needs to be synchronized?
- How often should sync occur?
- What happens if sync fails?
- Should sync be bidirectional?
- How are conflicts resolved?

## Testing and Quality

### Test Coverage
- What unit tests are needed?
- What integration tests are needed?
- Are there any E2E test scenarios?
- What edge cases should be tested?

### Error Scenarios
- What could go wrong?
- How should each error be handled?
- What error messages should users see?
- Should errors be logged or monitored?

### Performance Testing
- Are there any performance benchmarks?
- Should load testing be performed?
- What are the performance success criteria?

## Deployment and Operations

### Configuration
- What configuration options are needed?
- Should configuration differ by environment (dev/staging/prod)?
- Are there any feature flags needed?

### Monitoring
- What metrics should be tracked?
- What alerts should be configured?
- What logging is needed?

### Documentation
- What user-facing documentation is needed?
- What developer documentation is needed?
- Are there any API docs to update?

## Question Sequencing Strategy

### Phase 1: Core Understanding (First Round)
Ask broad, open-ended questions to understand the big picture:
- What is this feature?
- Why is it needed?
- Who will use it?
- How should it work at a high level?

### Phase 2: Specific Details (Second Round)
Drill into specifics based on the feature type:
- Apply domain-specific frameworks (Frontend, Backend, etc.)
- Focus on 3-5 most critical questions per category
- Avoid overwhelming the user with too many questions at once

### Phase 3: Edge Cases and Polish (Final Round)
After core requirements are clear:
- Edge cases and error handling
- Performance and security considerations
- Testing and documentation needs

## Tips for Effective Questioning

### Do:
- Ask one question at a time or group related questions
- Use specific examples to illustrate what you're asking
- Offer options when appropriate (e.g., "Should this be a modal or a sidebar?")
- Acknowledge user answers and build on them
- Adapt questions based on previous answers

### Don't:
- Ask more than 5 questions in a single message
- Ask questions you can reasonably infer from context
- Ask overly technical questions unless the user is technical
- Repeat questions the user has already answered
- Ask questions about implementation details before understanding requirements

## Domain-Specific Quick Guides

### Building a Form
1. What data needs to be collected?
2. What validation rules apply?
3. What should happen on successful submission?
4. What error handling is needed?
5. Should data be saved as a draft?

### Building a Dashboard
1. What metrics/data should be displayed?
2. How should data be organized (cards, charts, tables)?
3. What filters or date ranges are needed?
4. Should data refresh automatically?
5. What interactions are needed (drill-down, export, etc.)?

### Building a CRUD Interface
1. What entity is being managed?
2. What fields should be shown in the list view?
3. What fields should be in the create/edit form?
4. What actions are available (view, edit, delete, etc.)?
5. Should there be search/filter/sort?

### Building an API Endpoint
1. What resource is being accessed?
2. What HTTP method(s) are needed?
3. What authentication is required?
4. What request/response format is expected?
5. What error codes should be returned?

### Building a Background Job
1. What triggers the job (schedule, event, manual)?
2. What work does the job perform?
3. How long might it take?
4. What happens if it fails?
5. Should it be retried?

## Example Question Flows

### Example: User Dashboard Feature

**Round 1: Core Understanding**
- "What information should users see on their dashboard?"
- "Who is the primary user of this dashboard?"
- "What actions should users be able to take from the dashboard?"

**Round 2: Specific Details**
- "Should the dashboard show real-time data or cached data?"
- "What filters or date ranges should users be able to select?"
- "Should any widgets be customizable or is the layout fixed?"

**Round 3: Polish**
- "What should happen when data fails to load?"
- "Should there be any export functionality?"
- "Are there any performance requirements (max load time)?"

### Example: API Integration

**Round 1: Core Understanding**
- "Which API are we integrating with?"
- "What functionality from the API do we need to use?"
- "How will this integration be triggered?"

**Round 2: Specific Details**
- "How should we handle authentication (API key, OAuth, etc.)?"
- "What data needs to be sent to/received from the API?"
- "Should API responses be cached?"

**Round 3: Polish**
- "How should we handle API rate limits?"
- "What should happen if the API is down or returns errors?"
- "Should we log API requests/responses?"

## Conclusion

These frameworks provide a starting point for requirement clarification. Adapt them based on:
- The user's technical level
- The complexity of the feature
- What's already known from context
- The specific domain and technology stack

Focus on asking questions that will meaningfully impact the implementation plan, not on gathering every possible detail upfront.
