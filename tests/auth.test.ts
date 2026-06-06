import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/database';

// Mock Prisma to avoid real DB calls
jest.mock('../src/config/database', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
}));

const mockPrisma = prisma as unknown as {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
  };
};

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'test-uuid-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
      });

      const response = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'securePassword123',
        name: 'Test User',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should return 409 when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'existing@example.com',
        passwordHash: 'hash',
        name: 'Existing User',
        createdAt: new Date(),
      });

      const response = await request(app).post('/api/auth/register').send({
        email: 'existing@example.com',
        password: 'securePassword123',
        name: 'Test User',
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DUPLICATE_EMAIL');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'not-an-email',
        password: 'securePassword123',
        name: 'Test User',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for password shorter than 8 characters', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'short',
        name: 'Test User',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('8 characters');
    });

    it('should return 400 when name is missing', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'securePassword123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('correctPassword123', 10);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'user@example.com',
        passwordHash: hash,
        name: 'Test User',
        createdAt: new Date(),
      });

      const response = await request(app).post('/api/auth/login').send({
        email: 'user@example.com',
        password: 'correctPassword123',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe('user@example.com');
    });

    it('should return 401 for wrong password', async () => {
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('correctPassword123', 10);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'user@example.com',
        passwordHash: hash,
        name: 'Test User',
        createdAt: new Date(),
      });

      const response = await request(app).post('/api/auth/login').send({
        email: 'user@example.com',
        password: 'wrongPassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 when user is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'anyPassword123',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });
});
