import { Request, Response, NextFunction } from 'express';
import { analyzeMeeting } from './analysis.service';
import { ok } from '../../utils/response';

/**
 * @swagger
 * /api/meetings/{id}/analyze:
 *   post:
 *     summary: Analyze a meeting transcript using Google Gemini AI
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Meeting ID to analyze
 *     responses:
 *       200:
 *         description: Analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/MeetingAnalysis'
 *       404:
 *         description: Meeting not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Gemini API error
 */
export const analyzeMeetingController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const meetingId = req.params.id;

    const analysis = await analyzeMeeting(meetingId, userId, req.traceId);
    ok(res, analysis, 200, req.traceId);
  } catch (err) {
    next(err);
  }
};
