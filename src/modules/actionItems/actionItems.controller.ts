import { Request, Response, NextFunction } from 'express';
import {
  createActionItem,
  updateActionItemStatus,
  listActionItems,
  getOverdueActionItems,
} from './actionItems.service';
import { ok } from '../../utils/response';

/**
 * @swagger
 * /api/action-items:
 *   post:
 *     summary: Create a new action item
 *     tags: [Action Items]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [meetingId, task, assignee, citations]
 *             properties:
 *               meetingId:
 *                 type: string
 *                 format: uuid
 *               task:
 *                 type: string
 *                 example: Prepare Q4 budget report
 *               assignee:
 *                 type: string
 *                 example: Alice
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               citations:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Citation'
 *     responses:
 *       201:
 *         description: Action item created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
export const createActionItemController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const actionItem = await createActionItem(req.body);
    ok(res, actionItem, 201, req.traceId);
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/action-items/{id}/status:
 *   patch:
 *     summary: Update the status of an action item
 *     tags: [Action Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, COMPLETED]
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Action item not found
 */
export const updateStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const actionItem = await updateActionItemStatus(req.params.id, req.body);
    ok(res, actionItem, 200, req.traceId);
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/action-items:
 *   get:
 *     summary: List action items with optional filters and pagination
 *     tags: [Action Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, COMPLETED]
 *       - in: query
 *         name: assignee
 *         schema:
 *           type: string
 *       - in: query
 *         name: meetingId
 *         schema:
 *           type: string
 *           format: uuid
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
 *         description: Paginated list of action items
 */
export const listActionItemsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, assignee, meetingId } = req.query;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));

    const result = await listActionItems(
      {
        status: status as string | undefined,
        assignee: assignee as string | undefined,
        meetingId: meetingId as string | undefined,
      },
      page,
      limit
    );

    ok(res, result, 200, req.traceId);
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/action-items/overdue:
 *   get:
 *     summary: Get all overdue action items
 *     tags: [Action Items]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of overdue action items with meeting title
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/ActionItem'
 *                           - type: object
 *                             properties:
 *                               meeting:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                   title:
 *                                     type: string
 */
export const getOverdueController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const overdueItems = await getOverdueActionItems();
    ok(res, overdueItems, 200, req.traceId);
  } catch (err) {
    next(err);
  }
};
