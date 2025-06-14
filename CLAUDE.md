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
2. **Confirm understanding** of:
   - Project vision (unified crypto trading dashboard)
   - User's role (experienced frontend dev learning full-stack)
   - Collaboration model (Manager-Developer with teaching focus)
   - Current task and learning objectives
3. **Ask clarifying questions** if anything is unclear
4. **Wait for user confirmation** before proceeding with implementation

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