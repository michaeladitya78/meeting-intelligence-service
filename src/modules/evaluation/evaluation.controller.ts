import { Request, Response } from 'express';
import { ok } from '../../utils/response';

/**
 * @swagger
 * /api/evaluation:
 *   get:
 *     summary: Get evaluation metadata for the candidate submission
 *     tags: [Evaluation]
 *     security: []
 *     responses:
 *       200:
 *         description: Evaluation data
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
 *                         candidateName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         repositoryUrl:
 *                           type: string
 *                         deployedUrl:
 *                           type: string
 *                         externalIntegration:
 *                           type: string
 *                         features:
 *                           type: array
 *                           items:
 *                             type: string
 */
export const getEvaluation = (req: Request, res: Response): void => {
  ok(
    res,
    {
      candidateName: 'Michael Aditya',
      email: 'michaeladitya8888@gmail.com',
      repositoryUrl: 'https://github.com/michaeladitya78/meeting-intelligence-service',
      deployedUrl: 'http://localhost:3000',
      externalIntegration: 'Resend Email API',
      features: [
        'JWT Authentication',
        'Meeting Management with Pagination',
        'AI Analysis via Google Gemini',
        'Transcript Citation Grounding',
        'Hallucination Prevention',
        'Action Item Management',
        'Overdue Detection',
        'Scheduled Reminder Job',
        'Email Integration via Resend',
        'Structured Logging with Winston',
        'Request Trace IDs',
        'Global Error Handling',
        'Input Validation with Zod',
        'Swagger API Documentation',
        'Docker Support',
      ],
    },
    200,
    req.traceId
  );
};
