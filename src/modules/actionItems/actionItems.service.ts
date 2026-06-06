import prisma from '../../config/database';
import { CreateActionItemInput, UpdateStatusInput } from './actionItems.schema';
import { AppError } from '../../middleware/errorHandler.middleware';
import { ActionStatus } from '@prisma/client';

export const createActionItem = async (input: CreateActionItemInput) => {
  // Verify meeting exists
  const meeting = await prisma.meeting.findUnique({
    where: { id: input.meetingId },
  });

  if (!meeting) {
    throw new AppError('Meeting not found', 404, 'NOT_FOUND');
  }

  const actionItem = await prisma.actionItem.create({
    data: {
      meetingId: input.meetingId,
      task: input.task,
      assignee: input.assignee,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      citations: input.citations,
    },
    include: {
      meeting: {
        select: { id: true, title: true },
      },
    },
  });

  return actionItem;
};

export const updateActionItemStatus = async (
  id: string,
  input: UpdateStatusInput
) => {
  const actionItem = await prisma.actionItem.findUnique({ where: { id } });

  if (!actionItem) {
    throw new AppError('Action item not found', 404, 'NOT_FOUND');
  }

  const updated = await prisma.actionItem.update({
    where: { id },
    data: { status: input.status as ActionStatus },
    include: {
      meeting: {
        select: { id: true, title: true },
      },
    },
  });

  return updated;
};

export const listActionItems = async (
  filters: {
    status?: string;
    assignee?: string;
    meetingId?: string;
  },
  page: number,
  limit: number
) => {
  const where: Record<string, unknown> = {};

  if (filters.status) {
    where.status = filters.status as ActionStatus;
  }
  if (filters.assignee) {
    where.assignee = { contains: filters.assignee, mode: 'insensitive' };
  }
  if (filters.meetingId) {
    where.meetingId = filters.meetingId;
  }

  const skip = (page - 1) * limit;

  const [actionItems, total] = await prisma.$transaction([
    prisma.actionItem.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        meeting: {
          select: { id: true, title: true },
        },
      },
    }),
    prisma.actionItem.count({ where }),
  ]);

  return {
    actionItems,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getOverdueActionItems = async () => {
  const now = new Date();

  const overdueItems = await prisma.actionItem.findMany({
    where: {
      status: { not: ActionStatus.COMPLETED },
      dueDate: { lt: now, not: null },
    },
    include: {
      meeting: {
        select: { id: true, title: true },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  return overdueItems;
};
