# Architecture Decision Records

## 1. PostgreSQL + Prisma ORM

**Decision:** Use PostgreSQL as the primary database with Prisma as the ORM.

**Why:**
- Meeting data has inherent relational structure: Users → Meetings → Analyses → ActionItems
- Foreign key constraints enforce referential integrity at the DB level, preventing orphaned records
- Prisma provides type-safe database access that catches schema mismatches at compile time
- Prisma's migration system tracks schema changes in version control

**Alternatives Considered:**
- **MongoDB + Mongoose:** More flexible document model, but transcript/analysis data fits poorly into a dynamic schema and loses relational guarantees
- **SQLite:** Simpler setup, but not suitable for production multi-instance deployments
- **Drizzle ORM:** Newer, slightly lighter, but Prisma has better ecosystem maturity and tooling

**Tradeoffs:**
- Prisma adds ~50ms cold start overhead in serverless environments due to query engine initialization
- PostgreSQL requires managed infrastructure vs. MongoDB Atlas free tier simplicity
- Migration management adds process overhead compared to schema-less databases

---

## 2. JWT Authentication (Stateless)

**Decision:** Use JSON Web Tokens for authentication rather than server-side sessions.

**Why:**
- Stateless: No server-side session store required, enabling horizontal scaling
- Self-contained: User identity travels with every request without DB lookup
- Industry standard: Well-understood by developers, excellent library support
- Compatible with microservice architectures

**Alternatives Considered:**
- **Session-based auth (express-session + Redis):** Better for immediate token revocation, but adds Redis infrastructure dependency
- **Passport.js:** Excellent abstraction layer, but adds complexity for this scope
- **Auth0/Clerk:** Managed auth eliminates implementation burden, but adds cost and vendor lock-in

**Tradeoffs:**
- JWTs cannot be immediately invalidated without a token blacklist (Redis)
- Token size (~200 bytes) is larger than a session cookie ID
- Secret rotation requires re-issuance of all tokens

---

## 3. Google Gemini API (gemini-1.5-flash)

**Decision:** Use Google Gemini 1.5 Flash as the AI analysis engine.

**Why:**
- Free tier is generous (15 RPM, 1M TPM) — ideal for development and low-traffic production
- 1M token context window accommodates long meeting transcripts
- Strong JSON output mode when prompted correctly
- Fast inference compared to GPT-4 class models

**Alternatives Considered:**
- **OpenAI GPT-4o:** Higher quality for complex reasoning, but significantly more expensive ($5/M input tokens vs. free)
- **Anthropic Claude:** Excellent at following structured output instructions, but higher cost
- **Open-source (Ollama/LLaMA):** No API costs, full data privacy, but requires GPU infrastructure and quality is lower

**Tradeoffs:**
- Gemini occasionally produces malformed JSON (mitigated by retry logic)
- Rate limits can be hit under load (1500 RPD on free tier)
- Vendor lock-in to Google AI infrastructure

---

## 4. Resend (Email Integration)

**Decision:** Use Resend as the email delivery service for action item reminders.

**Why:**
- Modern, developer-first API with excellent DX
- Generous free tier (3,000 emails/month)
- Simple SDK: `resend.emails.send()` with one line
- Built-in email analytics and delivery tracking

**Alternatives Considered:**
- **SendGrid:** Industry leader, but complex setup and API design feels dated
- **Nodemailer + SMTP:** Full control, no vendor dependency, but requires managing SMTP infrastructure
- **AWS SES:** Very cheap at scale, but complex IAM setup and sandbox mode restrictions

**Tradeoffs:**
- Resend is newer (founded 2023) — less battle-tested than SendGrid
- Requires domain verification for custom from addresses
- Limited template management compared to enterprise solutions

---

## 5. Zod (Runtime Validation)

**Decision:** Use Zod for request body validation.

**Why:**
- Single source of truth: Zod schemas generate both TypeScript types AND runtime validators
- Excellent error messages out of the box
- Seamless integration with TypeScript's type system
- Chaining API is intuitive and readable

**Alternatives Considered:**
- **Joi:** Battle-tested, but lacks native TypeScript type inference (requires `@types/joi`)
- **express-validator:** Middleware-based, but more verbose and separated from type definitions
- **class-validator + class-transformer:** Powerful with NestJS, but heavy for a simple Express app
- **Yup:** Similar to Zod but slightly less ergonomic for TypeScript

**Tradeoffs:**
- Zod adds ~100KB to bundle size
- Error formatting requires manual transformation for user-friendly messages
- Async validation is less ergonomic than Joi

---

## 6. node-cron (Scheduler)

**Decision:** Use node-cron for scheduling the daily reminder job.

**Why:**
- Zero infrastructure requirements — runs in the same Node.js process
- Simple, declarative cron syntax
- Sufficient for single-instance deployments

**Alternatives Considered:**
- **BullMQ + Redis:** Distributed job queues with retries, dead letter queues, job concurrency control — ideal for high-scale, but requires Redis infrastructure
- **Agenda + MongoDB:** Persistent jobs survive restarts, but adds MongoDB dependency
- **AWS EventBridge / Cloud Scheduler:** Managed, highly reliable, but requires cloud deployment
- **Bree:** Modern alternative to node-cron with worker threads support

**Tradeoffs:**
- node-cron jobs are lost if the server crashes mid-execution
- Cannot distribute work across multiple instances (requires Redis-backed queue)
- No built-in retry mechanism for failed job runs
- Suitable for low-frequency, non-critical jobs (daily reminders) but not for high-throughput pipelines
