# Contribution Guidelines

Thank you for contributing to WebWaka OS v4! This guide covers everything you need to know to make high-quality contributions.

---

## Code of Conduct

All contributors are expected to:
- Be respectful and inclusive
- Focus on constructive criticism
- Celebrate diversity — our platform is built for 54+ countries
- Report unacceptable behaviour to conduct@webwaka.io

---

## Getting Started

### 1. Fork & Clone

```bash
git clone https://github.com/webwaka-os/<repo-name>.git
cd <repo-name>
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env.local
# Fill in required values (see docs/SETUP.md for each repo)
```

### 3. Run Tests Before Your First Change

```bash
npm run test        # unit tests
npm run test:e2e    # end-to-end tests
npm run lint        # ESLint
npm run typecheck   # TypeScript strict mode
```

All tests must pass before you begin.

---

## Branching Strategy

```
main           ← production-ready code
dev            ← integration branch
feat/EPIC-ID-description   ← feature branches
fix/ISSUE-ID-description   ← bug fix branches
docs/description            ← documentation only
```

**Never push directly to `main` or `dev`.** Always open a Pull Request.

---

## Commit Message Format

All commits follow **Conventional Commits** with Blueprint citations:

```
<type>(<scope>): <short description> [Part X.Y]

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`

**Examples:**
```
feat(commerce): add offline POS checkout queue [Part 10.2]
fix(auth): handle expired refresh tokens gracefully [Part 4.1]
docs(webhooks): add signature verification example [Part 8.3]
test(fintech): add wallet insufficient balance test [Part 6.4]
```

**Rules:**
- Description must be in lowercase
- Must cite the Blueprint section `[Part X.Y]` for `feat` and `fix` types
- Maximum 72 characters in the subject line

---

## Pull Request Process

### PR Checklist

Before submitting, ensure:

- [ ] Branch is up to date with `dev`
- [ ] All unit tests pass (`npm run test`)
- [ ] TypeScript compiles with zero errors (`npm run typecheck`)
- [ ] ESLint passes with zero warnings (`npm run lint`)
- [ ] New features have tests with >80% coverage (>90% for Fintech)
- [ ] Docs updated if the API surface changed
- [ ] Commit messages follow Conventional Commits format
- [ ] PR description explains **what**, **why**, and **Blueprint citation**

### PR Template

```markdown
## Summary
Brief description of the change.

## Blueprint Reference
Part X.Y — [Section Name]

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Refactor (no behaviour change)
- [ ] Documentation

## Testing
Describe how you tested this change.

## Screenshots (if UI change)
```

### Review Process

1. Automated CI must pass (all 5 QA layers)
2. At least **2 approvals** from core maintainers
3. No unresolved comments
4. Squash-merge into `dev`

---

## Code Standards

### TypeScript Rules

```typescript
// ✅ Correct — explicit types, no `any`
async function createOrder(payload: OrderCreateDTO): Promise<Order> { ... }

// ❌ Wrong — implicit any, no return type
async function createOrder(payload) { ... }
```

- Strict mode: `"strict": true` in `tsconfig.json`
- Zero `any` types — use `unknown` and type guards instead
- All exported functions must have JSDoc comments

### Testing Rules

```typescript
describe('Commerce: Order creation', () => {
  it('should queue order offline when network is unavailable', async () => {
    // Given
    const client = new WebWakaClient({ offlineQueue: true });
    mockNetwork.setOffline(true);

    // When
    const result = await client.commerce.orders.create(testOrder);

    // Then
    expect(result.status).toBe('queued');
    expect(offlineQueue.size()).toBe(1);
  });
});
```

- Use **Given / When / Then** structure
- Test file naming: `<module>.test.ts`
- Mock external services (Paystack, Flutterwave, Termii)
- No hardcoded credentials in tests

### The 7 Core Invariants (in Code)

Every PR must be checked against:

1. **Build Once Use Infinitely** — Is this reusable across all 12 verticals?
2. **Mobile First** — Is the API payload size < 10KB for mobile clients?
3. **PWA First** — Can this feature work as a service worker background task?
4. **Offline First** — Does this gracefully handle `navigator.onLine === false`?
5. **Nigeria First** — Are Nigerian formats (NGN kobo, WAT timezone, NIN/BVN) supported?
6. **Africa First** — Does this support GHS, KES, ZAR and WAT/EAT timezones?
7. **Vendor Neutral AI** — Does AI code go through CORE-5 abstraction (no direct OpenAI calls)?

---

## Documentation Contributions

- All new APIs must update `openapi.json`
- New webhooks must be documented in `content/webhooks.md`
- New error codes must be added to `content/error-codes.md`
- New ADRs go in `content/adrs/` using the ADR template

---

## Release Process

Releases are managed by core maintainers:

1. `dev` → `main` PR opened with full changelog
2. All CI checks pass
3. Manual smoke test on staging
4. Tag: `git tag v4.X.Y`
5. GitHub Release created automatically by CI
6. SDKs published to npm/PyPI/Packagist

Questions? Join **#contributors** on Discord.
