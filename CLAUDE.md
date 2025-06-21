# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack (available at http://localhost:3000)
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

## Architecture Overview

This is a Next.js 15 application using the App Router with TypeScript and Tailwind CSS.

### Key Technologies
- **Next.js 15** with App Router and React 19
- **TypeScript** with strict configuration
- **Tailwind CSS v4** for styling
- **shadcn/ui** components with Radix UI primitives
- **SQLite** database with better-sqlite3
- **next-themes** for dark/light mode support

### Project Structure
- `src/app/` - Next.js App Router pages and layouts
- `src/components/` - Reusable React components
- `src/components/ui/` - shadcn/ui components
- `src/lib/db/` - Database configuration and schemas
- `src/lib/services/` - Business logic services
- `src/hooks/` - Custom React hooks
- `src/store/` - State management
- `src/types/` - TypeScript type definitions

### Database
- Uses SQLite with better-sqlite3 driver
- Database file: `src/lib/db/watchlist.db`
- Database connection configured in `src/lib/db/db.ts`
- Schemas defined in `src/lib/db/schemas/`

### UI Components
- Built with shadcn/ui component library
- Configuration in `components.json`
- Theme support with next-themes
- Uses Lucide React icons
- Tailwind CSS with CSS variables for theming

### Path Aliases
- `@/*` maps to `./src/*`
- Configured in both tsconfig.json and components.json

## Project Memory Structure

For detailed project information, see:
- @.claude/project-context.md - Project vision, goals, and technical stack
- @.claude/current-sprint.md - Active sprint status and next actions

## Session Startup Protocol

**IMPORTANT**: Before starting ANY work, new Claude instances MUST:

1. **Read all memory files** (@.claude/project-context.md and @.claude/current-sprint.md)
2. **Verify git branch** and check if correct branch exists for current task
3. **Confirm understanding** of:
   - Project vision (unified crypto trading dashboard)
   - User's role (experienced frontend dev learning full-stack)
   - Collaboration model (Manager-Developer with teaching focus)
   - Current task and learning objectives
   - Required branch from current-sprint.md
4. **Branch verification protocol**:
   - Check current git branch with `git branch --show-current`
   - Compare with "Active Branch" in current-sprint.md
   - If mismatch: Ask user if they want to switch or create the correct branch
   - If branch doesn't exist: Ask user if they want to create it
5. **Ask clarifying questions** if anything is unclear
6. **Wait for user confirmation** before proceeding with implementation

## Work Classification System

Prefix all work with appropriate tags:

- **[TASK]** - Planned development work from current sprint
- **[BUG]** - Fixing broken functionality
- **[RESEARCH]** - Investigating APIs, tools, or patterns
- **[REFACTOR]** - Improving existing code structure
- **[PLANNING]** - Breaking down new features or modules
- **[LEARNING]** - Teaching/explaining concepts to user

## Teaching Requirements

This is a **collaborative learning project**. When working on any task:

- **Explain the "why"** - Architecture decisions, patterns, best practices
- **Teach concepts** - Backend patterns, crypto APIs, database design
- **Ask for input** - Get user's perspective on design decisions
- **Review together** - Walk through code and explain each part
- **Connect to frontend** - Show how backend connects to frontend concepts

## Communication Rules

**Co-developer Profile**:
- **User**: Experienced frontend developer comfortable with React/TypeScript/UI patterns
- **Claude**: Takes the driving seat on backend/full-stack decisions
- **Approach**: Claude leads implementation without asking for design approval
- **User Focus**: Learning backend concepts through observation and explanation

**Development Flow**:
- **Planning First**: Always explain what you're going to do and how before implementing
- **Wait for Permission**: Get explicit approval from co-dev before making any changes
- **Teaching Focus**: Explain backend concepts, architecture decisions, and reasoning
- **Frontend Connection**: Show how backend connects to frontend patterns user knows
- **Learning Priority**: Co-dev learning takes precedence over speed of implementation

**Mandatory Pre-Implementation Protocol**:
1. **Explain the Plan**: Detail what files you'll create/modify and why
2. **Show the Approach**: Explain the technical approach and patterns you'll use
3. **Teaching Moment**: Connect to concepts the co-dev should understand
4. **Wait for Approval**: Get explicit "go ahead" before making any changes
5. **No Assumptions**: Never assume permission to proceed with implementation

**UI Change Verification Workflow**:
- **No Dev Server Debugging**: Don't start dev servers or try to test UI changes yourself
- **Make Changes First**: Implement the UI changes/components as planned
- **Ask for Verification**: Request user to check if the changes work as expected in their browser
- **Describe Expected Behavior**: Clearly explain what should happen after the change
- **Wait for Confirmation**: Get user feedback before proceeding to next step
- **Example**: "Can you check if the Meteora tab is now enabled and clickable in your browser?"

