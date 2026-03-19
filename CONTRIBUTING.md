# CONTRIBUTING.md — Contributing to SatuIdentitas

Thank you for your interest in contributing to SatuIdentitas. This document covers how to report bugs, propose features, submit code, and follow the project's conventions.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Ways to Contribute](#ways-to-contribute)
- [Development Workflow](#development-workflow)
- [Code Conventions](#code-conventions)
- [Commit Message Format](#commit-message-format)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Project Architecture](#project-architecture)
- [Areas That Need Help](#areas-that-need-help)

---

## Getting Started

Before contributing, set up the project locally:

```bash
git clone https://github.com/mrbrightsides/satu-identitas.git
cd satu-identitas
npm install
cp .env.example .env
# Fill in your .env values (see SETUP.md)
npm run db:push
npm run dev
```

Full setup instructions are in [SETUP.md](./SETUP.md).

---

## Ways to Contribute

### Bug Reports

Open an issue on GitHub with:
- A clear title describing the problem
- Steps to reproduce
- Expected vs. actual behavior
- Browser, OS, and MetaMask version (if relevant)
- Console errors or screenshots if applicable

### Feature Requests

Open an issue with the label `enhancement`. Describe:
- The problem or use case you're addressing
- How the feature would work from the user's perspective
- Any relevant technical considerations

### Code Contributions

1. Check existing issues before starting — comment on one to claim it
2. For large changes, open an issue first to discuss the approach
3. Fork the repository and create a feature branch
4. Submit a pull request following the guidelines below

### Documentation

Improvements to `README.md`, `SETUP.md`, `API.md`, `CONTRIBUTING.md`, or inline code comments are always welcome.

---

## Development Workflow

### Branching

```bash
# Create a feature branch from main
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

Branch naming conventions:
- `feature/` — new features
- `fix/` — bug fixes
- `docs/` — documentation only
- `refactor/` — code restructuring without behavior change
- `chore/` — tooling, dependencies, config

### Running the Dev Server

```bash
npm run dev
```

The server runs on port 5000. Both the API and frontend are served from the same origin — no proxy configuration needed.

### Database Changes

If you modify `shared/schema.ts`, push the new schema to your local database:

```bash
npm run db:push
```

> Never manually write SQL migration files. Always use `npm run db:push` to sync the schema.

---

## Code Conventions

### TypeScript

- All files must be TypeScript (`.ts` / `.tsx`) — no plain JavaScript
- Avoid `any` unless explicitly justified with a comment
- Export types from `shared/schema.ts` rather than defining inline types
- Use Zod schemas from `shared/schema.ts` to validate all API request bodies

### Frontend (React)

- Pages go in `client/src/pages/`
- Shared components go in `client/src/components/`
- Data fetching uses **TanStack Query v5** — do not use `useEffect` + `fetch` for data loading
- Forms use `react-hook-form` with `zodResolver` — no uncontrolled inputs
- Routing uses **Wouter** — do not manipulate `window.location` directly
- Use `import.meta.env.VITE_*` for environment variables on the frontend, not `process.env`
- Do not explicitly import React — the Vite JSX transformer handles it automatically

### Backend (Express)

- All route handlers go in `server/routes.ts`
- All database operations go through `server/storage.ts` — no raw SQL in route handlers
- Validate all request bodies with Zod before passing to storage methods
- Keep route handlers thin — business logic belongs in storage or helper modules

### Styling

- Use Tailwind utility classes
- Use `shadcn/ui` components from `@/components/ui/` where possible
- Use `lucide-react` for icons; use `react-icons/si` for brand logos only
- Custom CSS variables in `index.css` use the format: `--var: H S% L%` (HSL, space-separated, no `hsl()` wrapper)
- Always pair light and dark mode variants for non-utility colors: `className="bg-white dark:bg-black"`

### Test IDs

Add `data-testid` attributes to every interactive element and meaningful display element:

```tsx
// Interactive elements: {action}-{target}
<Button data-testid="button-submit-register">Register</Button>
<Input data-testid="input-nik-number" />

// Display elements: {type}-{content}
<p data-testid="text-did-value">{did}</p>

// Repeated elements: {type}-{description}-{id}
<Card data-testid={`card-identity-${identity.id}`} />
```

---

## Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body]
```

**Types:**

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change without behavior change |
| `style` | Formatting, whitespace |
| `chore` | Tooling, dependencies, config |
| `test` | Tests only |

**Examples:**

```
feat(api): add batch DID verification endpoint
fix(register): save txHash to DB after blockchain registration
docs(api): document /api/chat endpoint
refactor(storage): extract overstay query into dedicated method
```

---

## Pull Request Guidelines

1. **One concern per PR** — don't mix unrelated changes
2. **Reference the issue** — include `Closes #123` in the PR description if applicable
3. **Keep diffs small** — large PRs are hard to review and slow to merge
4. **Test your changes** — verify the feature works end-to-end in the browser
5. **Update documentation** — if you change API behavior, update `API.md`; if you change setup steps, update `SETUP.md`
6. **No secrets in code** — never commit API keys, JWTs, or private keys; use `.env` (which is gitignored)

### PR Description Template

```markdown
## What this PR does
Brief description of the change.

## Why
What problem does it solve or what value does it add?

## How to test
Steps to verify the change works correctly.

## Related issues
Closes #
```

---

## Project Architecture

Understanding the codebase helps you contribute more effectively:

```
shared/schema.ts         ← Start here. All database models and Zod schemas.
shared/routes.ts         ← Typed route path definitions.
server/storage.ts        ← All database operations. Add new DB methods here.
server/routes.ts         ← All API handlers. Keep handlers thin.
client/src/hooks/        ← TanStack Query hooks. Frontend data layer.
client/src/pages/        ← One file per route. Add new pages here.
```

**Data flow for a new feature:**

1. Define the data model in `shared/schema.ts` (Drizzle table + Zod schema + types)
2. Add CRUD methods to `IStorage` and `DatabaseStorage` in `server/storage.ts`
3. Add API route handler in `server/routes.ts` (validate with Zod, call storage)
4. Add TanStack Query hook in `client/src/hooks/`
5. Build the UI in `client/src/pages/` or `client/src/components/`
6. Register new pages in `client/src/App.tsx` and `client/src/components/layout/Navbar.tsx`

---

## Areas That Need Help

If you're looking for a good place to start, here are open directions:

- **Zero-Knowledge Proofs** — replace SHA-256 hashing with zk-SNARK proofs for true identity privacy
- **Mainnet / L2 support** — configuration for Polygon, Optimism, or Ethereum mainnet deployment
- **DID-Auth flow** — allow third-party apps to authenticate users via their SatuIdentitas DID
- **Mobile-friendly improvements** — MetaMask mobile deep links, responsive QR scanning
- **Selective disclosure** — W3C Verifiable Presentations to reveal only specific identity attributes
- **Unit and integration tests** — the project currently has no automated tests; any coverage is welcome
- **Accessibility (a11y)** — keyboard navigation, screen reader support, ARIA labels
- **i18n** — full Bahasa Indonesia localization of all UI text

---

## Questions?

Open a [GitHub Discussion](https://github.com/mrbrightsides/satu-identitas/discussions) or file an issue. All constructive contributions are welcome.
