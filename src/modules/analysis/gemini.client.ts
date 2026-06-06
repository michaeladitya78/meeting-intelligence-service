import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../../config/logger';

export interface Citation {
  timestamp: string;
  speaker: string;
  quote: string;
}

export interface AnalysisResult {
  summary: Array<{ text: string; citations: Citation[] }>;
  decisions: Array<{ text: string; citations: Citation[] }>;
  actionItems: Array<{
    task: string;
    assignee: string;
    dueDate: string | null;
    citations: Citation[];
  }>;
  followUps: Array<{ text: string; citations: Citation[] }>;
}

const parseGeminiResponse = (text: string): AnalysisResult => {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```\s*$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```\s*$/, '');
  }

  return JSON.parse(cleaned) as AnalysisResult;
};

const validateAnalysisResult = (result: AnalysisResult): void => {
  const sections = ['summary', 'decisions', 'actionItems', 'followUps'] as const;

  for (const section of sections) {
    if (!Array.isArray(result[section])) {
      throw new Error(`Invalid analysis: "${section}" must be an array`);
    }
    for (const item of result[section]) {
      if (!item.citations || !Array.isArray(item.citations) || item.citations.length === 0) {
        throw new Error(
          `Invalid analysis: every item in "${section}" must have at least one citation`
        );
      }
    }
  }
};

export const analyzeTranscript = async (
  transcript: unknown[],
  traceId?: string
): Promise<AnalysisResult> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const systemInstruction = `You are a precise meeting analyst. You must ONLY use information explicitly stated in the transcript. Never invent, assume, or add information not present. Every insight must cite its source timestamp(s).`;

  const userPrompt = `Analyze this meeting transcript and return a JSON object with exactly this structure:
{
  "summary": [
    {
      "text": "concise summary point",
      "citations": [{ "timestamp": "MM:SS", "speaker": "Name", "quote": "exact quote from transcript" }]
    }
  ],
  "decisions": [
    {
      "text": "decision made",
      "citations": [{ "timestamp": "MM:SS", "speaker": "Name", "quote": "exact quote" }]
    }
  ],
  "actionItems": [
    {
      "task": "specific task",
      "assignee": "person's name exactly as in transcript",
      "dueDate": "ISO date string or null",
      "citations": [{ "timestamp": "MM:SS", "speaker": "Name", "quote": "exact quote" }]
    }
  ],
  "followUps": [
    {
      "text": "follow-up suggestion",
      "citations": [{ "timestamp": "MM:SS", "speaker": "Name", "quote": "exact quote" }]
    }
  ]
}

Rules:
- ONLY include information explicitly stated in the transcript
- Every item MUST have at least one citation
- Citations must reference real timestamps from the transcript
- Assignees must be names that appear in the transcript
- Return ONLY valid JSON, no markdown, no explanation

Transcript:
${JSON.stringify(transcript, null, 2)}`;

  const attempt = async (): Promise<AnalysisResult> => {
    const result = await model.generateContent({
      systemInstruction,
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 8192,
      },
    });

    const responseText = result.response.text();
    return parseGeminiResponse(responseText);
  };

  try {
    const parsed = await attempt();
    validateAnalysisResult(parsed);
    return parsed;
  } catch (firstError) {
    logger.warn('Gemini first attempt failed, retrying once', {
      error: (firstError as Error).message,
      traceId,
    });

    try {
      const parsed = await attempt();
      validateAnalysisResult(parsed);
      return parsed;
    } catch (secondError) {
      logger.error('Gemini analysis failed after retry', {
        error: (secondError as Error).message,
        traceId,
      });
      throw new Error(
        `Gemini analysis failed: ${(secondError as Error).message}`
      );
    }
  }
};
