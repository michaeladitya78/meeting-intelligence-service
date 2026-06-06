import { Router } from 'express';
import { analyzeMeetingController } from './analysis.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

/**
 * @swagger
 * tags:
 *   name: Analysis
 *   description: AI-powered meeting analysis endpoints
 */

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.post('/:id/analyze', analyzeMeetingController);

export default router;
