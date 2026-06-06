import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import prisma from '../src/config/database';

// Mock Prisma
jest.mock('../src/config/database', () => ({
  actionItem: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  meeting: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
}));

const mockPrisma = prisma as unknown as {
  actionItem: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    count: jest.Mock;
  };
  meeting: {
    findUnique: jest.Mock;
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

const overdueDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // yesterday

const sampleActionItem = {
  id: 'action-item-uuid-123',
  meetingId: 'meeting-uuid-123',
  task: 'Prepare Q4 budget report',
  assignee: 'Alice',
  dueDate: overdueDate,
  status: 'PENDING',
  citations: [{ timestamp: '00:30', speaker: 'Bob', quote: 'We need the report by Friday.' }],
  createdAt: new Date(),
  updatedAt: new Date(),
  meeting: { id: 'meeting-uuid-123', title: 'Q4 Planning' },
};

describe('Action Items API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
  });

  describe('GET /api/action-items/overdue', () => {
    it('should return overdue action items with meeting title', async () => {
      const token = generateToken();
      mockPrisma.actionItem.findMany.mockResolvedValue([sampleActionItem]);

      const response = await request(app)
        .get('/api/action-items/overdue')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0]).toHaveProperty('meeting');
      expect(response.body.data[0].meeting).toHaveProperty('title');
      expect(response.body.data[0].status).not.toBe('COMPLETED');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/action-items/overdue');
      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/action-items/:id/status', () => {
    it('should update status to IN_PROGRESS successfully', async () => {
      const token = generateToken();
      mockPrisma.actionItem.findUnique.mockResolvedValue(sampleActionItem);
      mockPrisma.actionItem.update.mockResolvedValue({
        ...sampleActionItem,
        status: 'IN_PROGRESS',
      });

      const response = await request(app)
        .patch('/api/action-items/action-item-uuid-123/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'IN_PROGRESS' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('IN_PROGRESS');
    });

    it('should update status to COMPLETED successfully', async () => {
      const token = generateToken();
      mockPrisma.actionItem.findUnique.mockResolvedValue(sampleActionItem);
      mockPrisma.actionItem.update.mockResolvedValue({
        ...sampleActionItem,
        status: 'COMPLETED',
      });

      const response = await request(app)
        .patch('/api/action-items/action-item-uuid-123/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'COMPLETED' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for invalid status', async () => {
      const token = generateToken();

      const response = await request(app)
        .patch('/api/action-items/action-item-uuid-123/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'INVALID_STATUS' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 when action item is not found', async () => {
      const token = generateToken();
      mockPrisma.actionItem.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/action-items/non-existent-id/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'COMPLETED' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/action-items', () => {
    it('should return filtered action items by status', async () => {
      const token = generateToken();

      mockPrisma.$transaction.mockResolvedValue([
        [sampleActionItem],
        1,
      ]);

      const response = await request(app)
        .get('/api/action-items?status=PENDING')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('actionItems');
      expect(response.body.data).toHaveProperty('total');
    });

    it('should return filtered action items by assignee', async () => {
      const token = generateToken();

      mockPrisma.$transaction.mockResolvedValue([
        [sampleActionItem],
        1,
      ]);

      const response = await request(app)
        .get('/api/action-items?assignee=Alice')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return filtered action items by meetingId', async () => {
      const token = generateToken();

      mockPrisma.$transaction.mockResolvedValue([
        [sampleActionItem],
        1,
      ]);

      const response = await request(app)
        .get('/api/action-items?meetingId=meeting-uuid-123')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('actionItems');
    });
  });
});
