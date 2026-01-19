# Lighthouse Chat IDE - User Experience

## Document Overview

### Purpose

This document defines the complete user experience design for Lighthouse Chat IDE (Beacon), including UX strategy, user personas, journey mapping, information architecture, interface specifications, and interaction patterns. It provides the blueprint for creating an intuitive, efficient, and delightful user experience that enables conversational development with complete visual context.

### Scope

This UX document covers:
- UX strategy and design philosophy
- AI-specific UX considerations
- Target user analysis and personas
- Current vs. future state user journeys
- Information architecture and navigation
- UI component specifications for all panels
- Interaction patterns and workflows
- Accessibility and usability standards
- Visual design principles (Phase 6)

This document does NOT cover:
- Implementation details (see 04-Architecture.md)
- Specific technical requirements (see 03-Business-Requirements.md)
- Marketing or sales copy
- Detailed visual mockups (wireframes and descriptions provided)

### Audience

- **UX/UI Designers**: Primary implementation guidance
- **Product Owner**: UX strategy validation and approval
- **Development Team**: Understanding user workflows for implementation
- **QA/Testers**: User acceptance test scenarios
- **Beta Users**: Understanding intended workflows for feedback

## UX Strategy

### Design Philosophy

Lighthouse Chat IDE's user experience is built on the principle of **"Visual First, Conversational Always"**: provide complete visual IDE context while making natural language conversation the primary workflow. The UI should make AI operations transparent, controllable, and confidence-inspiring.

**Core Philosophy Statement**:
*"Developers should feel like they're conversing with a highly competent pair programming partner who can see the same codebase they do, suggests operations clearly, shows all changes visually before applying them, and never takes action without permission."*

#### Core UX Principles

1. **AI Transparency - Users should always understand when and how AI is involved**
   - All AI operations clearly indicated in chat interface
   - File operations highlighted with clickable links
   - Streaming responses show AI's thinking process in real-time
   - No hidden or background AI actions
   - AI suggests, user approves, system executes

2. **Human-AI Collaboration - AI augments rather than replaces human judgment**
   - Manual editing always available alongside AI assistance
   - Users maintain full control with permission system
   - Diff view allows review before acceptance
   - Easy to override or modify AI suggestions
   - Natural conversation feels like working with expert colleague

3. **Visual Context is Essential - Never sacrifice visual awareness for convenience**
   - Three-panel layout keeps all information visible simultaneously
   - File explorer shows complete directory structure
   - Editor displays actual code with syntax highlighting
   - Changes immediately visible in UI (files open, explorer updates)
   - Diff view shows before/after for all modifications

4. **Progressive Disclosure - Show complexity only when needed**
   - Basic operations simple and obvious
   - Advanced features (multi-provider, diff view, settings) easily accessible but not overwhelming
   - Keyboard shortcuts for power users, buttons for beginners
   - Complex tool parameters hidden by default, revealed when relevant

5. **Familiar IDE Patterns - Match VS Code conventions for immediate comfort**
   - Three-panel layout matches VS Code Explorer + Editor
   - Keyboard shortcuts match VS Code (Ctrl+S save, Ctrl+O open, Ctrl+W close tab, etc.)
   - Tab management matches browser tabs
   - Right-click context menus where users expect them
   - Settings UI similar to VS Code preferences

#### AI-Specific UX Considerations

- **Explainability**: AI explains what it's doing before suggesting operations ("I'll read auth.ts to understand how authentication works")
- **Trust Building**:
  - Streaming responses show thinking process (builds confidence)
  - Permission system prevents unwanted changes (users stay in control)
  - Diff view allows visual review (see before accepting)
  - SOC logging creates audit trail (accountability and debugging)
- **Error Recovery**:
  - Users can deny any operation
  - Undo/redo in editor for manual changes
  - Change management (Phase 5) tracks AI modifications
  - Clear error messages when operations fail, AI can retry with different approach
