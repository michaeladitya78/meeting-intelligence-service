AI Approach
===========

This document explains our approach to prompt engineering, citation grounding, hallucination prevention, and output validation using Google Gemini AI.

Prompt Design
=============

We use Google Gemini 1.5 Flash as our AI analysis engine. The prompt is designed to instruct the model to act as a precise meeting analyst. We provide a system instruction that restricts the model to only using information explicitly stated in the transcript.

The model is requested to return a JSON object with a strict structure containing arrays for:
1. Summary: Concise summary points.
2. Decisions: Key decisions made during the meeting.
3. Action items: Tasks, assignees, and due dates.
4. Follow-ups: Suggested next steps.

We configure the API request with a low temperature of 0.1 and topP of 0.8 to make the output highly deterministic and reduce creative responses.

Citation Strategy
=================

To ensure grounding, every extracted item must contain a citation. A citation is a JSON object with:
- timestamp: The exact time the quote was spoken (example: 02:30).
- speaker: The name of the speaker.
- quote: The exact sentence from the transcript.

This structure allows users to verify where each summary point, decision, and action item came from.

Hallucination Prevention Approach
=================================

We use a multi-layered approach to prevent hallucinations:
1. System instructions: We instruct the model to never invent or assume information.
2. Low temperature: Minimizes randomness in the model response.
3. Post-parse validation: The system checks that the response is structured correctly and that every item contains at least one citation. If a citation is missing, the response is rejected.
4. Automatic retry: If a request fails or returns invalid JSON, the system attempts the API call one more time.

Output Validation Strategy
==========================

We clean the raw text response by removing markdown formatting blocks if the model includes them (for example, wrapping the output in json code block indicators). The parsed JSON is validated before saving it to the database to ensure all expected properties are present and correctly formatted.

Known Limitations
=================

- The Gemini API can occasionally fail to format the JSON correctly under heavy load or with very long transcripts. The application handles this with a single retry.
- The prompt expects timestamps in the format of MM:SS. Transcripts with other formats may result in inconsistent citations.
- The Gemini free tier has rate limits that could affect performance in high-traffic environments.
