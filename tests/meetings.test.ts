import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import prisma from '../src/config/database';

// Mock Prisma
jest.mock('../src/config/database', () => ({
  meeting: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
}));

const mockPrisma = prisma as unknown as {
  meeting: {
    create: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
  };
  $transaction: jest.Mock;
};

const generateToken = (userId = 'user-123') => {
  return jwt.sign(
    { userId, email: 'test@example.com', name: 'Test User' },
    process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only',
    { expiresIn: '1h' }
  );
};

const sampleTranscript = [
  { timestamp: '00:01', speaker: 'Alice', text: 'Let us start the meeting.' },
  { timestamp: '00:30', speaker: 'Bob', text: 'We need to finish the report by Friday.' },
];

const sampleMeeting = {
  id: 'meeting-uuid-123',
  title: 'Q4 Planning',
  participants: ['alice@example.com', 'bob@example.com'],
  meetingDate: new Date('2024-12-15T10:00:00Z'),
  transcript: sampleTranscript,
  createdBy: 'user-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
};

describe('Meetings API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
  });

  describe('POST /api/meetings', () => {
    it('should create a meeting successfully', async () => {
      const token = generateToken();
      mockPrisma.meeting.create.mockResolvedValue(sampleMeeting);

      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Q4 Planning',
          participants: ['alice@example.com', 'bob@example.com'],
          meetingDate: '2024-12-15T10:00:00.000Z',
          transcript: sampleTranscript,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Q4 Planning');
    });

    it('should return 400 when title is missing', async () => {
      const token = generateToken();

      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          participants: ['alice@example.com'],
          meetingDate: '2024-12-15T10:00:00.000Z',
          transcript: sampleTranscript,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid participant email', async () => {
      const token = generateToken();

      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Meeting',
          participants: ['not-an-email'],
          meetingDate: '2024-12-15T10:00:00.000Z',
          transcript: sampleTranscript,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('email');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app).post('/api/meetings').send({
        title: 'Test Meeting',
        participants: ['alice@example.com'],
        meetingDate: '2024-12-15T10:00:00.000Z',
        transcript: sampleTranscript,
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/meetings', () => {
    it('should return paginated meetings with metadata', async () => {
      const token = generateToken();

      mockPrisma.$transaction.mockResolvedValue([
        [sampleMeeting],
        1,
      ]);

      const response = await request(app)
        .get('/api/meetings?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('meetings');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
      expect(response.body.data).toHaveProperty('totalPages');
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(10);
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app).get('/api/meetings');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/meetings/:id', () => {
    it('should return a meeting by id', async () => {
      const token = generateToken();

      mockPrisma.meeting.findFirst.mockResolvedValue({
        ...sampleMeeting,
        analyses: [],
        actionItems: [],
      });

      const response = await request(app)
        .get('/api/meetings/meeting-uuid-123')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('meeting-uuid-123');
    });

    it('should return 404 when meeting is not found', async () => {
      const token = generateToken();
      mockPrisma.meeting.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/meetings/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });
});
