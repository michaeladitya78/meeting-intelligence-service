# Meeting Intelligence Service

A production-ready backend service that uses **Google Gemini AI** to analyze meeting transcripts, extract action items, identify decisions, and send automated email reminders for overdue tasks.

## Features

- 🔐 **JWT Authentication** — Secure register/login with bcrypt password hashing
- 📋 **Meeting Management** — Create and retrieve meetings with paginated listing
- 🤖 **AI Analysis** — Google Gemini 1.5 Flash analyzes transcripts with citation grounding
- 🚫 **Hallucination Prevention** — Every AI insight must cite a real transcript timestamp
- ✅ **Action Item Management** — CRUD, status updates, overdue detection
- 📧 **Email Reminders** — Automated Resend emails for overdue action items
- ⏰ **Scheduled Jobs** — node-cron for daily reminder processing
- 📊 **Structured Logging** — Winston with JSON format and trace IDs
- 🔍 **Request Tracing** — UUID trace ID on every request/response
- 🛡️ **Global Error Handling** — Consistent error responses, never crashes
- ✔️ **Input Validation** — Zod schemas on all endpoints
- 📖 **Swagger Docs** — Full OpenAPI 3.0 documentation at `/api-docs`
- 🐳 **Docker Support** — Multi-stage Dockerfile + docker-compose

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Google Gemini API key ([Get one free](https://aistudio.google.com/app/apikey))
- Resend API key ([Get one free](https://resend.com))

## Local Setup

### 1. Clone and install dependencies

```bash
git clone https://github.com/YOUR_USERNAME/meeting-intelligence-service.git
cd meeting-intelligence-service
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/meeting_intelligence` |
| `JWT_SECRET` | Secret for signing JWTs | `my-super-secret-key` |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `RESEND_API_KEY` | Resend email API key | `re_...` |
| `REMINDER_FROM_EMAIL` | Email sender address | `reminders@yourdomain.com` |
| `REMINDER_TO_EMAIL` | Reminder recipient address | `admin@yourdomain.com` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |

### 3. Set up the database

```bash
# Create DB and run migrations
npm run db:migrate

# Or generate Prisma client only
npm run db:generate
```

### 4. Start the development server

```bash
npm run dev
```

The server will start at `http://localhost:3000`.
Swagger docs: `http://localhost:3000/api-docs`

### 5. Run tests

```bash
npm test
```

## Docker Setup

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## API Examples

### Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "securePassword123",
    "name": "Alice"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "securePassword123"
  }'
```

### Create a Meeting

```bash
curl -X POST http://localhost:3000/api/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Q4 Planning Meeting",
    "participants": ["alice@example.com", "bob@example.com"],
    "meetingDate": "2024-12-15T10:00:00.000Z",
    "transcript": [
      { "timestamp": "00:01", "speaker": "Alice", "text": "Let us start by reviewing Q3 results." },
      { "timestamp": "02:30", "speaker": "Bob", "text": "I will prepare the budget report by Friday." },
      { "timestamp": "05:00", "speaker": "Alice", "text": "We decided to launch the new feature in January." }
    ]
  }'
```

### Analyze a Meeting

```bash
curl -X POST http://localhost:3000/api/meetings/MEETING_ID/analyze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### List Meetings (Paginated)

```bash
curl "http://localhost:3000/api/meetings?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Overdue Action Items

```bash
curl http://localhost:3000/api/action-items/overdue \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Action Item Status

```bash
curl -X PATCH http://localhost:3000/api/action-items/ACTION_ITEM_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{ "status": "COMPLETED" }'
```

### Health Check

```bash
curl http://localhost:3000/health
```

## Railway Deployment

1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Add PostgreSQL plugin via Railway dashboard
5. Set environment variables in Railway dashboard
6. Deploy: `railway up`

The `DATABASE_URL` is automatically injected by Railway when using their PostgreSQL plugin.

## Project Structure

```
src/
├── config/          # Database, logger, swagger configuration
├── middleware/      # Auth, traceId, errorHandler, validate
├── modules/
│   ├── auth/        # JWT auth (register/login)
│   ├── meetings/    # Meeting CRUD
│   ├── analysis/    # Gemini AI analysis
│   ├── actionItems/ # Action item management
│   └── evaluation/  # Evaluation metadata endpoint
├── jobs/            # node-cron scheduled jobs
├── integrations/    # Resend email client
└── utils/           # Response helpers
```