## GitHub Workflow & Project Management

### Branch Strategy
Create feature branches for focused work that helps Claude understand context:

```bash
# Sprint-based feature branches
git checkout -b feature/unit-testing-setup
git checkout -b feature/service-layer-tests
git checkout -b feature/component-tests
git checkout -b fix/rtk-query-cache-issue
```

**Branch Naming Convention**:
- `feature/` - New functionality or major additions
- `fix/` - Bug fixes and corrections
- `test/` - Adding or updating tests
- `refactor/` - Code improvements without behavior changes
- `docs/` - Documentation updates

### Sprint Creation Guide
**IMPORTANT**: When the co-developer asks you to create a new sprint, use this standardized structure for consistency and discoverability.

Update `.claude/current-sprint.md` with the following template:

```markdown
# Current Sprint: [Sprint Name]

**Status**: [EMOJI] [SPRINT TYPE] - [Brief Description]
**Current Story**: [Main objective/theme of the sprint]
**Active Branch**: `feature/[main-sprint-branch]`

## [Strategy/Domain] & Task Breakdown:
- [ ] Task 1: [Task Name] ([Specialist Role]) **← CURRENT**
  - **Branch**: `feature/[task-branch-name]`
  - [Specific deliverable 1]
  - [Specific deliverable 2]
  - [Technical requirements]
- [ ] Task 2: [Task Name] ([Specialist Role])
  - **Branch**: `feature/[task-branch-name]`
  - [Deliverables...]

## [Domain] Priorities (High to Low):
1. **Critical [Component]** - [Description]
2. **Important [Feature]** - [Description]
3. **Nice-to-have [Enhancement]** - [Description]

## [Technical Domain] Tools & Framework:
**Primary Stack**:
- **[Tool/Library]**: [Purpose and usage]
- **[Framework]**: [Integration approach]

**[Integration] Strategy**:
- **[External API]**: [How to integrate]
- **[Data Source]**: [Processing approach]

## Success Criteria:
- [ ] **[Major Goal 1]** - [Measurable outcome]
- [ ] **[Major Goal 2]** - [Specific deliverable]
- [ ] **[Quality Gate]** - [Testing/validation requirement]
- [ ] **[Learning Goal]** - [Educational objective achieved]

## Next Session Instructions:
**Role to assume**: [Specialist Role for next task]
**Task**: [Specific next action to take]
**Learning goal**: [Concepts to understand/teach]
```

**Sprint Planning Best Practices**:
- **Focused Theme**: Each sprint has a clear technical focus (Testing, Real-time Data, UI/UX, etc.)
- **Role-Based Tasks**: Assign specialist roles to help Claude understand the context and approach
- **Learning Integration**: Every task includes educational objectives for the co-developer
- **Branch Strategy**: One main sprint branch with task-specific feature branches
- **Measurable Outcomes**: Success criteria should be specific and testable
- **Status Tracking**: Clear completion states with emoji indicators for quick visual status

### Issue & Project Planning Template
Create GitHub Issues for each sprint task using this template:

```markdown
## Issue: [Task Name]
**Sprint**: [Current Sprint Name]
**Priority**: High/Medium/Low
**Type**: Feature/Bug/Test/Refactor

### Acceptance Criteria:
- [ ] Specific deliverable 1
- [ ] Specific deliverable 2
- [ ] Tests passing
- [ ] Documentation updated

### Technical Details:
- **Files to modify**: List key files
- **Dependencies**: Any external requirements
- **Learning objectives**: What concepts to understand

### Claude Code Context:
Brief context about what this task involves for better collaboration
```

### Pull Request Template
Create `.github/pull_request_template.md` with:

```markdown
## What Changed
Brief description of the changes made

## Sprint Task
Link to related issue: Closes #[issue-number]
- [ ] Task completed according to acceptance criteria
- [ ] All tests passing
- [ ] Code reviewed and documented

## Testing
- [ ] New tests added for new functionality
- [ ] Existing tests still pass
- [ ] Manual testing completed
- [ ] No breaking changes

## Claude Code Collaboration
- **Key files changed**: List main files modified
- **Architecture impact**: Any structural changes
- **Learning notes**: Key concepts implemented

## Deployment Notes
- [ ] No migration required
- [ ] Environment variables updated (if needed)
- [ ] Ready for merge
```

### Commit Message Standards
Follow conventional commits for better tracking:

- `feat:` - New features
- `fix:` - Bug fixes
- `test:` - Adding/updating tests
- `refactor:` - Code improvements
- `docs:` - Documentation
- `chore:` - Maintenance tasks

Example: `feat: add Jest testing framework with TypeScript support`

## Memories and Guidelines

- **Commit Messages**: Do not use Claude-related messages in commit messages
```

</invoke>