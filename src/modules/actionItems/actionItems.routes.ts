import { Router } from 'express';
import {
  createActionItemController,
  updateStatusController,
  listActionItemsController,
  getOverdueController,
} from './actionItems.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createActionItemSchema, updateStatusSchema } from './actionItems.schema';

/**
 * @swagger
 * tags:
 *   name: Action Items
 *   description: Action item management endpoints
 */

const router = Router();

router.use(authMiddleware);

router.get('/overdue', getOverdueController);
router.get('/', listActionItemsController);
router.post('/', validate(createActionItemSchema), createActionItemController);
router.patch('/:id/status', validate(updateStatusSchema), updateStatusController);

export default router;
