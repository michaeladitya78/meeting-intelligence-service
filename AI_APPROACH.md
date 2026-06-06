# AI Approach: Prompt Engineering & Hallucination Prevention

## Overview

The Meeting Intelligence Service uses Google Gemini 1.5 Flash to analyze meeting transcripts. The core challenge is ensuring the AI only reports what was actually said — not what it imagines was said. This document describes the strategies employed.

---

## Prompt Engineering Strategy

### Strict JSON Output

The prompt is designed to produce ONLY valid JSON with no markdown, no explanation, and no preamble. The system instruction reinforces this:

```
You are a precise meeting analyst. You must ONLY use information explicitly stated in the transcript. Never invent, assume, or add information not present. Every insight must cite its source timestamp(s).
```

The user prompt specifies the exact JSON structure required, with field names, types, and nesting. This leaves minimal ambiguity for the model.

### Temperature Setting

We use `temperature: 0.1` — very low temperature — to minimize creative/random outputs. Lower temperature forces the model to be more deterministic and stick closely to the input.

### Context Window Strategy

The entire transcript is passed as `JSON.stringify(transcript, null, 2)` — pretty-printed JSON. This format is extremely LLM-friendly since:
- Consistent, predictable structure
- Timestamp fields are clearly labeled
- Speaker fields are explicit
- The model can reference exact strings

---

## Citation Strategy

**Every single item** in the analysis must include at least one citation with:

1. **`timestamp`** — The exact MM:SS from the transcript (e.g., `"02:30"`)
2. **`speaker`** — The exact speaker name as it appears in the transcript
3. **`quote`** — The exact text from that transcript entry

This citation triplet serves as an **evidence chain** linking every AI claim back to the source material.

Example citation:
```json
{
  "timestamp": "04:15",
  "speaker": "Bob",
  "quote": "I will prepare the budget report by end of Friday."
}
```

---

## Hallucination Prevention

Four layers of hallucination prevention are implemented:

### Layer 1: Prompt-Level Rules

Explicit rules in the user prompt:
- "ONLY include information explicitly stated in the transcript"
- "Every item MUST have at least one citation"
- "Citations must reference real timestamps from the transcript"
- "Assignees must be names that appear in the transcript"

### Layer 2: Low Temperature

`temperature: 0.1` and `topP: 0.8` reduce the probability of the model generating novel, ungrounded content.

### Layer 3: Post-Parse Validation

Before saving to the database, the `validateAnalysisResult()` function checks:
- All top-level sections (`summary`, `decisions`, `actionItems`, `followUps`) are arrays
- Every item in every section has a non-empty `citations` array
- If validation fails, the response is rejected — not saved

```typescript
for (const item of result[section]) {
  if (!item.citations || !Array.isArray(item.citations) || item.citations.length === 0) {
    throw new Error(`Every item in "${section}" must have at least one citation`);
  }
}
```

### Layer 4: Retry Logic

If JSON parsing fails (malformed output), the system retries exactly once. If the retry also fails, a structured error is thrown:

```typescript
try {
  const parsed = await attempt();
  validateAnalysisResult(parsed);
  return parsed;
} catch (firstError) {
  // Log warning, retry once
  const parsed = await attempt();
  validateAnalysisResult(parsed);
  return parsed;
}
```

---

## Output Validation

The `parseGeminiResponse()` function handles two failure modes:

1. **Markdown-wrapped JSON** — Gemini sometimes wraps JSON in ` ```json ``` ` fences despite instructions. We strip these with regex before parsing.

2. **Malformed JSON** — If `JSON.parse()` throws, we retry once. If the second attempt also fails, we surface a clear error to the client.

```typescript
let cleaned = text.trim();
if (cleaned.startsWith('```json')) {
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```\s*$/, '');
}
return JSON.parse(cleaned) as AnalysisResult;
```

---

## Action Item Auto-Creation

After a successful analysis, the system automatically creates `ActionItem` database records from the AI-extracted action items. This ensures:

- Action items are persisted with their citations
- The reminder job can immediately query them
- Users can track status without re-running analysis

---

## Known Limitations

1. **JSON failures**: Despite low temperature, Gemini may occasionally produce malformed JSON (especially with very long transcripts). The retry logic handles this but cannot guarantee 100% success.

2. **Timestamp format**: The prompt requests `MM:SS` format. If transcripts use different timestamp formats, citations may have inconsistent appearance.

3. **Rate limits**: Free tier is 15 RPM. High-traffic environments need paid tier or request queuing.

4. **Long transcripts**: Very long transcripts (>100K tokens) may be truncated by the model. For enterprise use, chunk-and-merge strategies should be implemented.

5. **Speaker name variations**: If a speaker is referred to by different names in the transcript (e.g., "Bob" vs "Robert"), citations may reference different name forms.
