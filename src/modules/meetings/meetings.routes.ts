import { Router } from 'express';
import {
  createMeetingController,
  getMeetingController,
  listMeetingsController,
} from './meetings.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createMeetingSchema } from './meetings.schema';

/**
 * @swagger
 * tags:
 *   name: Meetings
 *   description: Meeting management endpoints
 */

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createMeetingSchema), createMeetingController);
router.get('/', listMeetingsController);
router.get('/:id', getMeetingController);

export default router;
