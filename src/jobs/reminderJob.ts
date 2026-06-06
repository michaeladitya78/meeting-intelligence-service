import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { sendReminderEmail } from '../integrations/resend.client';
import logger from '../config/logger';
import { ActionStatus } from '@prisma/client';

export const processOverdueReminders = async (): Promise<void> => {
  const traceId = uuidv4();
  const now = new Date();

  logger.info('starting overdue action items reminder job', { traceId });

  try {
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
    });

    logger.info(`found ${overdueItems.length} overdue action items`, { traceId });

    for (const item of overdueItems) {
      try {
        const result = await sendReminderEmail({
          id: item.id,
          task: item.task,
          assignee: item.assignee,
          dueDate: item.dueDate,
          status: item.status,
          meeting: item.meeting,
        });

        await prisma.reminderLog.create({
          data: {
            actionItemId: item.id,
            channel: 'email',
            success: result.success,
            errorMessage: result.error || null,
          },
        });

        logger.info(`reminder ${result.success ? 'sent' : 'failed'} for action item ${item.id}`, {
          traceId,
          task: item.task,
          assignee: item.assignee,
          success: result.success,
          error: result.error,
        });
      } catch (itemError) {
        logger.error(`error processing reminder for action item ${item.id}`, {
          traceId,
          error: (itemError as Error).message,
        });

        await prisma.reminderLog.create({
          data: {
            actionItemId: item.id,
            channel: 'email',
            success: false,
            errorMessage: (itemError as Error).message,
          },
        }).catch(() => {});
      }
    }

    logger.info('completed overdue action items reminder job', { traceId, count: overdueItems.length });
  } catch (error) {
    logger.error('fatal error in reminder job', {
      traceId,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
  }
};

export const startReminderJob = (): void => {
  const isDev = process.env.NODE_ENV === 'development';
  const schedule = isDev ? '* * * * *' : '0 9 * * *';

  logger.info(`reminder job scheduled: ${isDev ? 'every minute (dev)' : 'daily at 9 AM (prod)'}`, {
    schedule,
    env: process.env.NODE_ENV,
  });

  cron.schedule(schedule, processOverdueReminders, {
    scheduled: true,
    timezone: 'UTC',
  });
};
