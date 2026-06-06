import { Request, Response, NextFunction } from 'express';
import {
  createMeeting,
  getMeetingById,
  listMeetings,
} from './meetings.service';
import { ok } from '../../utils/response';

/**
 * @swagger
 * /api/meetings:
 *   post:
 *     summary: Create a new meeting
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, participants, meetingDate, transcript]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Q4 Planning Meeting
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *                 example: [alice@example.com, bob@example.com]
 *               meetingDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-12-15T10:00:00.000Z
 *               transcript:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/TranscriptEntry'
 *     responses:
 *       201:
 *         description: Meeting created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Meeting'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
export const createMeetingController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const meeting = await createMeeting(req.body, userId);
    ok(res, meeting, 201, req.traceId);
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/meetings/{id}:
 *   get:
 *     summary: Get a meeting by ID
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Meeting retrieved successfully
 *       404:
 *         description: Meeting not found
 *       401:
 *         description: Unauthorized
 */
export const getMeetingController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const meeting = await getMeetingById(req.params.id, userId);
    ok(res, meeting, 200, req.traceId);
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/meetings:
 *   get:
 *     summary: List all meetings with pagination
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated list of meetings
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         meetings:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Meeting'
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 */
export const listMeetingsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));

    const result = await listMeetings(userId, page, limit);
    ok(res, result, 200, req.traceId);
  } catch (err) {
    next(err);
  }
};
