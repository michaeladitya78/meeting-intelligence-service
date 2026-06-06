# Testing Documentation

## Test Setup

Tests use **Jest** + **Supertest** with a mocked Prisma client to avoid requiring a live database.

### Configuration
- `jest.config.js` — ts-jest preset, test environment node
- `tests/setup.ts` — sets test environment variables before any test runs

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run a specific test file
npm test -- tests/auth.test.ts

# Watch mode (for development)
npm test -- --watch
```

---

## Test Files

### `tests/auth.test.ts`

Tests the authentication module.

**Mocking strategy:** Prisma's `user.findUnique` and `user.create` are mocked with `jest.fn()`.

| Test | Description | Expected |
|------|-------------|----------|
| POST /api/auth/register — success | Valid email, password ≥8 chars, name | 201, token + user (no passwordHash) |
| POST /api/auth/register — duplicate email | Email already in DB | 409, DUPLICATE_EMAIL error |
| POST /api/auth/register — invalid email | `"not-an-email"` | 400, VALIDATION_ERROR |
| POST /api/auth/register — short password | Password < 8 chars | 400, VALIDATION_ERROR, mentions "8 characters" |
| POST /api/auth/register — missing name | No name field | 400, VALIDATION_ERROR |
| POST /api/auth/login — success | Correct bcrypt hash match | 200, token + user |
| POST /api/auth/login — wrong password | Hash mismatch | 401, INVALID_CREDENTIALS |
| POST /api/auth/login — user not found | Prisma returns null | 401, INVALID_CREDENTIALS |

### `tests/meetings.test.ts`

Tests the meetings module.

**Mocking strategy:** Prisma's `meeting.*` methods and `$transaction` are mocked. JWT token is generated inline using `jwt.sign()` with the test secret.

| Test | Description | Expected |
|------|-------------|----------|
| POST /api/meetings — success | Valid body with JWT | 201, meeting data |
| POST /api/meetings — missing title | No title field | 400, VALIDATION_ERROR |
| POST /api/meetings — invalid participant email | `"not-an-email"` in participants | 400, mentions "email" |
| POST /api/meetings — unauthenticated | No Authorization header | 401 |
| GET /api/meetings — success with pagination | Valid JWT, mocked $transaction | 200, { meetings, total, page, limit, totalPages } |
| GET /api/meetings — unauthorized | No token | 401 |
| GET /api/meetings/:id — success | Mocked meeting found | 200, meeting data |
| GET /api/meetings/:id — not found | Prisma returns null | 404, NOT_FOUND |

### `tests/actionItems.test.ts`

Tests the action items module.

**Mocking strategy:** Prisma's `actionItem.*` and `meeting.findUnique` are mocked.

| Test | Description | Expected |
|------|-------------|----------|
| GET /api/action-items/overdue — returns overdue | Mocked items with past dueDate | 200, array with meeting.title |
| GET /api/action-items/overdue — unauthenticated | No token | 401 |
| PATCH /api/action-items/:id/status — IN_PROGRESS | Valid status enum | 200, updated status |
| PATCH /api/action-items/:id/status — COMPLETED | Valid status enum | 200, updated status |
| PATCH /api/action-items/:id/status — invalid status | `"INVALID_STATUS"` | 400, VALIDATION_ERROR |
| PATCH /api/action-items/:id/status — not found | Prisma returns null | 404 |
| GET /api/action-items — filter by status | `?status=PENDING` | 200, filtered results |
| GET /api/action-items — filter by assignee | `?assignee=Alice` | 200, filtered results |
| GET /api/action-items — filter by meetingId | `?meetingId=uuid` | 200, filtered results |

---

## Edge Cases Tested

- JWT token with wrong secret → 401 INVALID_TOKEN
- JWT expired token → 401 TOKEN_EXPIRED
- Pagination with `page=0` or `limit=0` → defaults to page=1, limit=1 minimum
- Empty transcript array → 400 VALIDATION_ERROR
- `meetingDate` as invalid string → 400 VALIDATION_ERROR

---

## Limitations

1. **No integration tests**: Tests mock Prisma, so actual DB schema compatibility is not verified in CI. Run `npm run db:migrate` locally before deploying.

2. **Gemini not tested**: The AI analysis endpoint is not unit tested due to external API dependency. Consider using VCR-style HTTP recording in future.

3. **Email not tested**: Resend integration is not tested — would require either mocking the SDK or using Resend's test mode.

4. **Cron job not tested**: The reminder job is not unit tested. The job logic itself (`processOverdueReminders`) is extracted into a pure function that could be tested independently.

---

## Coverage Goals

| Module | Coverage Target |
|--------|----------------|
| Auth | 90%+ |
| Meetings | 85%+ |
| Action Items | 85%+ |
| Middleware | 80%+ |
| Utils | 100% |
