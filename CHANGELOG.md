# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2024-12-15

### Added

#### Infrastructure & Setup
- Initialized Node.js + TypeScript project with Express.js
- Configured TypeScript (`tsconfig.json`) targeting ES2020
- Set up Jest + ts-jest for testing with Supertest for integration tests
- Configured Winston logger with JSON format, console and file transports
- Added Helmet and CORS for security
- Created `.env.example` with all required environment variables

#### Database
- Implemented Prisma schema with 6 models: `User`, `Meeting`, `MeetingAnalysis`, `ActionItem`, `ReminderLog`, `ActionStatus` enum
- Configured PostgreSQL datasource with connection pooling

#### Authentication Module
- `POST /api/auth/register` — Email/password registration with bcrypt (10 salt rounds)
- `POST /api/auth/login` — JWT generation on successful credential verification
- Zod validation for email format, password length (min 8), name required
- Password never returned in responses

#### Meetings Module
- `POST /api/meetings` — Create meeting with transcript (JSON array)
- `GET /api/meetings` — Paginated listing with metadata (total, page, totalPages)
- `GET /api/meetings/:id` — Fetch meeting with analyses and action items
- Participant email validation
- Meetings scoped to authenticated user

#### Analysis Module
- `POST /api/meetings/:id/analyze` — Trigger Gemini AI analysis
- Implemented Gemini 1.5 Flash client with structured JSON prompt
- Citation grounding: every insight requires timestamp + speaker + quote
- Hallucination prevention: explicit prompt rules + post-parse validation
- Auto-retry on JSON parse failure
- Automatic ActionItem creation from AI-extracted items
- Results saved to `MeetingAnalysis` table

#### Action Items Module
- `POST /api/action-items` — Manual action item creation
- `PATCH /api/action-items/:id/status` — Status updates (PENDING → IN_PROGRESS → COMPLETED)
- `GET /api/action-items` — Filtered listing (status, assignee, meetingId) with pagination
- `GET /api/action-items/overdue` — Items past due date and not completed, with meeting title

#### Middleware
- `traceId.middleware.ts` — UUID trace ID on every request, propagated to response header
- `auth.middleware.ts` — JWT Bearer token verification, attaches user to request
- `validate.middleware.ts` — Zod schema validation factory
- `errorHandler.middleware.ts` — Global error handler with Prisma error mapping

#### Scheduled Jobs
- `reminderJob.ts` — node-cron job: daily 9 AM (production), every minute (development)
- Queries overdue action items, sends Resend emails, logs to `ReminderLog` table

#### Integrations
- `resend.client.ts` — HTML email sender with formatted action item details

#### Documentation
- Swagger/OpenAPI 3.0 documentation at `/GET /api-docs`
- All endpoints documented with request/response schemas, auth requirements
- `README.md` — Setup guide, API examples, deployment instructions
- `DECISIONS.md` — Architecture Decision Records
- `AI_APPROACH.md` — Prompt engineering, citation strategy, hallucination prevention
- `TESTING.md` — Test scenarios and coverage documentation

#### Docker
- Multi-stage `Dockerfile` (builder + production stages with node:20-alpine)
- `docker-compose.yml` with `app` + `postgres:15-alpine` services
- Health checks on both services
- Volume persistence for PostgreSQL data and application logs
