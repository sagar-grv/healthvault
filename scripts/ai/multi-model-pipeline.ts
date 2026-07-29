/**
 * Multi-Model Pipeline — Decoupled AI agents for specialized tasks
 *
 * Stage 1 (UX Psychologist): deepseek-r1 — Chain-of-thought UX validation
 * Stage 2 (Architect):        glm-5.1   — Long-context dependency mapping
 * Stage 3 (Layout Engineer):  qwen-2.5-coder — Spatial-aware frontend refactoring
 *
 * All models accessed via NVIDIA NIM API (OpenAI-compatible).
 * This pipeline is project-agnostic — callable for any project.
 */

export type PipelineStage = 'thought' | 'arch' | 'layout';

export interface PipelineResponse {
  text: string;
  stage: PipelineStage;
  model: string;
}

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

const PIPELINE_MODELS: Record<PipelineStage, { primary: string; fallback: string }> = {
  thought: {
    primary: 'deepseek-ai/deepseek-r1',
    fallback: 'deepseek-ai/deepseek-r1',
  },
  arch: {
    primary: 'z-ai/glm-5.1',
    fallback: 'moonshotai/kimi-k2.6',
  },
  layout: {
    primary: 'qwen/qwen-2.5-coder-32b-instruct',
    fallback: 'nvidia/llama-3.3-nemotron-70b-instruct',
  },
};

const PIPELINE_TEMPS: Record<PipelineStage, number> = {
  thought: 0.6,
  arch: 0.2,
  layout: 0.1,
};

const PIPELINE_MAX_TOKENS: Record<PipelineStage, number> = {
  thought: 8192,
  arch: 8192,
  layout: 8192,
};

async function callPipelineModel(
  stage: PipelineStage,
  messages: PipelineMessage[],
  maxTokens?: number
): Promise<PipelineResponse> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error('NVIDIA_API_KEY not configured');

  const { primary, fallback } = PIPELINE_MODELS[stage];
  const temp = PIPELINE_TEMPS[stage];
  const tokens = maxTokens || PIPELINE_MAX_TOKENS[stage];

  try {
    const text = await callNvidiaPipeline(primary, messages, temp, tokens);
    return { text, stage, model: primary };
  } catch (primaryErr) {
    if (primary === fallback) throw primaryErr;
    console.warn(`[Pipeline] ${primary} failed, falling back to ${fallback}`);
    try {
      const text = await callNvidiaPipeline(fallback, messages, temp, tokens);
      return { text, stage, model: fallback };
    } catch (fallbackErr) {
      throw new Error(
        `Pipeline stage "${stage}" failed on both models: ${(primaryErr as Error).message} | ${(fallbackErr as Error).message}`
      );
    }
  }
}

async function callNvidiaPipeline(
  model: string,
  messages: PipelineMessage[],
  temperature: number,
  maxTokens: number
): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error('NVIDIA_API_KEY not configured');

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`NVIDIA Pipeline error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export interface PipelineMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const UX_VALIDATION_PROMPT = `SYSTEM ROLE: Senior Product Manager & Behavioral UX Psychologist.
TASK: Audit the proposed feature flow for cognitive friction before implementation.

CRITIQUE REQUIREMENTS:
1. Identify 3 specific areas where the user will experience cognitive overload.
2. What psychological principle (e.g., Hick's Law, Fogg Behavior Model, Miller's Law) does this flow violate?
3. Predict exactly how this flow will fail or confuse users in production.
4. Provide the optimized step-by-step user path.

OUTPUT FORMAT:
## UX Audit Results

### Cognitive Overload Areas
1. [Area 1]: [Description + why it overloads]
2. [Area 2]: [Description + why it overloads]
3. [Area 3]: [Description + why it overloads]

### Violated Principles
- [Principle]: [How the flow violates it]

### Predicted Failures
- [Failure scenario]: [Why it will happen]

### Optimized Flow
1. [Step 1]
2. [Step 2]
...

### Verdict: [PASS / REVISE]`;

