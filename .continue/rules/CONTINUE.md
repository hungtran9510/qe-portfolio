# CONTINUE.md - Project Guide for [Project Name/Purpose Placeholder]

This document serves as a comprehensive guide for developers working on this project, designed to be consumed by the Continue AI assistant and shared within the development team. It aims to standardize knowledge about the codebase, architecture, and workflows.

---

## 1. 🚀 Project Overview

**Purpose:**
[**ASSUMPTION**: This appears to be a static/documentation website built with Astro, possibly related to showcasing skills or expertise (given surrounding directory names like `.agents/skills`). The primary purpose is to present information in an accessible, modern web format.]

**Key Technologies Used:**
*   **Framework:** Astro (Primary rendering engine)
*   **Language Base:** JavaScript / TypeScript (For logic and configuration)
*   **Styling:** CSS (Managed via `src/styles/`)
*   **Tooling:** Node.js ecosystem managed by `package.json`.

**High-Level Architecture:**
The project follows a standard component-based architecture typical of modern front-end frameworks:
1.  **Pages (`src/pages/`):** These files define the routes and high-level structure of the site (e.g., `index.astro`).
2.  **Components (`src/components/`):** Reusable UI elements are defined here (e.g., `Header.astro`, `Hero.astro`).
3.  **Configuration/Styles:** Global settings and styles are managed in `src/config.ts` and `src/styles/global.css`.

---

## 2. 🛠️ Getting Started

### Prerequisites
*   Node.js (Recommended LTS version)
*   npm or Yarn/pnpm (Package manager)
*   A modern code editor supporting TypeScript/JavaScript.

### Installation Instructions
1.  Clone the repository: `git clone [repository-url]`
2.  Navigate to the project root: `cd [project-name]`
3.  Install dependencies: `npm install` (or equivalent based on `package-lock.json`)

### Basic Usage Examples
**To run the development server:**
```bash
npm run dev # (ASSUMPTION: Assumes a 'dev' script exists in package.json)
```
This starts the live-reloading local environment, usually accessible at `http://localhost:3000`.

### Running Tests
*(**VERIFICATION NEEDED**: No explicit testing framework is immediately obvious from file structure. Please check `package.json` for a `test` script.)*
If tests are set up, run:
```bash
npm test
```

---

## 3. 📂 Project Structure

| Directory/File | Purpose | Notes |
| :--- | :--- | :--- |
| `src/pages/` | Contains the root layout files (the actual routes of the site). | e.g., `index.astro` |
| `src/components/` | Houses all reusable UI components. | Components are often self-contained Astro/TSX modules. |
| `src/styles/` | Global and shared CSS definitions. | Styles are imported into pages/components. |
| `public/` | Static assets that should be served directly (e.g., icons, favicons). | Used for items not processed by the build system. |
| `.astro` files | The core templates mixing HTML with framework logic. | These define the visual structure of the site. |
| `tsconfig.json` | TypeScript configuration file. | Dictates how TS code is compiled or checked. |
| `package.json` | Manages project metadata, scripts, and dependencies. | Essential for setup and tooling. |

**Important Configuration Files:**
*   `astro.config.mjs`: The main configuration entry point for the Astro build system.
*   `src/config.ts`: Centralized location for application-specific constants or environment variable loading.

---

## 4. 🤝 Development Workflow

**Coding Standards / Conventions (General):**
*   Aim for component reusability where possible.
*   Keep components focused on presentation unless state management is necessary.
*   File naming follows PascalCase for components, kebab-case for pages/routes.

**Testing Approach:**
*(**ASSUMPTION**: As this appears to be a static site generator, comprehensive unit testing might be limited or handled primarily through integration tests during the build process. Please clarify if client-side JS logic requires specific unit tests.)*

**Build and Deployment Process:**
1.  **Local Build:** Run `npm run build` (ASSUMPTION). This compiles assets into the production-ready directory (usually `dist/`).
2.  **Deployment:** Deploy the contents of the resulting build folder (`dist/`) to the hosting provider (e.g., Vercel, Netlify).

**Contribution Guidelines:**
1.  Familiarize yourself with existing components before introducing new ones.
2.  If adding a major feature, consider whether it should be a complex component or a page-level modification.
3.  Ensure all necessary documentation updates (`CONTINUE.md`) are made after code changes.

---

## 5. 🧠 Key Concepts

**Domain-Specific Terminology:**
*(**VERIFICATION NEEDED**: As this is currently general-purpose scaffolding, no specific business domain jargon has been identified. Please fill this in if the project relates to a specific industry.)*

**Core Abstractions:**
*   **Component:** A self-contained piece of UI logic (e.g., `Hero.astro`). It encapsulates presentation and localized behavior.
*   **Page:** The top-level structure that aggregates various components into a coherent view for a specific URL.

**Design Patterns Used:**
*   **Composition:** Heavy use of combining smaller, focused components to build larger views. (Standard in modern frontends).

---

## 6. ⚙️ Common Tasks

### Task: Create a new feature component
1.  Create the file under `src/components/` using PascalCase (e.g., `NewFeatureCard.astro`).
2.  Implement necessary styles in related `.css` files or use props passing.
3.  Import and render the new component in the relevant page (`src/pages/*.astro`).

### Task: Update site metadata
1.  Modify constants in `src/config.ts`.
2.  Ensure any required build-time variables are updated in `astro.config.mjs`.

---

## 7. 🚨 Troubleshooting

**Common Issues:**
*   **"File Not Found" during build:** Check imports. Ensure components are correctly aliased or placed relative to the page that uses them.
*   **CSS not applying:** Verify that global styles are being imported into root layouts/components, and check for CSS specificity conflicts.
*   **Build failure:** Run `npm run build` with verbose logging (if available) to pinpoint which file is causing issues before tackling code logic.

**Debugging Tips:**
1.  Use the browser's DevTools console extensively.
2.  If a component fails, comment out its usage in the parent page/component one by one until the issue disappears, thereby narrowing down the scope.

---

## 8. 📚 References

*   [Astro Documentation](https://docs.astro.build/) (Primary framework documentation)
*   [Node.js Documentation] (For runtime environment details)

---
**NOTE TO DEVELOPERS:** This file is a living document. Please review and update sections marked with `[VERIFICATION NEEDED]` or `[ASSUMPTION]` based on the true scope of the project.