# FinanceWebApp — Complete Development Roadmap

**Last updated:** October 28, 2026  
**Repository:** https://github.com/hhaddenn/financeWebApp  
**Current phase:** Phase 5 — Code Quality, Architecture, and Optimization  
**Development approach:** Senior Developer mentoring a Junior Developer

---

# PHASE 1 — Initial Bug Fixes

**Status: COMPLETE**

## Objective

Stabilize the application by resolving the initially identified defects before developing additional functionality.

## Completed work

- [x] Investigate and resolve the initial application bugs.
- [x] Stabilize existing frontend and backend functionality.
- [x] Validate affected workflows.
- [x] Integrate the fixes into the main codebase.

**Outcome:** Initial stabilization completed.

The original historical record describes this phase broadly; it does not provide a reliable detailed inventory of every individual bug, so none are invented here.

---

# PHASE 2 — User Experience and Preferences

**Status: COMPLETE**

## Objective

Improve usability, consistency, personalization, and existing financial-management workflows.

## Completed tasks

### #7 — Password and Balance Visibility

- [x] Add appropriate show/hide password controls.
- [x] Improve visibility controls for sensitive financial amounts.
- [x] Improve usability around displaying sensitive information.

### #14 — Transaction Dialog Improvements

- [x] Standardize transaction and recurring transaction dialogs.
- [x] Improve form behavior and consistency.
- [x] Detect unsaved changes.
- [x] Request confirmation before discarding changes.
- [x] Support relevant interactions using Escape and close buttons.
- [x] Prevent accidental dialog closure.
- [x] Preserve transaction information correctly when interacting with selectors.
- [x] Support Portuguese and English interface messages.

### #15 — Recurring Transaction Improvements

- [x] Improve recurring income and expense creation.
- [x] Present a clear distinction between recurring expense and recurring income.
- [x] Use appropriate categories for the selected transaction type.
- [x] Improve recurring transaction editing.
- [x] Maintain the original transaction type during editing.
- [x] Preserve unsaved-change confirmation.
- [x] Improve Portuguese and English labels.

### #19 — Public Page Internationalization

- [x] Add Portuguese and English translations to public-facing pages.
- [x] Improve language consistency.
- [x] Reduce untranslated interface elements.

### #20 — Theme and Preference Controls

- [x] Support light mode.
- [x] Support dark mode.
- [x] Support system theme preference.
- [x] Improve preference controls and initialization.

### #22 — User Preference Synchronization

- [x] Synchronize preferences during registration and login.
- [x] Improve persistence and initialization of settings.
- [x] Ensure preferences behave consistently across user sessions.

### Additional UX Improvements

- [x] Improve transaction-dependent category filters.
- [x] Improve collapsible filters and visual indicators.
- [x] Improve alphabetical ordering where relevant.
- [x] Improve the initialization of user preferences.

**Completion criteria:** Implemented, validated, and integrated.

---

# PHASE 3 — Dashboard and UX Improvements

**Status: COMPLETE**

## Objective

Improve the dashboard's financial analysis capabilities and strengthen application personalization.

### #26 — Multilingual Financial News

- [x] Support Portuguese financial news.
- [x] Support English financial news.
- [x] Show content according to the selected language.
- [x] Improve multilingual presentation and navigation.

### Dashboard Bar Chart Improvements

- [x] Support yearly data visualization.
- [x] Support monthly data visualization.
- [x] Support weekly data visualization.
- [x] Implement appropriate backend aggregations.
- [x] Improve chart filtering.
- [x] Validate financial calculations.

### Dashboard Donut Chart Improvements

- [x] Add income and expense filtering.
- [x] Add relevant period filtering.
- [x] Improve visualization of category distribution.
- [x] Improve usability and readability.

### Dashboard Chart Preferences

- [x] Allow users to select a default bar-chart period.
- [x] Allow users to select default donut-chart filters.
- [x] Persist these settings in the backend.
- [x] Automatically apply saved preferences when opening the dashboard.
- [x] Keep temporary chart filter changes separate from saved defaults.

### #31 — Custom Favicon

- [x] Add the FinanceWebApp favicon.
- [x] Integrate it into the frontend.

### #32 — Default Balance Visibility