export const DEPENDENCY_MAP_PROMPT = `SYSTEM ROLE: Principal Full-Stack Software Architect.
TASK: Create a strict code dependency migration plan for a feature refactor. Do not output actual code snippets yet.

OUTPUT REQUIREMENT:
Provide a sequential, step-by-step technical dependency roadmap. Tell me exactly what needs to change in the Database first, how the Backend payload must adapt, and how the Frontend state must receive it — without causing breaking runtime errors.

OUTPUT FORMAT:
## Dependency Migration Plan

### Phase 1: Database Changes
- [Change 1]: [What] → [Why] → [Risk level]
- [Change 2]: [What] → [Why] → [Risk level]

### Phase 2: Backend / API Changes
- [Change 1]: [What] → [Why] → [Depends on Phase 1 item #]
- [Change 2]: [What] → [Why] → [Depends on Phase 1 item #]

### Phase 3: Frontend State Changes
- [Change 1]: [What] → [Why] → [Depends on Phase 2 item #]
- [Change 2]: [What] → [Why] → [Depends on Phase 2 item #]

### Phase 4: Integration & Migration
- [Step 1]: [What to test before moving on]
- [Step 2]: [What to test before moving on]

### Rollback Order
1. [Revert Frontend]
2. [Revert Backend]
3. [Revert Database]

### Risk Assessment: [LOW / MEDIUM / HIGH]`;

export const SPATIAL_LAYOUT_PROMPT = `SYSTEM ROLE: Principal Frontend & UI Engineer.
TASK: Rearrange the visual layout components inside the frontend file without breaking the internal state hooks, props, or API integrations.

RULES:
1. NEVER modify useState, useEffect, or any hook calls
2. NEVER modify API call signatures or data fetching logic
3. NEVER modify prop interfaces or type definitions
4. ONLY change the JSX layout structure and CSS/Tailwind classes
5. Maintain mobile responsiveness
6. Use Tailwind CSS utility classes for all layout changes

OUTPUT FORMAT:
## Layout Refactor

### Changes Made
- [Change 1]: [From] → [To]
- [Change 2]: [From] → [To]

### Preserved (Untouched)
- [List of state variables, hooks, and API calls that were NOT modified]

### Refactored Component
\`\`\`tsx
[Full refactored component code]
\`\`\`

### Verification Checklist
- [ ] All useState hooks unchanged
- [ ] All useEffect hooks unchanged
- [ ] All API calls unchanged
- [ ] All props and interfaces unchanged
- [ ] Mobile responsive
- [ ] No new dependencies added`;

export async function callThoughtAI(
  productContext: string,
  currentUserFlow: string,
  proposedFlow: string
): Promise<PipelineResponse> {
  const messages: PipelineMessage[] = [
    { role: 'system', content: UX_VALIDATION_PROMPT },
    {
      role: 'user',
      content: `PRODUCT CONTEXT:\n${productContext}\n\nCURRENT USER FLOW:\n${currentUserFlow}\n\nPROPOSED NEW FLOW:\n${proposedFlow}`,
    },
  ];
  return callPipelineModel('thought', messages);
}

export async function callArchAI(
  techStack: string,
  approvedFlow: string,
  dbSchema: string,
  apiRoutes: string,
  frontendCoupling: string
): Promise<PipelineResponse> {
  const messages: PipelineMessage[] = [
    { role: 'system', content: DEPENDENCY_MAP_PROMPT },
    {
      role: 'user',
      content: `TECHNICAL STACK:\n${techStack}\n\nAPPROVED USER FLOW:\n${approvedFlow}\n\nDATABASE SCHEMA:\n${dbSchema}\n\nAPI ROUTES:\n${apiRoutes}\n\nFRONTEND DATA COUPLING:\n${frontendCoupling}`,
    },
  ];
  return callPipelineModel('arch', messages);
}

export async function callLayoutAI(
  currentLayoutMap: string,
  desiredLayoutMap: string,
  componentCode: string
): Promise<PipelineResponse> {
  const messages: PipelineMessage[] = [
    { role: 'system', content: SPATIAL_LAYOUT_PROMPT },
    {
      role: 'user',
      content: `CURRENT VISUAL LAYOUT MAP:\n${currentLayoutMap}\n\nDESIRED VISUAL LAYOUT MAP:\n${desiredLayoutMap}\n\nFRONTEND CODE FILE TO REFACTOR:\n${componentCode}`,
    },
  ];
  return callPipelineModel('layout', messages);
}

export { PIPELINE_MODELS, PIPELINE_TEMPS, PIPELINE_MAX_TOKENS };