- **Learning Feedback**: System learns user preferences implicitly (e.g., frequently approved operations could get auto-approval option in future)

### Target User Analysis

#### Primary User Persona: Professional Developer (Alex Chen)

- **Demographics**: 32 years old, Senior Full-Stack Developer, 8 years professional experience, Computer Science degree
- **Technical Background**: Expert in JavaScript/TypeScript, React, Node.js; comfortable with Python and Go; uses VS Code daily
- **Goals**:
  - Understand unfamiliar codebases quickly (< 1 hour vs. 2-4 hours currently)
  - Implement features efficiently with AI assistance (30-50% faster)
  - Refactor code confidently without introducing bugs
  - Maintain code quality and consistency across projects
- **Pain Points**:
  - Spends 30-40% of time navigating and understanding code rather than building
  - Repetitive refactoring tasks are tedious (find-replace across 20 files)
  - Context-switching between terminal, editor, and AI chat tools breaks flow
  - Terminal-based AI tools don't show changes until after execution (trust issue)
- **Behaviors**:
  - Opens VS Code first thing in morning, keeps it open all day
  - Uses GitHub Copilot for code completion, ChatGPT for explanations
  - Frequently greps for patterns, opens 10-15 files simultaneously
  - Prefers keyboard shortcuts over mouse clicks
  - Values productivity and tool quality highly
- **Technology Comfort**: Very high - comfortable with CLI, APIs, new tools; early adopter of useful technologies
- **Context of Use**: Office desk with 27" 1440p monitor, 8-hour development sessions, needs to context-switch between multiple projects daily
- **Success Metrics**:
  - Completes features 30-50% faster
  - Spends < 20% of time on codebase navigation (down from 30-40%)
  - Uses tool for 70%+ of development sessions
  - Rates tool 8+/10 for productivity improvement

#### Secondary User Persona: Lighthouse Consultant (Jordan Martinez)

- **Demographics**: 38 years old, Senior Consultant, 12 years experience including 5 years with Lighthouse, MBA + CS background
- **Technical Background**: Strong architect-level understanding; expert in Lighthouse methodology, SOC, wave planning; proficient in multiple languages
- **Goals**:
  - Demonstrate Lighthouse tooling advantages to clients during sales and onboarding
  - Maintain SOC traceability throughout development (100% of activities logged)
  - Train client teams on agentic development in < 2 days
  - Deliver projects with complete compliance documentation (PCI, HIPAA)
- **Pain Points**:
  - Clients skeptical of AI development maintaining quality and governance
  - Manual documentation for compliance takes 4-6 hours per week
  - Teaching conversational development to teams unfamiliar with AI
  - Need to demonstrate ROI and governance to get client buy-in
- **Behaviors**:
  - Frequently demos tools to clients (presentations, live coding)
  - Documents everything for deliverables and audits
  - Trains teams on Lighthouse practices as part of engagements
  - Needs tools to work reliably during demos (no embarrassing failures)
- **Technology Comfort**: High - understands architecture and tools deeply; focuses on enterprise governance
- **Context of Use**: Client sites and remote calls, needs professional-looking UI for demos, variable network quality, must work reliably in high-stakes presentations
- **Success Metrics**:
  - Clients approve AI development after seeing governance features
  - Eliminates 4-6 hours/week of manual documentation
  - Successfully trains 90%+ of client teams
  - Tool cited as key differentiator in 50%+ of engagements

#### Tertiary User Persona: Junior Developer (Sam Patel)

- **Demographics**: 24 years old, Junior Developer, 1 year professional experience, recent bootcamp graduate
- **Technical Background**: Solid JavaScript fundamentals; learning React and TypeScript; new to large codebases and enterprise patterns
- **Goals**:
  - Learn codebases faster through AI explanations (3-5 days vs. 2-3 weeks)
  - Complete assigned tasks confidently without constant senior developer help
  - Understand best practices and patterns
  - Grow technical skills through AI-assisted learning
