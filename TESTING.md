Testing Documentation
=====================

This document outlines the testing strategy, scenarios executed, edge cases considered, and limitations discovered during testing of the Meeting Intelligence Service.

Test Scenarios Executed
=======================

Authentication API:
- Registration with valid data (creates user, hashes password, returns token).
- Registration failures (existing email, invalid email, short password, missing name).
- Login validation (valid credentials return token, invalid credentials or missing users fail).

Meetings API:
- Creating meetings with valid metadata and transcripts.
- Pagination checks (retrieving meetings with page and limit queries).
- Retrieving individual meetings by ID.
- Access checks (preventing unauthenticated requests from creating or reading meetings).

Action Items API:
- Fetching overdue action items with meeting titles.
- Filtering action items by status, assignee, and meeting ID.
- Creating action items manually.
- Updating action item status (PENDING, IN_PROGRESS, COMPLETED).

Edge Cases Considered
=====================

- Invalid token expiration or incorrect token signatures.
- Pagination limits, handling inputs like page 0 or limit 0 by defaulting to page 1 and limit 1.
- Empty transcript arrays or invalid date formats in meeting creation payload.
- Handling duplicate database records and missing items gracefully by returning clear errors.

Limitations Discovered
======================

- Tests currently mock the Prisma client to avoid requiring a live database. Database schema integrity should be verified in staging.
- The external APIs (Google Gemini and Resend) are mocked during testing. Network delays or external API failures are not simulated in unit tests.
- node-cron job triggers are verified by calling the process function directly, rather than simulating cron time steps.