- [x] Allow users to define whether their balance should initially be visible.
- [x] Persist the preference.
- [x] Respect the saved preference when opening the application.

### Additional Post-Phase 3 Improvements

- [x] Fix dashboard chart presentation on mobile devices.
- [x] Implement and test pagination for the transactions page.
- [x] Support navigation between pages.
- [x] Reset pagination appropriately when filters change.
- [x] Handle page changes when transactions are deleted.
- [x] Support Portuguese and English pagination controls.

**Outcome:** Dashboard and UX work completed.

---

# PHASE 4 — Infrastructure, Deployment, and Backups

**Status: COMPLETE — CLOSED BY PROJECT DECISION**

## Objective

Improve production reliability, deployment safety, container management, and recoverability.

## 4.1 — PostgreSQL and Media Backups

### Backup Creation

- [x] Implement a version-controlled PostgreSQL backup script.
- [x] Generate PostgreSQL custom-format database dumps.
- [x] Archive application media.
- [x] Validate the generated backup archives.
- [x] Use persistent local backup storage.

### Backup Recovery

- [x] Verify PostgreSQL backup structure.
- [x] Verify media archive structure.
- [x] Perform an isolated database restoration.
- [x] Successfully restore 25 PostgreSQL tables.

### Backup Automation

- [x] Implement the Docker-based backup executor.
- [x] Integrate backups with a systemd service.
- [x] Install a daily systemd timer.
- [x] Configure a daily schedule at 03:15 with up to 15 minutes of randomized delay.
- [x] Configure 14-day retention.
- [x] Execute the backup successfully through systemd.
- [x] Confirm systemd execution status `success` and exit code `0`.

### Storage Decision

- [x] Keep backup archives on the Raspberry Pi.
- [x] Store credentials and private server configuration outside Git.
- [x] Close the backup task.

**Explicit decision:** No off-device backup storage is planned.

## 4.2 — Docker, Volumes, Security, and Komodo

- [x] Review production Docker architecture.
- [x] Confirm persistent PostgreSQL storage.
- [x] Confirm persistent application media storage.
- [x] Review relevant container dependencies.
- [x] Review Komodo deployment organization.
- [x] Separate version-controlled configuration from private production configuration.
- [x] Ensure backup operations do not recreate the active database and Redis services.
- [x] Establish a version-controlled production deployment repository.
- [x] Use immutable commit-specific application image references for the release mechanism.

## 4.3 — Blue-Green Deployment and Reduced Downtime

### Image Publishing

- [x] Use GitHub Actions for container image builds.
- [x] Publish application images to GitHub Container Registry.
- [x] Support version-specific image selection.

### Blue-Green Architecture

- [x] Implement separate Blue and Green application slots.
- [x] Maintain persistent active-slot state.
- [x] Prepare the inactive slot before routing traffic to it.
- [x] Integrate routing through Caddy.
- [x] Integrate external access through Cloudflare Tunnel.
- [x] Implement deployment readiness checks.
- [x] Implement controlled traffic switching.
- [x] Perform a successful real Blue-Green release.

### Komodo Integration

- [x] Configure the `FinanceWebApp - BlueGreen` Action.
- [x] Connect deployment execution to the version-controlled release scripts.
- [x] Use an intentionally manual production deployment trigger.

**Important distinction:** GitHub Actions automates image building and publishing. The Komodo production deployment Action is manually triggered; the entire production rollout is not an unattended deployment pipeline.

### Deployment Safety

- [x] Design mechanisms to preserve the previous deployment slot.
- [x] Perform rollback-related simulations.
- [x] Avoid unnecessary traffic switching when the deployment images have not changed.

### Remaining technical caveats

The following were included in the original Phase 4 planning but should not be represented as fully proven:

- Production rollback during a real failed deployment has not been conclusively exercised.
- All possible zero-downtime scenarios have not been experimentally demonstrated.
- Graceful shutdown behavior has not been independently confirmed across all services.
- Database migration compatibility must still be considered whenever schema-changing releases are introduced.

These are known operational considerations, not permission to reopen the completed phase automatically.

## 4.4 — Monitoring and Recovery

Original scope:

- Application and service monitoring.
- Health checks.
- Alerts.
- Failure recovery mechanisms.

