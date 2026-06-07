Technical Decisions
===================

This document details the architectural and technology decisions made during the design and development of the Meeting Intelligence Service.

Database Choice: PostgreSQL and Prisma ORM
==========================================

Why it was chosen:
We chose PostgreSQL as our primary relational database because meeting data, transcripts, and action items have strong relational associations. Prisma ORM was selected to provide type safety, clear database models, and automated migrations.

Alternatives considered:
- MongoDB: While MongoDB is flexible, meeting relations benefit greatly from referential integrity at the database level.
- SQLite: Easy to set up locally, but not robust enough for multi-instance production environments.

Trade-offs:
Prisma adds a small startup footprint because of its query engine, and PostgreSQL requires active management compared to simple schema-less setups.

Authentication Strategy: Stateless JSON Web Tokens
==================================================

Why it was chosen:
We implemented stateless JWT authentication to keep the application server lightweight and easily scaleable without managing server-side session tables or in-memory stores.

Alternatives considered:
- Session cookies: Requires session store management and limits horizontal scaling.
- Third-party OAuth: Adds dependency on external identity providers.

Trade-offs:
Stateless tokens cannot be immediately revoked unless we implement a token blacklist, which would introduce session state database checks.

External Integrations: Google Gemini and Resend
===============================================

Why it was chosen:
- Google Gemini 1.5 Flash was chosen for meeting transcript analysis because of its fast processing times and generous free tier.
- Resend was selected for email notifications because of its clean API and reliable delivery rates.

Alternatives considered:
- OpenAI GPT: Offers similar quality but has higher transaction costs.
- Standard SMTP: Avoids vendor lock-in but requires maintaining email server infrastructure.

Trade-offs:
We are dependent on the availability and limits of the Resend and Google Gemini APIs.

Project Structure Decisions: Modular Architecture
=================================================

Why it was chosen:
We structured the application using a modular layout where each feature area (auth, meetings, analysis, action items) lives in its own directory containing controllers, routes, services, and schemas.

Alternatives considered:
- Monolithic folder structure: Grouping all controllers together, all routes together, and all services together. While common, it makes feature-based navigation slower.

Trade-offs:
Adds slightly more folders and import configurations, but makes locating and updating code much simpler.
