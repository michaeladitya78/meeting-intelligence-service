import prisma from '../../config/database';
import { analyzeTranscript } from './gemini.client';
import { AppError } from '../../middleware/errorHandler.middleware';
import { Prisma } from '@prisma/client';

export const analyzeMeeting = async (
  meetingId: string,
  userId: string,
  traceId?: string
) => {
  // Fetch meeting and verify ownership
  const meeting = await prisma.meeting.findFirst({
    where: { id: meetingId, createdBy: userId },
  });

  if (!meeting) {
    throw new AppError('Meeting not found', 404, 'NOT_FOUND');
  }

  // Call Gemini with the transcript
  const analysisResult = await analyzeTranscript(
    meeting.transcript as unknown[],
    traceId
  );

  // Save analysis to DB
  const analysis = await prisma.meetingAnalysis.create({
    data: {
      meetingId,
      summary: analysisResult.summary as unknown as Prisma.InputJsonValue,
      decisions: analysisResult.decisions as unknown as Prisma.InputJsonValue,
      actionItems: analysisResult.actionItems as unknown as Prisma.InputJsonValue,
      followUps: analysisResult.followUps as unknown as Prisma.InputJsonValue,
    },
  });

  // Auto-create ActionItems from the Gemini response
  const actionItemsToCreate = analysisResult.actionItems.map((item) => ({
    meetingId,
    task: item.task,
    assignee: item.assignee,
    dueDate: item.dueDate ? new Date(item.dueDate) : null,
    citations: item.citations as unknown as Prisma.InputJsonValue,
    status: 'PENDING' as const,
  }));

  if (actionItemsToCreate.length > 0) {
    await prisma.actionItem.createMany({
      data: actionItemsToCreate,
    });
  }

  // Return analysis with freshly created action items
  const fullAnalysis = await prisma.meetingAnalysis.findUnique({
    where: { id: analysis.id },
    include: {
      meeting: {
        include: {
          actionItems: true,
        },
      },
    },
  });

  return fullAnalysis;
};
