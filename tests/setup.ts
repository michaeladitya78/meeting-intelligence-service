// Load test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/meeting_intelligence_test';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.RESEND_API_KEY = 'test-resend-key';
process.env.REMINDER_FROM_EMAIL = 'test@example.com';
process.env.REMINDER_TO_EMAIL = 'admin@example.com';
process.env.PORT = '3001';
