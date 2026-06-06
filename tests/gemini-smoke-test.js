require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const transcript = [
  { timestamp: '00:01', speaker: 'Alice', text: 'Good morning everyone. Let us review Q4 priorities.' },
  { timestamp: '01:30', speaker: 'Bob', text: 'I will prepare the budget report by next Friday.' },
  { timestamp: '03:00', speaker: 'Alice', text: 'We decided to launch the new feature in January.' },
  { timestamp: '04:15', speaker: 'Carol', text: 'I will schedule a follow-up meeting with the design team by end of this week.' }
];

async function main() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const result = await model.generateContent({
    systemInstruction: 'You are a precise meeting analyst. Only use information explicitly stated in the transcript. Return ONLY valid JSON, no markdown.',
    contents: [{ role: 'user', parts: [{ text: `Return a JSON object with exactly these keys: summary (array of {text, citations}), decisions (array of {text, citations}), actionItems (array of {task, assignee, dueDate, citations}), followUps (array of {text, citations}). Each citations item must have timestamp, speaker, quote fields. Transcript: ${JSON.stringify(transcript)}` }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
  });

  const text = result.response.text();
  console.log('=== RAW RESPONSE (first 600 chars) ===');
  console.log(text.substring(0, 600));
  console.log('...');

  // Parse
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```\s*$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```\s*$/, '');
  }

  const parsed = JSON.parse(cleaned);
  console.log('\n=== PARSED RESULT ===');
  console.log('Keys:', Object.keys(parsed));
  console.log('Summary items:', parsed.summary?.length || 0);
  console.log('Decisions:', parsed.decisions?.length || 0);
  console.log('Action items:', parsed.actionItems?.length || 0);
  console.log('Follow-ups:', parsed.followUps?.length || 0);
  if (parsed.actionItems?.length > 0) {
    console.log('\nFirst action item:', JSON.stringify(parsed.actionItems[0], null, 2));
  }
  console.log('\n✅ Gemini API and JSON parsing working correctly!');
}

main().catch(e => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