Established infrastructure includes health/readiness checks, container status visibility, and deployment recovery mechanisms.

A comprehensive alerting implementation was not independently verified.

**Phase 4 is nevertheless accepted as complete.** Additional monitoring and alerting improvements require a separate decision if they become necessary.

---

# PHASE 5 — Code Quality, Refactoring, and Optimization

**Status: IN PROGRESS — 5.A audit started October 28, 2026**

## Objective

Improve maintainability, code quality, architectural consistency, translation workflows, and performance without introducing major new functionality or destabilizing production.

This phase should help the Junior Developer understand how a Senior Developer reviews, refactors, and optimizes a real application.

## 5.A — Codebase Audit

**Status: Complete (first pass) — separation of concerns continues during 5.B and 5.D**

- [x] Review backend organization and architecture (first pass).
- [x] Review frontend organization and architecture (first pass).
- [x] Identify unnecessary code duplication.
- [x] Identify overly complex functions.
- [x] Identify components with excessive responsibilities.
- [ ] Evaluate separation of concerns (continues during 5.B and 5.D).
- [x] Review existing tests.
- [x] Identify maintenance and security risks.
- [x] Prioritize issues according to practical impact.
- [x] Establish a reasonable implementation order.
- [x] Record the backend test baseline (local dev PostgreSQL container).

**Deliverable:** A prioritized list of concrete, repository-specific improvements.

Avoid speculative refactoring and large rewrites without evidence.

### Audit baseline (October 28, 2026, local development machine, `test` at `4a53e1f`)

| Check | Result |
| --- | --- |
| Frontend lint (`npm run lint`, oxlint) | Pass, no diagnostics |
| Frontend tests (`npm test`, Vitest) | 3 files, 8 tests, all passing |
| Frontend build (`npm run build`) | Pass; one JS chunk of 1,239.09 kB (380.74 kB gzip), CSS 137.20 kB (21.92 kB gzip). After syncing the local `node_modules` with the lockfile and formatting: 1,237.14 kB (379.99 kB gzip); formatting itself adds about 0.02 kB |
| Backend lint (`ruff check backend`) | Not run locally: Ruff is not installed in the local virtualenv (CI pins 0.16.10) |
| Backend tests (`python manage.py test`, dev container) | 82 tests across 8 modules, all passing (27.0 s); Django system check: no issues; no missing migrations |
| Line endings | All tracked text files are LF (index and working tree); 0 CRLF files |

Largest hand-written source files (lines, excluding migrations):

| File | Lines |
| --- | --- |
| `frontend/src/components/transactions/TransactionDialog.jsx` | 1,278 |
| `frontend/src/components/recurring-transactions/RecurringTransactionDialog.jsx` | 1,045 |
| `frontend/src/pages/Settings.jsx` | 830 |
| `backend/finance/serializers.py` | 808 |
| `frontend/src/components/transactions/TransactionsFilters.jsx` | 687 |
| `frontend/src/components/dashboard/section-cards.jsx` | 605 |
| `frontend/src/components/dashboard/data-table.jsx` | 518 |
| `backend/finance/views/auth.py` | 478 |
| `backend/finance/models.py` | 452 |

Indentation of tracked files (files indented with tabs only / spaces only / mixed):

| Type | Tabs | Spaces | Mixed |
| --- | --- | --- | --- |
| Python (`.py`, includes 28 migrations) | 12 | 47 | 2 |
| JavaScript/JSX (`.js`, `.jsx`, `.mjs`) | 35 | 60 | 3 |
| JSON | 2 | 5 | 0 |
| Shell scripts (includes `deploy/bluegreen/`) | 0 | 9 | 3 |
| YAML (must stay spaces) | 0 | 7 | 0 |

### Findings

#### Confirmed defects

- **D1 — Missing translation keys.** 25 keys used through literal `t("...")` calls do not exist in either `pt.js` or `en.js`. `t()` falls back to the key path, so users see raw text such as `transactions.saving`. Affected: `TransactionDialog.jsx` (validation messages, saving state), `RegisterForm.jsx`, `LoginForm.jsx`, `FeedbackDialog.jsx`, `section-cards.jsx` (account validation). Introduced together with the client-side validation in commit `bb194c1`.
- **D2 — Hardcoded English in the recurring transaction dialog.** `RecurringTransactionDialog.jsx` sets 9 English-only error messages (loading, validation, save), although matching keys already exist under `recurringTransactions.dialog.*`. Portuguese users see English errors.
- **D3 — Locale parity.** `subcategories.Coffee` and `recurringTransactions.incomeExpenses` exist only in `en.js`.

