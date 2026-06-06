import { Resend } from 'resend';
import logger from '../config/logger';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface ActionItemForEmail {
  id: string;
  task: string;
  assignee: string;
  dueDate: Date | null;
  status: string;
  meeting: {
    title: string;
  };
}

export const sendReminderEmail = async (
  actionItem: ActionItemForEmail
): Promise<{ success: boolean; error?: string }> => {
  const fromEmail = process.env.REMINDER_FROM_EMAIL || 'reminders@yourdomain.com';
  const toEmail = process.env.REMINDER_TO_EMAIL || 'admin@yourdomain.com';

  const dueDateStr = actionItem.dueDate
    ? new Date(actionItem.dueDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'No due date set';

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #e74c3c;">⚠️ Action Item Overdue</h2>
      <div style="background: #f8f9fa; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0;">
        <p><strong>Task:</strong> ${actionItem.task}</p>
        <p><strong>Assigned To:</strong> ${actionItem.assignee}</p>
        <p><strong>Due Date:</strong> ${dueDateStr}</p>
        <p><strong>Status:</strong> <span style="color: #e67e22;">${actionItem.status}</span></p>
        <p><strong>Meeting:</strong> ${actionItem.meeting.title}</p>
      </div>
      <p style="color: #666; font-size: 12px;">
        This is an automated reminder from the Meeting Intelligence Service.
        Please update the action item status when completed.
      </p>
    </div>
  `;

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `⚠️ Overdue Action Item: ${actionItem.task}`,
      html: htmlBody,
    });

    if (error) {
      logger.error('Resend email error', {
        error: error.message,
        actionItemId: actionItem.id,
      });
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = (err as Error).message;
    logger.error('Failed to send reminder email', {
      error: errorMessage,
      actionItemId: actionItem.id,
    });
    return { success: false, error: errorMessage };
  }
};
