# Meeting Intelligence Service — Quick Start

## One-command local run (needs Docker Desktop running)

```bash
# Start database + run migrations + start server
docker-compose up postgres -d && sleep 5 && npm run db:migrate && npm run dev
```

## Step-by-step

```bash
# 1. Start only PostgreSQL via Docker
docker-compose up postgres -d

# 2. Wait ~5 seconds for it to be ready, then run migrations
npm run db:migrate

# 3. Start dev server
npm run dev
```

## Test the live API

```bash
# Health check
curl http://localhost:3000/health

# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123","name":"Alice"}'

# Login (copy the token from response)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}'

# Create meeting
curl -X POST http://localhost:3000/api/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "title": "Q4 Planning",
    "participants": ["alice@example.com","bob@example.com"],
    "meetingDate": "2024-12-15T10:00:00.000Z",
    "transcript": [
      {"timestamp":"00:01","speaker":"Alice","text":"Lets review Q4 priorities."},
      {"timestamp":"01:30","speaker":"Bob","text":"I will prepare the budget report by Friday."},
      {"timestamp":"03:00","speaker":"Alice","text":"We decided to launch the feature in January."}
    ]
  }'

# Analyze meeting (copy meeting id from create response)
curl -X POST http://localhost:3000/api/meetings/MEETING_ID/analyze \
  -H "Authorization: Bearer TOKEN"

# Swagger UI
open http://localhost:3000/api-docs
```