#### Significant risks

- **R1 — Duplicated dialog logic.** `TransactionDialog.jsx` and `RecurringTransactionDialog.jsx` (2,300+ lines together) repeat account loading and sorting, selection handlers, category menu handling and form setup almost verbatim; `CategoryIcon` is also duplicated in `Settings.jsx`. D2 shows the consequence: a fix in one dialog did not reach the other.
- **R2 — Thin frontend tests.** Only pure utilities are tested (payload builders, news translations). No tests cover dialog validation, `PreferencesContext` (`t()`, preference sync) or pages. Refactoring R1 without tests first is risky.
- **R3 — No automated translation check.** Nothing in CI detects missing keys or pt/en drift, which allowed D1. `check_translations` only covers database categories, downloads an Argos package on every run and parses the locale files with string search.
- **R4 — Single eager bundle.** `App.jsx` imports every route eagerly (public auth pages, dashboard charts, settings), producing one 1.24 MB chunk.
- **R5 — Known vulnerabilities in frontend dependencies.** `npm audit` (October 28, 2026) reports 7 advisories (3 low, 2 moderate, 2 high), including `zod` (high), which is not even imported (T2), and transitive `fast-uri` and `qs`. All report a non-breaking fix through `npm audit fix`. Pending decision: fix now or as part of the T2 cleanup.

#### Technical debt