- **Pain Points**:
  - Overwhelmed by large codebases (don't know where to start)
  - Uncertain about correct approaches (fear of doing it wrong)
  - Slow at finding relevant files and understanding patterns
  - Reluctant to ask senior developers too many questions
- **Behaviors**:
  - Uses ChatGPT frequently for learning and explanations
  - Opens many documentation tabs while coding
  - Takes detailed notes on patterns and approaches
  - Cautious about making changes (double-checks everything)
- **Technology Comfort**: Moderate - comfortable with basic tools, still learning advanced IDE features and workflows
- **Context of Use**: Office desk or remote, smaller screen (13" laptop), learns best through examples and explanations, benefits from visual guidance
- **Success Metrics**:
  - Onboarding time reduced from 2-3 weeks to 3-5 days
  - Completes 2x more tasks per sprint
  - Confidence level increases from 60% to 90%
  - Reduces questions to senior developers by 50%

### User Journey Mapping

#### Current State Journey: Professional Developer (Alex)

**Scenario**: Understanding how authentication works in unfamiliar codebase

```
Steps:
1. Open project in VS Code
2. Search project for "auth" keyword (Ctrl+Shift+F)
3. Browse through 20+ results trying to find main authentication logic
4. Open 5-6 promising files in tabs
5. Read through each file trying to piece together the flow
6. Take notes in separate document or mental notes
7. Maybe copy code snippets to ChatGPT for explanation
8. Manually apply insights from ChatGPT to code if making changes
9. Close unneeded tabs, continue with actual implementation

Timeline: 2-3 hours
Pain Points:
- Too many search results, hard to identify key files
- Must piece together understanding from multiple files manually
- Context-switching to ChatGPT breaks flow
- Notes get lost or become outdated
- No persistent understanding to reference later
```

#### Future State Journey: Professional Developer (Alex) with Lighthouse Chat IDE

**Scenario**: Understanding how authentication works in unfamiliar codebase

```
Steps:
1. Open Lighthouse Chat IDE with project
2. Type in chat: "Read the authentication module and explain how it works"
3. AI searches codebase, finds auth-related files
4. Files automatically open in editor as AI references them
5. AI provides clear explanation with file citations (clickable links)
6. Ask follow-up: "Show me where users are validated"
7. AI opens specific function, explains validation logic
8. Conversation persists - can reference later or share with team

Timeline: 15-30 minutes (80-90% time reduction)
Benefits:
- AI finds relevant files automatically
- Explanations linked directly to code (click to view)
- Conversation captures understanding (searchable, persistent)
- No context-switching (everything in one tool)
- Can immediately ask follow-ups for clarification
```

#### Current State Journey: Junior Developer (Sam)

**Scenario**: Learning new codebase during onboarding

```
Steps:
1. Senior developer walks through codebase verbally
2. Sam takes notes, tries to remember file locations
3. Senior developer leaves, Sam tries to apply learning
4. Searches for files based on notes, often gets lost
5. Opens many files trying to understand relationships
6. Asks senior developer for help frequently (feels embarrassed)
7. Spends hours navigating and re-learning over 2-3 weeks

Timeline: 2-3 weeks to feel comfortable
Pain Points:
- Verbal explanation hard to retain
- Difficult to re-find files and patterns
- Fear of making mistakes
- Feels like bothering senior developers with questions
```

#### Future State Journey: Junior Developer (Sam) with Lighthouse Chat IDE

**Scenario**: Learning new codebase during onboarding

```
Steps:
1. Senior developer introduces tool, demonstrates basic usage
2. Sam asks AI: "Explain the project structure"
3. AI provides overview with file organization and key directories
4. Sam explores conversationally: "Show me how user registration works"
5. AI walks through flow, opening relevant files automatically
6. Sam saves conversations as learning reference
7. Asks AI whenever confused, no judgment or interruption of senior devs

Timeline: 3-5 days to feel comfortable (70-80% reduction)
Benefits:
- AI available 24/7 for questions (no bothering coworkers)
- Can ask "dumb questions" without embarrassment
- Visual + conversational learning (multiple modalities)
- Persistent conversations become onboarding documentation
- Builds confidence through immediate feedback
```

### User Experience Goals

#### Primary UX Goals

1. **Goal**: Reduce time to find information from 15 minutes to < 30 seconds
   - **Current State**: Developer searches, opens files, reads through code, pieces together understanding (avg 15 min per query)
   - **Target State**: Ask AI in natural language, get answer with file citations in < 30 seconds
   - **Measurement**: Track time from question to answer in user testing; target 95%+ of queries answered in < 30 seconds

2. **Goal**: Increase developer confidence in AI-suggested changes from 60% to 95%
   - **Current State**: Terminal AI tools don't show changes until after execution; developers uncertain and cautious (60% confidence in surveys)
   - **Target State**: Diff view shows all changes before acceptance; permission system prevents unwanted operations (95% confidence)
   - **Measurement**: User surveys on confidence level; acceptance rate of AI suggestions; rejection/modification rate

3. **Goal**: Achieve 70% weekly active usage within 3 months of MVP
   - **Current State**: N/A (new tool)
   - **Target State**: Tool becomes part of daily workflow for 70%+ of Lighthouse developers
   - **Measurement**: Track weekly active users (WAU); session frequency; feature usage patterns

4. **Goal**: Match or exceed VS Code satisfaction ratings (NPS > 60 by Phase 6)
   - **Current State**: N/A (new tool)
   - **Target State**: Users rate tool equivalent to or better than VS Code for development productivity
   - **Measurement**: NPS surveys; satisfaction ratings (CSAT); comparative ratings vs. other IDEs

#### Secondary UX Goals

1. **Goal**: Enable new users to complete first AI operation within 10 minutes
   - **Measurement**: Onboarding time tracking; first-operation completion rate

2. **Goal**: Achieve < 5% error rate for AI file operations
   - **Measurement**: Operation success rate; error logs; user reports

3. **Goal**: Reduce manual compliance documentation time from 4-6 hours/week to near-zero
   - **Measurement**: Time tracking for Lighthouse consultants; SOC logging verification

## Information Architecture

### Application Navigation Structure

**Note**: Panels are **fully customizable and moveable**. Default layout shown below, but users can drag panels to rearrange (e.g., swap Editor and Chat positions). Layout preferences are saved per user.

```
Lighthouse Chat IDE Root (Default Layout)
│
├── Left Panel: File Explorer
│   ├── Root Directory Selector (button/dropdown)
│   ├── Directory Tree (expandable/collapsible)
│   │   ├── Folders (expand/collapse on click)
│   │   └── Files (click to open in editor)
│   └── Explorer Actions (Phase 5+)
│       ├── New File
│       ├── New Folder
│       ├── Refresh
│       └── Search/Filter
│
├── Center Panel: Code Editor (MOVEABLE)
│   ├── Tab Bar
│   │   ├── File Tabs (multiple open files)
│   │   ├── Close Tab (X button)
│   │   └── Unsaved Indicator (* in tab title)
│   ├── Monaco Editor Area
│   │   ├── Line Numbers
│   │   ├── Syntax Highlighting
│   │   └── Code Editing
│   └── Editor Actions
│       ├── Save (Ctrl+S/Cmd+S)
│       └── Find/Replace (Ctrl+F)
│
├── Right Panel: AI Chat Interface (MOVEABLE)
│   ├── Chat Header
│   │   ├── Provider Indicator (current AI provider)
│   │   ├── Model Selector (dropdown)
│   │   └── New Conversation (button)
│   ├── Message History (scrollable)
│   │   ├── User Messages (right-aligned, blue)
│   │   ├── AI Messages (left-aligned, gray)
│   │   ├── Code Blocks (syntax highlighted)
│   │   └── File Links (clickable, opens in editor)
│   ├── Input Area
│   │   ├── Text Input (multi-line, auto-resize)
│   │   └── Send Button (or Enter to send)
│   └── Chat Actions (Phase 4+)
│       ├── Conversation History (sidebar/dropdown)
│       ├── Save Conversation
│       └── Search Conversations
│
└── Panel Customization (Phase 1+)
    ├── Drag panel headers to reorder (Phase 6)
    ├── Resize panels by dragging dividers (Phase 1)
    ├── Layout presets: "Editor Focus", "AI Focus", "Balanced" (Phase 6)
    └── Layout preferences saved and restored (Phase 6)
│
├── Status Bar (Phase 6) - Bottom
│   ├── Current AI Provider & Model
│   ├── Permission Status
│   ├── Active Operations Indicator
│   ├── File Path & Position
│   └── Quick Settings Access
│
└── Modal Overlays
    ├── Permission Prompt (approve/deny operations)
    ├── Settings Panel (Phase 4+)
    ├── Diff View (Phase 5+)
    └── Error Messages/Notifications

```

### Panel Size Defaults and Ranges

**Default Layout** (on first launch):
- Left Panel (File Explorer): 20% of window width
- Center Panel (Code Editor): 45% of window width
- Right Panel (AI Chat): 35% of window width

**Customization** (User Preference):
- Panels are **moveable**: Drag panel headers to reorder (Phase 6)
- Users can swap Editor and Chat positions (e.g., Chat on right, Editor in center)
- Layout preferences saved per user and restored on application restart
- Layout presets available (Phase 6): "Editor Focus" (60/20/20), "AI Focus" (20/20/60), "Balanced" (20/40/40)

**Resizable Ranges**:
- Minimum panel width: 15% of window (prevents unusably narrow panels)
- Maximum panel width: 70% of window (ensures other panels remain visible)
- Resize by dragging dividers between panels (Phase 1)
- Real-time resize preview as you drag

**Responsive Behavior**:
- Minimum window width: 1024px (below this, warn user to resize)
- Optimal window width: 1920px+ (full HD or larger)
- Panels collapse gracefully on smaller screens (sequential priority: Editor > Chat > Explorer)

## User Interface Specifications

### Left Panel: File Explorer

**Purpose**: Display project directory structure for navigation and file selection

**Layout**:
```
┌─────────────────────────┐
│ Root: /Users/dev/proj   │ ← Root path display + selector
│ [Change Root]           │
├─────────────────────────┤
│ 📁 src/                 │ ← Expandable folders
│   📁 components/        │
│     📄 Header.tsx       │ ← Files (click to open)
│     📄 Footer.tsx       │
│   📁 services/          │
│     📄 api.ts           │
│ 📁 tests/               │
│ 📄 README.md            │
│ 📄 package.json         │
└─────────────────────────┘
```

**Interactions**:
- **Click folder**: Expand/collapse folder (show/hide children)
- **Click file**: Open file in editor (new tab if not already open)
- **Right-click** (Phase 5+): Context menu (New File, New Folder, Rename, Delete, Reveal in Finder)
- **Drag-and-drop** (Phase 5+): Reorder files or move between folders
- **Search/Filter** (Phase 5+): Search input at top, filters tree as you type

**Visual Feedback**:
- **Selected file**: Highlighted background color
- **Expanded folder**: Folder icon changes (closed → open)
- **Modified file** (Phase 5+): Orange dot indicator
- **AI-created file** (Phase 3+): Green highlight for 3 seconds, then fades

**Performance**:
- Virtual scrolling for 1000+ files (render only visible items)
- Lazy load folder contents (fetch children only when expanded)
- Icon caching for file types

### Center Panel: Code Editor

**Purpose**: Display and edit code files with professional editor features

**Note**: In default layout, Editor is in center panel. Users can move panels in Phase 6.

**Layout**:
```
┌─────────────────────────────────────┐
│ auth.ts  Header.tsx*  Footer.tsx   │ ← Tabs (active, unsaved*, inactive)
│ [X]      [X]          [X]           │
├─────────────────────────────────────┤
│ 1  import { jwt } from 'jsonwebtoken'│
│ 2  import { User } from './models'  │ ← Monaco editor
│ 3                                    │   with line numbers
│ 4  export function authenticateUser(│   and syntax highlighting
│ 5    token: string                  │
│ 6  ): User | null {                 │
│ 7    try {                           │
│ 8      const payload = jwt.verify...│
│ ...                                  │
└─────────────────────────────────────┘
```

**Interactions**:
- **Click tab**: Switch to that file
- **Click X on tab**: Close file (prompt if unsaved)
- **Ctrl+S / Cmd+S**: Save current file
- **Ctrl+F**: Find within file
- **Ctrl+W**: Close current tab
- **Ctrl+Tab**: Switch to next tab
- **Edit text**: Normal typing, cursor movement, selection
- **Right-click**: Context menu (Cut, Copy, Paste, Go to Definition, etc.)

**Visual Feedback**:
- **Active tab**: Highlighted background
- **Unsaved changes**: Asterisk (*) in tab title, filled circle indicator
- **Syntax highlighting**: Color-coded by language
- **Line highlights**: Current line has subtle background color
- **Modified lines** (Phase 5+): Yellow gutter indicator for AI modifications

**Editor Features** (Monaco Built-In):
- Syntax highlighting for 50+ languages
- IntelliSense autocomplete
- Go to definition (Ctrl+Click)
- Find and replace
- Multi-cursor editing
- Code folding (Phase 5+)
- Minimap (Phase 5+)

### Right Panel: AI Chat Interface

**Purpose**: Conversational interface for interacting with AI about codebase

**Note**: In default layout, AI Chat is in right panel. Users can move panels in Phase 6.

**Layout**:
```
┌─────────────────────────────────────┐
│ Claude Sonnet 4 ▼ [New Chat]      │ ← Header: provider, model, new chat
├─────────────────────────────────────┤
│                                     │
│ USER (2:34 PM):                     │ ← User message (right-aligned)
│ Read the authentication module     │
│                                     │
│ AI (2:34 PM):                       │ ← AI message (left-aligned)
│ I'll read the authentication       │   Streaming in real-time
│ module. Let me check auth.ts...    │
│                                     │
│ [Reading: src/auth.ts]              │ ← File operation indicator
│                                     │
│ The authentication module uses      │
│ JWT tokens. See auth.ts:15-42.     │ ← File link (clickable)
│                                     │
│ 📄 auth.ts (lines 15-42)           │ ← Clickable file reference
│                                     │
├─────────────────────────────────────┤
│ Ask me anything...                  │ ← Input field
│ [Send]                              │ ← Send button
└─────────────────────────────────────┘
```

**Interactions**:
- **Type message**: Multi-line text input (Enter sends, Shift+Enter new line)
- **Send message**: Click Send button or press Enter
- **Click file link**: Opens file in editor, scrolls to mentioned line
- **Click code block**: Copy code to clipboard option
- **Provider dropdown**: Select AI provider (Claude, GPT, Gemini, Ollama)
- **Model dropdown**: Select model for current provider
- **New Chat button**: Start fresh conversation

**Visual Feedback**:
- **AI typing indicator**: Animated dots while AI is thinking
- **Streaming**: AI response appears word-by-word in real-time
- **File operations**: Highlighted differently (e.g., "[Reading: auth.ts]" in gray box)
- **Code blocks**: Syntax highlighting, copy button on hover
- **Errors**: Red background for error messages

**Streaming Behavior**:
- Display tokens as they arrive (no waiting for complete response)
- Auto-scroll to bottom as new content appears
- Allow user to scroll up (pauses auto-scroll) and resume (resumes auto-scroll)
- Smooth animation (60 FPS target)

### Modal Overlays

#### Permission Prompt (Phase 2+)

**Purpose**: Request user approval before AI executes file operations

**Layout**:
```
┌───────────────────────────────────┐
│ AI wants to modify a file         │ ← Title
├───────────────────────────────────┤
│                                   │
│ Operation: Write file             │ ← Operation type
│ File: src/services/user.ts       │ ← File path
│                                   │
│ Preview:                          │ ← Content preview (first 10 lines)
│ export class UserService {       │
│   async createUser(data: User)   │
│   ...                             │
│                                   │
│ [Deny]              [Approve]     │ ← Action buttons
└───────────────────────────────────┘
```

**Interactions**:
- **Approve button**: Execute operation, close modal
- **Deny button**: Abort operation, close modal, inform AI
- **Click outside** (Phase 3+): Same as Deny (explicit denial required)
- **Escape key**: Same as Deny

**Visual Design**:
- Semi-transparent backdrop (dims background)
- Centered modal (400px width)
- Clear approve/deny buttons (green/red)
- Dangerous operations (delete, bash) have extra warning text

#### Settings Panel (Phase 4+)

**Purpose**: Configure AI providers, application settings, permissions

**Layout**:
```
┌─────────────────────────────────────┐
│ Settings                     [X]    │ ← Title + close button
├─────────────────────────────────────┤
│ AI Providers                        │ ← Tab navigation
│ Permissions                         │
│ Appearance                          │
│ Keyboard Shortcuts                  │
├─────────────────────────────────────┤
│ [Selected Tab Content]              │ ← Tab content area
│                                     │
│ AI Providers Tab:                   │
│ ✓ Anthropic Claude                  │ ← Checkboxes for providers
│   API Key: ••••••••  [Edit]         │
│   Default Model: claude-sonnet-4 ▼  │
│                                     │
│ ✓ OpenAI GPT                        │
│   API Key: ••••••••  [Edit]         │
│   Default Model: gpt-4-turbo ▼      │
│                                     │
│ [Save Changes]                      │ ← Save button
└─────────────────────────────────────┘
```

#### Diff View (Phase 5+)

**Purpose**: Show AI-proposed changes with accept/reject controls

**Layout**:
```
┌─────────────────────────────────────┐
│ Review Changes: auth.ts      [X]    │
├─────────────────────────────────────┤
│ Before          │ After             │ ← Side-by-side diff
├─────────────────┼───────────────────┤
│ 15 function auth│ 15 function auth  │
│ 16   token: str │ 16   token: str   │
│ 17   const user │ 17   const user   │
│                 │ 18   console.log  │ ← Green: addition
│ 18 }            │ 19 }              │
│                                     │
│ [Reject]  [Accept This Change]      │ ← Per-change controls
│                                     │
│ [Reject All]    [Accept All Changes]│ ← Batch controls
└─────────────────────────────────────┘
```

## Interaction Patterns and Workflows

### Primary Workflow: Conversational File Operations

**Pattern**: User describes operation → AI suggests execution → User approves → AI executes → Visual feedback

**Example Flow**:
```
1. USER types: "Create a new user service with CRUD operations"
2. AI responds: "I'll create a UserService class. I'll write it to src/services/user.ts"
3. [Permission prompt appears]
   Operation: Write file
   File: src/services/user.ts
   Preview: [Shows code to be written]
4. USER clicks [Approve]
5. File created → appears in file explorer (green highlight)
6. File automatically opens in editor (new tab)
7. AI responds: "Created UserService with create, read, update, delete methods. See user.ts."
8. USER can click "user.ts" link in chat to jump to specific lines
```

### Secondary Workflow: Manual Editing with AI Assistance

**Pattern**: User opens file manually → edits manually → asks AI for help → AI suggests improvements

**Example Flow**:
```
1. USER clicks auth.ts in file explorer
2. File opens in editor tab
3. USER makes some manual edits (adds logging)
4. USER types in chat: "Review my logging implementation"
5. AI reads current file state automatically
6. AI responds with suggestions: "Your logging looks good. Consider adding error levels..."
7. USER applies suggestions (either manually or asks AI to apply)
```

### Tertiary Workflow: Codebase Exploration

**Pattern**: User asks about codebase → AI explores and explains → User asks follow-ups

**Example Flow**:
```
1. USER: "How does user authentication work in this project?"
2. AI: [Searches, finds auth.ts, reads it]
   "Authentication uses JWT tokens. See auth.ts:15-42 for the main logic."
3. [auth.ts opens automatically in editor, scrolls to line 15]
4. USER: "Where are tokens validated?"
5. AI: "Token validation is in auth.ts:28-35. It uses jsonwebtoken library."
6. [Editor scrolls to line 28]
7. USER: "Show me how tokens are stored"
8. AI: [Searches, finds session.ts]
   "Tokens are stored in Redis. See session.ts:50-65."
9. [session.ts opens in new tab]
```

## Accessibility and Usability Standards

### Accessibility (WCAG 2.1 Level AA Target - Phase 6)

- **Keyboard Navigation**: All UI accessible via keyboard (Tab, Enter, Escape, Arrow keys)
- **Screen Reader Support**: ARIA labels on all interactive elements
- **Color Contrast**: 4.5:1 minimum contrast ratio for text
- **Focus Indicators**: Clear focus outlines on all focusable elements
- **Alt Text**: All icons have descriptive labels
- **Resizable Text**: UI remains functional at 200% text zoom

### Usability Standards

- **Response Time**: UI responds to interactions within 100ms
- **Error Prevention**: Unsaved changes prompt before closing, dangerous operations require confirmation
- **Error Recovery**: Clear error messages with actionable guidance, undo available where appropriate
- **Consistency**: UI patterns consistent throughout application (e.g., all modals have X close button in top right)
- **Help and Documentation**: Tooltips on hover, keyboard shortcut cheatsheet (Ctrl+?), link to docs from settings

## Visual Design Principles (Phase 6)

### Color Palette

**Light Theme**:
- Background: #FFFFFF (white)
- Panel borders: #E0E0E0 (light gray)
- Selected item: #E3F2FD (light blue)
- Text: #212121 (dark gray)
- AI messages: #F5F5F5 (light gray background)
- User messages: #E3F2FD (light blue background)

**Dark Theme**:
- Background: #1E1E1E (dark gray)
- Panel borders: #3C3C3C (medium gray)
- Selected item: #37373D (lighter gray)
- Text: #CCCCCC (light gray)
- AI messages: #252526 (slightly lighter gray)
- User messages: #1E3A5F (dark blue)

### Typography

- **Primary Font**: System font stack (SF Pro on macOS, Segoe UI on Windows, Ubuntu on Linux)
- **Monospace Font**: JetBrains Mono or SF Mono (for code editor)
- **Font Sizes**:
  - Headers: 18px
  - Body text: 14px
  - Code: 13px
  - Small labels: 12px

### Spacing and Layout

- **Padding**: 8px, 16px, 24px, 32px (consistent scale)
- **Border Radius**: 4px for most elements, 8px for modals
- **Panel Dividers**: 1px solid border
- **Icon Size**: 16px or 20px (consistent throughout)

## Document Information

- **Created By**: Claude (AI Assistant) + Roy Love
- **Creation Date**: January 19, 2026
- **Last Updated**: January 19, 2026
- **Version**: 1.0 (Lighthouse IDF Artifact)
- **Next Review Date**: After Phase 1 implementation (validate UX in working application)
- **Approval Status**: Draft - Awaiting Review
- **Source Documents**: PRODUCT-SUMMARY.md, REQUIREMENTS.md
- **Related Documents**: 01-Product-Vision.md, 02-Product-Plan.md, 03-Business-Requirements.md, 04-Architecture.md
