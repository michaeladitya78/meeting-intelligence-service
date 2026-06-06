import prisma from '../../config/database';
import { CreateMeetingInput } from './meetings.schema';
import { AppError } from '../../middleware/errorHandler.middleware';

export const createMeeting = async (
  input: CreateMeetingInput,
  userId: string
) => {
  const meeting = await prisma.meeting.create({
    data: {
      title: input.title,
      participants: input.participants,
      meetingDate: new Date(input.meetingDate),
      transcript: input.transcript,
      createdBy: userId,
    },
    include: {
      user: {
        select: { id: true, email: true, name: true },
      },
    },
  });

  return meeting;
};

export const getMeetingById = async (id: string, userId: string) => {
  const meeting = await prisma.meeting.findFirst({
    where: { id, createdBy: userId },
    include: {
      analyses: true,
      actionItems: true,
      user: {
        select: { id: true, email: true, name: true },
      },
    },
  });

  if (!meeting) {
    throw new AppError('Meeting not found', 404, 'NOT_FOUND');
  }

  return meeting;
};

export const listMeetings = async (
  userId: string,
  page: number,
  limit: number
) => {
  const skip = (page - 1) * limit;

  const [meetings, total] = await prisma.$transaction([
    prisma.meeting.findMany({
      where: { createdBy: userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { actionItems: true, analyses: true },
        },
      },
    }),
    prisma.meeting.count({ where: { createdBy: userId } }),
  ]);

  return {
    meetings,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};
