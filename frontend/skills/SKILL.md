---
name: Frontend Expert React Schedules
description: Guide an agent to design expert-level React frontends for interactive academic scheduling platforms, focusing on clean architecture, soft modern UI, and meaningful animation systems.
---

## Overview

This Skill defines the **expert frontend standards, mental models, and evaluation criteria** for building a **React-based academic scheduling platform** with advanced interaction patterns.

It should be used when an agent needs to:
- Reason about **frontend architecture** for complex interactive systems
- Design **soft, clean, modern UI** using React and Tailwind CSS
- Use **animation as a semantic language** with Framer Motion
- Evaluate or guide frontend quality beyond basic correctness
- Differentiate a project from generic academic CRUD applications

This Skill applies specifically to **schedule-building platforms** with:
- Manual and automatic modes
- Drag & drop interactions
- Visual time-slot reasoning
- API-integrated dynamic data

---

## Project Context

The frontend represents a **cognitively complex system**, not a static interface.

Core characteristics:
- Users work with scraped academic subjects and multiple groups
- Time, availability, and conflict are primary domain concepts
- The UI must help users *reason visually*
- Interaction clarity is more important than feature quantity

The frontend should feel like a **real product**, not a demo.

---

## Core Skill Domains

### 1. Frontend Architecture (Expert Level)

#### Definition
The ability to design a React frontend whose structure mirrors the **problem domain**, separating domain logic, interaction intent, visual presentation, and animation concerns.

#### Why it matters
This project combines:
- Multiple interaction modes
- Derived and constrained state
- Dense visual information
- Continuous user feedback

Without strong architecture, complexity collapses into fragility.

#### Architectural principles to enforce
- Architecture is **domain-oriented**, not view-oriented
- Components represent **concepts**, not screens
- State represents **real conditions**, not UI side effects
- Interaction logic is decoupled from presentation
- Animation is treated as a transition layer, not business logic

#### Signals of expert-level architecture
- The project structure explains itself
- Manual and automatic modes share a clear core
- Changes in rules do not cascade into UI breakage
- The system is extendable without refactoring everything

#### Common failure modes
- “God components”
- Business logic embedded in visual components
- State duplication across views
- Tight coupling between animation and logic

---

### 2. Animation as a Semantic System (Framer Motion)

#### Definition
Using animation as a **language with meaning**, not decoration.

Every movement communicates:
- Possibility
- Validity
- Constraint
- Transition
- Rejection

#### Why it matters
In a scheduling system:
- The user must *understand* availability before acting
- Errors should be prevented visually, not explained after
- Automated results must feel intentional, not arbitrary

#### Core animation principles
- Animations must be **consistent in meaning**
- The same motion always implies the same semantic intent
- Nothing appears or disappears without explanation
- Rhythm is calm, controlled, and intentional (“soft”)

#### Application in Manual Mode
- Dragging communicates intent
- Available slots visually “accept” elements
- Invalid actions gently reject without abrupt feedback
- Previews reduce uncertainty before commitment

#### Application in Automatic Mode
- Results are revealed progressively
- Transitions explain how options differ
- The system feels like it is “thinking”, not dumping output

#### Signals of unique, distinguishable animation
- Users anticipate system behavior
- Motion feels inevitable, not surprising
- The interface feels alive but never noisy
- The project has a recognizable kinetic identity

#### Common failure modes
- Animations applied inconsistently
- Overuse of motion
- Abrupt state changes
- Treating Framer Motion as a visual effect library only

---

### 3. Visual Design & UX (Soft, Clean, Modern)

#### Definition
Designing an interface that reduces cognitive load while handling dense information through clarity, hierarchy, and restraint.

#### Why it matters
Users are making **decisions**, not just clicking.

The UI must:
- Guide attention
- Encode information visually
- Minimize explanation

#### Design principles
- Space is meaningful
- Visual hierarchy is consistent
- Color communicates state, not decoration
- Layout supports time-based reasoning

#### Signals of expert-level UX
- The system is usable without instructions
- Users understand what is possible immediately
- Dense schedules remain readable
- The UI feels calm under complexity

#### Common failure modes
- Pretty but confusing layouts
- Excessive color usage
- Visual inconsistency between modes
- Overdesigned components

---

### 4. Clean Frontend Quality

#### Definition
Maintaining a codebase that reflects professional frontend standards even in an academic context.

#### Why it matters
Quality communicates seriousness and level.

#### Quality indicators
- Clear and intentional naming
- Consistent component responsibilities
- Tailwind used as a system, not inline chaos
- Decisions are explicit and traceable

#### Failure modes
- “It works” mentality
- Visual hacks
- Inconsistent patterns
- Lack of architectural intent

---

### 5. Innovation & Differentiation

#### Definition
Creating a frontend that is clearly **not generic**, avoiding common academic project patterns.

#### Differentiation strategies
- Interactions designed specifically for scheduling
- Visual metaphors for time and conflict
- Motion used to explain logic
- A cohesive product identity

#### Signals of success
- The project does not resemble a template
- The UX feels designed, not assembled
- The frontend stands on its own even without backend inspection

---

## Evaluation Criteria (Global)

A frontend satisfies this Skill if:

- Architecture supports complexity without confusion
- Animation explains the system better than text
- UI remains soft, clean, and readable under load
- Manual and automatic modes feel unified
- The project feels like a real product, not an academic exercise

---

## When to Apply This Skill

Use this Skill when:
- Designing or evaluating a React frontend for scheduling or planning tools
- Guiding an agent to reason about frontend quality at expert level
- Differentiating a project through interaction and architecture
- Prioritizing UX, motion, and structure over raw feature count

Do not use this Skill for:
- Basic React tutorials
- Simple CRUD interfaces
- Backend logic or algorithms
- Low-interaction applications
- Send pull requests and push the changes