- **T1 — Formatting is inconsistent with the tab decision.** `ruff.toml` already sets `[format] indent-style = "tab"`, but `ruff format` has never been applied to most files (see the table above). There is no `.editorconfig`, no `.gitattributes` and no JavaScript formatter. CI runs `ruff check` but not `ruff format --check`.
- **T2 — Unused frontend dependencies.** `@dnd-kit/*` (4 packages), `@tanstack/react-table`, `zod`, `react-icons` and `daisyui` (dev) have no imports in `src/`. `src/app/dashboard/data.json` is an unused template leftover.
- **T3 — Two `cn` helpers.** 31 `ui/` components use the `cn` package (shadcn's class merger); `LoginForm` and `RegisterForm` use a local `lib/utils.js` version without Tailwind conflict merging.
- **T4 — Large backend modules.** `serializers.py` (`TransactionSerializer` about 240 lines, `RecurringTransactionSerializer` about 165) and `views/auth.py` are candidates for review, not automatic splitting.
- **T5 — Dormant Budget code.** A `Budget` model, serializer and admin exist without views or URLs. It belongs to Phase 6 (#27) and stays untouched until then.
- **T6 — Outdated README.** It lists Nginx as part of the stack without explaining that Caddy routes traffic and Nginx only serves the built frontend inside its image.
- **T7 — Local tooling drift.** The local virtualenv uses Python 3.12 while CI uses 3.13, and Ruff is not installed locally.

#### Optional improvements

- **O1** — `newsTranslations.test.mjs` uses a different test file extension from the other `*.test.js` files.

## 5.B — #16: DRY, KISS, and SOLID Refactoring

**Status: Pending**

- [ ] Identify repeated business logic.
- [ ] Review repeated transaction and recurring transaction dialog logic.
- [ ] Extract reusable functions where beneficial.
- [ ] Extract reusable components or hooks where justified.
- [ ] Simplify complex conditional logic.
- [ ] Improve separation between business logic and presentation.
- [ ] Evaluate responsibilities in Django views, serializers, and services.
- [ ] Improve readability and testability.
- [ ] Add or update regression tests for modified behavior.

**Learning objectives:**

- Know when duplication is harmful.
- Understand when abstraction is appropriate.
- Apply Single Responsibility and other relevant SOLID principles.
- Avoid premature abstraction and unnecessary architectural layers.

## 5.C — #21: Internationalization Tooling

**Status: Pending**

- [ ] Audit existing Portuguese and English translations.
- [ ] Identify missing translation keys.
- [ ] Identify unused translation keys.
- [ ] Review translation key naming conventions.
- [ ] Improve translation organization.
- [ ] Evaluate automated translation validation.
- [ ] Improve translation maintenance workflows.
- [ ] Evaluate tooling only where it offers measurable benefits.
- [ ] Validate both supported languages after changes.

**Goal:** Make translations easier to maintain as the application grows.

## 5.D — React Architecture and State Management

**Status: Pending**

- [ ] Review current React component organization.
- [ ] Review Context API usage.
- [ ] Review local state managed by `useState`.
- [ ] Review side effects managed by `useEffect`.
- [ ] Review Axios/API integration.
- [ ] Evaluate the separation between server state and UI state.
- [ ] Improve consistency in React Hook usage.
- [ ] Review unnecessary re-rendering.
- [ ] Improve error and loading-state handling.
- [ ] Evaluate opportunities for reusable custom hooks.

### Evaluate TanStack Query

- [ ] Assess caching requirements.
- [ ] Assess background data synchronization.
- [ ] Assess query invalidation after CRUD operations.
- [ ] Compare benefits with the existing approach.
- [ ] Adopt only if justified.

### Evaluate Redux Toolkit

- [ ] Determine whether global state complexity warrants Redux.
- [ ] Prefer keeping existing Context-based state management if sufficient.

### Evaluate TanStack Table

- [ ] Review transaction-table requirements.
- [ ] Compare existing pagination, sorting, and filtering with potential library benefits.
- [ ] Migrate only if worthwhile.

### Evaluate TanStack Router

- [ ] Review existing routing.
- [ ] Identify actual limitations.
- [ ] Avoid migration without a clear benefit.

**Rule:** These libraries are evaluation candidates, not mandatory installations.

## 5.E — Frontend Performance and Bundle Optimization

**Status: Pending**

- [x] Measure the current production bundle (October 28, 2026: 1,239.09 kB JS, 380.74 kB gzip, single chunk).
- [ ] Identify oversized JavaScript chunks.
- [ ] Implement code splitting where appropriate.
- [ ] Evaluate React lazy loading.
- [ ] Reduce unnecessary eager imports.
- [ ] Review heavy dependencies.
- [ ] Review component rendering performance.
- [ ] Optimize data fetching where justified.
- [ ] Measure performance before and after significant changes.
- [ ] Validate that production functionality remains intact.

A previous build reported a JavaScript bundle of approximately 1.24 MB before gzip. The October 28, 2026 measurement confirms that the size has not changed.

## 5.F — Formatting, Conventions, and Documentation

**Status: In progress — formatting rollout done October 28, 2026**

- [x] Configure appropriate `.gitattributes` (`* text=auto eol=lf`, binary assets).
- [x] Standardize LF/CRLF handling across Windows and Linux (`.gitattributes` and `.editorconfig`).
- [x] Review Git line-ending configuration (no `core.autocrlf` set; `.gitattributes` takes precedence).
- [x] Avoid large diffs caused solely by formatting (one formatting commit, ignored by `git blame`).
- [ ] Standardize relevant Python conventions.
- [ ] Standardize relevant JavaScript and JSX conventions.
- [ ] Standardize React Hook import conventions.
- [ ] Improve comments and docstrings.
- [ ] Review naming conventions.
- [ ] Improve relevant developer documentation.
- [ ] Review linting and formatting consistency.
- [x] Adopt tabs for indentation across the project (decision of Oct 28, 2026), in one dedicated formatting-only commit (`0bece00`: 151 files in `backend/` and `frontend/`; tooling in `1b25d28`).
- [x] Add `.editorconfig` and align `ruff.toml`, the JS formatter and `.gitattributes` with the tab rule.
- [x] Add a `.git-blame-ignore-revs` entry for the formatting commit.
- [ ] Convert the remaining files to tabs: shell scripts, Dockerfiles and `frontend/nginx.conf`. Requires explicit authorization for `ops/` and `scripts/`; check heredocs (`<<-`) before changing shell indentation.
- [ ] Add `ruff format --check` and `npm run format:check` to CI (after approval).

## 5.G — Testing and Regression Protection

**Status: Pending**

- [ ] Identify weak test coverage in areas being refactored.
- [ ] Add focused tests before risky refactoring.
- [ ] Test important business rules.
- [ ] Validate existing API contracts.
- [ ] Validate financial calculations where affected.
- [ ] Check UI behavior after refactoring.
- [ ] Verify translations and preferences after relevant changes.
- [ ] Run applicable lint, test, and build checks.
- [ ] Validate CI before merging.

## Proposed Phase 5 Work Order

This is a suggested implementation sequence rather than a replacement for historical task numbering.

Revised after the 5.A audit (October 28, 2026):

1. ~~**5.A** — Record the backend test baseline (local dev PostgreSQL).~~ Done October 28, 2026.
2. ~~**5.F** — Formatting rollout (T1): `.editorconfig`, `.gitattributes`, JS formatter, one formatting-only commit, `.git-blame-ignore-revs`.~~ Done October 28, 2026 (`1b25d28`, `0bece00`).
3. **5.C + 5.G** — Fix D1–D3 and add an automated locale test (pt/en parity and literal `t()` keys exist), so that R3 cannot recur.
4. **5.G** — Tests for dialog validation and form logic before touching the dialogs.
5. **5.B** — Extract the logic shared by the two dialogs (R1), protected by the tests from step 4.
6. **5.E** — Route-level lazy loading (R4), with before/after measurements.
7. **5.D** — React architecture and state review, including the TanStack and Redux evaluations.
8. **5.F** — Cleanup: unused dependencies (T2), `cn` (T3), README (T6), CI format check (after approval).
9. **5.B** — Backend serializer and auth view review (T4), with tests.

The exact order can change based on new evidence.

### Phase 5 Completion Criteria

- [ ] Agreed high-priority refactoring work completed.
- [ ] No unjustified architectural complexity added.
- [ ] Translation maintenance improved.
- [ ] Frontend organization and conventions improved.
- [ ] Performance optimizations evaluated and validated.
- [ ] Relevant tests passing.
- [ ] GitHub Actions passing.
- [ ] Changes integrated through the normal PR workflow.
- [ ] Phase reviewed and explicitly accepted as complete.

---

# PHASE 6 — New Features

**Status: FUTURE — BACKLOG**

## Objective

Extend the FinanceWebApp with meaningful new functionality after improving its architecture and maintainability.

The following are agreed feature areas for future discussion, not finalized specifications.

## #27 — Budgets and Spending Limits

**Status: Planned**

Potential requirements:

- [ ] Allow users to create budgets.
- [ ] Set monthly spending limits.
- [ ] Set budgets by financial category.
- [ ] Compare actual expenses against budget targets.
- [ ] Show budget usage and remaining amounts.
- [ ] Provide relevant warnings when approaching limits.
- [ ] Integrate budgets with existing transaction data.
- [ ] Define behavior for changing or deleting categories.
- [ ] Add automated calculations and API tests.
- [ ] Support Portuguese and English.

**Design decisions still required:** budget periods, category relationships, alerts, and reporting behavior.

## #28 — Monthly Financial Reports

**Status: Planned**

Potential requirements:

- [ ] Generate monthly financial summaries.
- [ ] Report income and expenses.
- [ ] Summarize spending by category.
- [ ] Compare current and previous periods.
- [ ] Show relevant trends.
- [ ] Consider integrating budget information.
- [ ] Allow users to configure optional notifications in Settings.
- [ ] Evaluate background report generation using Celery.
- [ ] Support Portuguese and English.
- [ ] Add tests for financial calculations.

**Design decisions still required:** report format, delivery, scheduling, and notification preferences.

## #29 — CSV / Excel Import and Export

**Status: Planned**

Potential requirements:

### Export

- [ ] Export transactions to CSV.
- [ ] Export transactions to Excel/XLSX.
- [ ] Respect relevant filters and user permissions.
- [ ] Preserve appropriate monetary values and date formats.

### Import

- [ ] Accept supported CSV files.
- [ ] Accept supported Excel files.
- [ ] Validate uploaded data.
- [ ] Support appropriate column mapping.
- [ ] Normalize dates, monetary values, and categories.
- [ ] Detect or prevent duplicate transactions.
- [ ] Show clear validation errors.
- [ ] Provide an import preview or confirmation where useful.
- [ ] Preserve transaction integrity if an import fails.
- [ ] Add automated tests and security validation.

**Design decisions still required:** supported formats, bank statement mappings, duplicate handling, and import UX.

## #30 — Vehicle Expense Management

**Status: Planned**

Potential requirements:

- [ ] Register one or more vehicles.
- [ ] Record fuel expenses.
- [ ] Record maintenance expenses.
- [ ] Record insurance and tax expenses.
- [ ] Track mileage.
- [ ] Calculate fuel cost per kilometre.
- [ ] Calculate total cost per kilometre.
- [ ] Display vehicle expense history.
- [ ] Show statistics and trends.
- [ ] Link relevant expenses to existing financial transactions.
- [ ] Avoid counting the same expense twice.
- [ ] Support Portuguese and English.

### Important pending decision

Decide whether to implement:

**Option A:** A simple vehicle-cost calculator.

**Option B:** A complete vehicle management module with historical records, expenses, fuel, and maintenance.

The architecture and data model depend on this decision.

## Phase 6 Completion Criteria

These will be defined separately for each approved feature.

Each feature should have:

- Agreed functional requirements.
- A reviewed data model.
- API and frontend design.
- Input validation and authorization.
- Automated tests.
- Portuguese and English support.
- Documentation where relevant.
- Successful CI and PR integration.
- Production validation when appropriate.

No Phase 6 feature should be implemented merely because it appears on the backlog.

---

# DEVELOPMENT WORKFLOW — APPLIES TO EVERY PHASE

## Git and Deployment

1. Implement and validate changes locally.
2. Commit to `test`.
3. Push to GitHub.
4. Open a Pull Request into `main`.
5. Run required checks.
6. Resolve any failures.
7. Merge approved changes.
8. Publish updated Docker images when appropriate.
9. Deploy through the established Komodo Blue-Green process when authorized.

## Security

- Never publish `.env` files or real credentials.
- Never publish private financial data.
- Keep server-specific configuration private.
- Do not modify production infrastructure unnecessarily.
- Protect existing PostgreSQL and Redis services.
- Avoid destructive operations without explicit authorization.

## Senior/Junior Mentorship

The Senior Developer should:

- Explain architectural reasoning and tradeoffs.
- Help identify and prioritize real problems.
- Let the Junior Developer implement meaningful code.
- Review the implementation constructively.
- Teach debugging and testing.
- Avoid unnecessary abstraction.
- Avoid excessive micro-exercises.
- Avoid repeated diagnostics without a concrete reason.
- Help build independence rather than reliance on generated code.

---

# CURRENT PROJECT POSITION

**Completed:** Phases 1–4  
**Current:** Phase 5 — Code Quality, Refactoring, and Optimization (5.A complete, 5.F next)  
**Future:** Phase 6 — Budgets, Monthly Reports, CSV/Excel, and Vehicle Management

**Immediate next action:** Fix D1–D3 and add an automated locale test (5.C + 5.G).

**Roadmap rule:** Do not reopen completed phases or begin Phase 6 until the relevant work is explicitly approved.

---

# DECISIONS LOG

| Date | Decision |
| --- | --- |
| 2026-10-28 | Phase 5 started with the 5.A audit; baseline and findings recorded above. |
| 2026-10-28 | Indentation uses tabs across the project. YAML and Markdown keep spaces; LF line endings everywhere; generated files and lockfiles are not hand-formatted. |
| 2026-10-28 | The formatting rollout is one dedicated formatting-only commit (no behavior changes), recorded in `.git-blame-ignore-revs`, before any refactoring. Because the formatters also normalize quotes, wrapping and trailing commas, `git diff -w` will not be empty; the commit is validated with lint, tests and the build before and after instead. |
| 2026-10-28 | Dormant Budget code (T5) stays untouched until Phase 6 (#27). |
| 2026-10-28 | Formatters: Prettier for JavaScript/JSX, JSON, CSS and HTML; Ruff for Python. Both use tabs with a display width of 4. Prettier keeps its defaults otherwise (double quotes and semicolons already dominate the frontend). |
| Pending | Align the local Ruff version with CI before the rollout (CI pins 0.16.10; the VS Code extension bundles 0.17.3). |
