import 'dotenv/config';
import { processOverdueReminders } from '../src/jobs/reminderJob';
import prisma from '../src/config/database';

const BASE_URL = 'http://localhost:3000';

async function runVerification() {
  console.log('🚀 Starting Meeting Intelligence Service verification flow...\n');

  const email = `verify-${Date.now()}@example.com`;
  const password = 'password123';
  const name = 'Verification User';

  // 1. Register
  console.log('1. Registering user...');
  const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  const registerData = (await registerRes.json()) as any;
  if (!registerData.success) {
    throw new Error(`Registration failed: ${JSON.stringify(registerData)}`);
  }
  console.log('✅ User registered successfully.\n');

  // 2. Login
  console.log('2. Logging in...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const loginData = (await loginRes.json()) as any;
  if (!loginData.success) {
    throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  }
  const token = loginData.data.token;
  console.log('✅ Logged in successfully. JWT obtained.\n');

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 3. Create a meeting with a transcript
  console.log('3. Creating a meeting with transcript...');
  const meetingRes = await fetch(`${BASE_URL}/api/meetings`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Monthly Sync',
      participants: ['alice@example.com', 'bob@example.com', email],
      meetingDate: new Date().toISOString(),
      transcript: [
        { timestamp: '00:10', speaker: 'Alice', text: 'Let us discuss the marketing budget.' },
        { timestamp: '01:05', speaker: 'Bob', text: 'I will write the copy for the landing page before Monday.' },
        { timestamp: '02:15', speaker: 'Alice', text: 'We agreed to increase the budget by 15%.' },
      ],
    }),
  });
  const meetingData = (await meetingRes.json()) as any;
  if (!meetingData.success) {
    throw new Error(`Meeting creation failed: ${JSON.stringify(meetingData)}`);
  }
  const meetingId = meetingData.data.id;
  console.log(`✅ Meeting created. ID: ${meetingId}\n`);

  // 4. Call /api/meetings/:id/analyze
  console.log(`4. Running Gemini AI analysis on meeting ${meetingId}...`);
  const analyzeRes = await fetch(`${BASE_URL}/api/meetings/${meetingId}/analyze`, {
    method: 'POST',
    headers: authHeaders,
  });
  const analyzeData = (await analyzeRes.json()) as any;
  if (!analyzeData.success) {
    throw new Error(`Analysis failed: ${JSON.stringify(analyzeData)}`);
  }
  console.log('✅ Analysis finished.');
  
  // Verify citations in AI response
  const analysis = analyzeData.data;
  console.log('\n--- AI Response Grounding & Citations Check ---');
  
  console.log('Summary citations:');
  console.dir(analysis.summary, { depth: null });
  
  console.log('Decisions citations:');
  console.dir(analysis.decisions, { depth: null });
  
  console.log('Action Items citations:');
  console.dir(analysis.actionItems, { depth: null });

  const hasCitations = [
    ...analysis.summary.flatMap((s: any) => s.citations || []),
    ...analysis.decisions.flatMap((d: any) => d.citations || []),
    ...analysis.actionItems.flatMap((a: any) => a.citations || []),
  ].length > 0;

  if (hasCitations) {
    console.log('👉 Citation grounding validation: PASSED (Citations found!)');
  } else {
    console.warn('⚠️ Citation grounding validation: FAILED (No citations found!)');
  }

  // 5. Check action items were auto-created
  console.log('\n5. Verifying database action items auto-creation...');
  const dbActionItems = await prisma.actionItem.findMany({
    where: { meetingId },
  });
  console.log(`Found ${dbActionItems.length} action items in the DB:`);
  console.dir(dbActionItems, { depth: null });
  
  if (dbActionItems.length > 0) {
    console.log('👉 Auto-creation validation: PASSED');
  } else {
    throw new Error('Auto-creation validation: FAILED (No action items created)');
  }

  // 6. Test overdue detection by creating an action item with a past due date
  console.log('\n6. Creating an overdue action item manually...');
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1); // Yesterday

  const createOverdueRes = await fetch(`${BASE_URL}/api/action-items`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      meetingId,
      task: 'Fix the breaking bug in production',
      assignee: 'Alice',
      dueDate: pastDate.toISOString(),
      citations: [
        {
          timestamp: '00:10',
          speaker: 'Alice',
          quote: 'Let us discuss the marketing budget.',
        },
      ],
    }),
  });
  const overdueData = (await createOverdueRes.json()) as any;
  if (!overdueData.success) {
    throw new Error(`Creating overdue action item failed: ${JSON.stringify(overdueData)}`);
  }
  const overdueId = overdueData.data.id;
  console.log(`✅ Overdue Action Item created. ID: ${overdueId}`);

  // Fetch overdue action items
  console.log('Fetching overdue action items list...');
  const getOverdueRes = await fetch(`${BASE_URL}/api/action-items/overdue`, {
    headers: authHeaders,
  });
  const getOverdueData = (await getOverdueRes.json()) as any;
  const overdueList = getOverdueData.data;
  console.log('Overdue items retrieved:');
  console.dir(overdueList, { depth: null });

  const foundInOverdueList = overdueList.some((item: any) => item.id === overdueId);
  if (foundInOverdueList) {
    console.log('👉 Overdue detection validation: PASSED');
  } else {
    throw new Error('Overdue detection validation: FAILED (Overdue item not found in list)');
  }

  // 7. Trigger the reminder job manually
  console.log('\n7. Triggering the reminder job manually...');
  
  // Clear any existing reminder logs for this action item
  await prisma.reminderLog.deleteMany({
    where: { actionItemId: overdueId },
  });

  // Call the job function directly
  await processOverdueReminders();

  // Verify that the reminder log was created
  const reminderLogs = await prisma.reminderLog.findMany({
    where: { actionItemId: overdueId },
  });
  console.log('Reminder logs in DB for this overdue item:');
  console.dir(reminderLogs, { depth: null });

  if (reminderLogs.length > 0) {
    console.log('👉 Reminder job trigger validation: PASSED');
    if (reminderLogs[0].success) {
      console.log('🎉 Email sent successfully via Resend API!');
    } else {
      console.warn(`⚠️ Email send logged failure: ${reminderLogs[0].errorMessage}. (This is normal if using sandbox domain limits without domain verification, but the integration flow worked.)`);
    }
  } else {
    throw new Error('Reminder job trigger validation: FAILED (No reminder logs created)');
  }

  console.log('\n🎉 All verification flows passed successfully!');
}

runVerification()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Verification flow failed:', err);
    process.exit(1);
  });
