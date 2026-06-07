Meeting Intelligence Service
============================

This is a backend system designed to manage meetings, analyze transcripts using Google Gemini AI, track action items, and send email reminders for overdue tasks.

Features
========

- User registration and login using JWT tokens and bcrypt password hashing.
- Meeting creation and list endpoints with built-in pagination.
- AI analysis utilizing Google Gemini 1.5 Flash to generate summaries, decisions, action items, and follow-ups.
- Citation grounding where every generated item cites a timestamp and speaker from the transcript to prevent hallucinations.
- Action item tracking with status updates and overdue task detection.
- Automated email reminders using Resend sent on a daily cron schedule.
- Request tracing with trace IDs and structured Winston logging.

Prerequisites
=============

- Node.js version 20 or higher
- PostgreSQL version 15 or higher
- A Google Gemini API key
- A Resend API key

Local Setup
===========

1. Clone the repository and install the dependencies:
   npm install

2. Configure environment variables. Copy the example file to a new file named .env and fill in your values.

   DATABASE_URL: PostgreSQL connection string
   JWT_SECRET: Secret key for signing JSON Web Tokens
   JWT_EXPIRES_IN: How long the token remains valid (example: 7d)
   GEMINI_API_KEY: Your Google Gemini API key
   RESEND_API_KEY: Your Resend API key for email delivery
   REMINDER_FROM_EMAIL: The sender address for task notifications
   REMINDER_TO_EMAIL: The destination email address for overdue alerts
   PORT: The port the server listens on (default is 3000)
   NODE_ENV: Set to development or production

3. Initialize the database schema and run migrations:
   npm run db:migrate

4. Start the application in development mode:
   npm run dev

The server runs on http://localhost:3000 by default. You can view the API documentation at http://localhost:3000/api-docs.

To run the test suite, use the test script:
   npm test

Deployment
==========

You can deploy this application on platforms like Render or Railway. Make sure to:
- Provision a PostgreSQL database instance.
- Configure all environment variables in your deployment dashboard.
- Set the start command to build the project and start the compiled application.

API Usage Examples
==================

Register a user:
Send a POST request to /api/auth/register with a JSON body containing email, password, and name.

Login:
Send a POST request to /api/auth/login with your email and password to receive a JWT token.

Create a meeting:
Send a POST request to /api/meetings with your Authorization header set to Bearer JWT_TOKEN. The body should contain title, participants, meetingDate, and transcript entries.

Analyze a meeting:
Send a POST request to /api/meetings/:id/analyze with your authorization token to trigger the Gemini AI analysis.

Get overdue items:
Send a GET request to /api/action-items/overdue to retrieve overdue tasks.
