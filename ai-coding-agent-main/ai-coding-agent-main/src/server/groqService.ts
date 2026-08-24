import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

let genAIClient: GoogleGenerativeAI | null = null;
let groqClient: Groq | null = null;

// Candidate Groq models in order of preference (models with native JSON support first)
const GROQ_MODELS = [
  'groq/compound',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.6-27b'
];

function getApiKey(): { key: string; isGroq: boolean } {
  const key = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || '';
  const trimmed = key.trim();
  if (
    !trimmed ||
    trimmed === 'YOUR_GEMINI_API_KEY' ||
    trimmed === 'YOUR_GROQ_API_KEY'
  ) {
    throw new Error(
      "API Key is missing or empty. Please set a valid GROQ_API_KEY or GEMINI_API_KEY in '.env'."
    );
  }
  return { key: trimmed, isGroq: trimmed.startsWith('gsk_') };
}

function getGroqClient(key: string): Groq {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: key });
  }
  return groqClient;
}

function getGeminiClient(key: string): GoogleGenerativeAI {
  if (!genAIClient) {
    genAIClient = new GoogleGenerativeAI(key);
  }
  return genAIClient;
}

function safeParseJson(text: string): any {
  if (!text) return {};

  // 1. Strip reasoning/thinking blocks like <think>...</think>
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // 2. Look for explicit ```json ... ``` code fence blocks first
  const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonBlockMatch && jsonBlockMatch[1]) {
    const candidate = jsonBlockMatch[1].trim();
    try {
      return JSON.parse(candidate);
    } catch (e) {
      // Fallthrough
    }
  }

  // 3. Remove markdown formatting markers if present
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  // 4. Try parsing directly
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Continue
  }

  // 5. Find outermost JSON object braces
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const jsonCandidate = cleaned.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(jsonCandidate);
    } catch (e) {
      // Fallthrough
    }
  }

  // 6. Try finding all candidate JSON object blocks sorted by length descending
  const objectMatches = cleaned.match(/\{[\s\S]*?\}/g);
  if (objectMatches) {
    objectMatches.sort((a, b) => b.length - a.length);
    for (const match of objectMatches) {
      try {
        return JSON.parse(match);
      } catch (e) {
        // Continue
      }
    }
  }

  // 7. Last resort repair
  let repaired = cleaned;
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    repaired = cleaned.substring(firstBrace, lastBrace + 1);
  }
  try {
    const repairedJson = repaired
      .replace(/'/g, '"')
      .replace(/,\s*([\}\]])/g, '$1');
    return JSON.parse(repairedJson);
  } catch (e) {
    console.error('Failed to parse JSON from AI response:', text);
    throw new Error('Failed to parse structured JSON response from AI model.');
  }
}

async function callGroqWithFallback(
  groq: Groq,
  messages: any[],
  jsonMode: boolean = false
): Promise<string> {
  let lastError: any = null;
  // First attempt with jsonMode if requested, then without jsonMode
  const jsonModeAttempts = jsonMode ? [true, false] : [false];

  for (const model of GROQ_MODELS) {
    for (const tryJson of jsonModeAttempts) {
      try {
        const options: any = {
          messages,
          model,
        };
        if (tryJson) {
          options.response_format = { type: 'json_object' };
        }
        const completion = await groq.chat.completions.create(options);
        const content = completion.choices[0]?.message?.content;
        if (content) return content;
      } catch (err: any) {
        lastError = err;
        console.warn(`Groq model ${model} (jsonMode=${tryJson}) failed: ${err.message || err}. Trying next candidate...`);
      }
    }
  }
  throw lastError || new Error('All Groq models failed');
}

export const groqService = {
  /**
   * Generates a code snippet and explanation based on requirement and language.
   */
  generateCode: async (
    prompt: string,
    language: string
  ): Promise<{ code: string; explanation: string }> => {
    try {
      const { key, isGroq } = getApiKey();

      if (isGroq) {
        const groq = getGroqClient(key);
        const text = await callGroqWithFallback(
          groq,
          [
            {
              role: 'system',
              content:
                "You are an expert software engineer. Write high-quality, elegant, and idiomatic code according to the requested language and requirements. Return your response strictly as a JSON object with 'code' and 'explanation' fields. Example: {\"code\": \"...\", \"explanation\": \"...\"}",
            },
            {
              role: 'user',
              content: `Create a clean, production-ready implementation of: "${prompt}" in ${language}. Include proper comments and best practices. Return a valid JSON object with "code" and "explanation" keys.`,
            },
          ],
          true
        );
        return safeParseJson(text);
      } else {
        const genAI = getGeminiClient(key);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction:
            "You are an expert software engineer. Write high-quality, elegant, and idiomatic code according to the requested language and requirements. Return your response as a JSON object with 'code' and 'explanation' fields. Do not include markdown code blocks around the JSON.",
          generationConfig: { responseMimeType: 'application/json' },
        });

        const response = await model.generateContent(
          `Create a clean, production-ready implementation of: "${prompt}" in ${language}. Include proper comments and best practices.`
        );
        const text = response.response.text() || '{}';
        return safeParseJson(text);
      }
    } catch (err: any) {
      console.error('Error in generateCode:', err);
      throw new Error(`AI Code Generation failed: ${err.message || err}`);
    }
  },

  /**
   * Debugs a given block of code, identifying bugs, providing a fix, and suggesting improvements.
   */
  debugCode: async (
    code: string,
    language?: string
  ): Promise<{
    fixedCode: string;
    bugExplanation: string;
    improvements: string;
  }> => {
    try {
      const { key, isGroq } = getApiKey();

      if (isGroq) {
        const groq = getGroqClient(key);
        const text = await callGroqWithFallback(
          groq,
          [
            {
              role: 'system',
              content:
                "You are an elite code debugger. Analyze the provided code for runtime bugs, syntax errors, security vulnerabilities, or logical flaws. Return a JSON object containing 'fixedCode', 'bugExplanation', and 'improvements' as fields. Ensure you fix all discovered bugs in fixedCode.",
            },
            {
              role: 'user',
              content: `Please debug the following ${
                language || 'programming language'
              } code:\n\n\`\`\`\n${code}\n\`\`\`\nReturn a valid JSON object with "fixedCode", "bugExplanation", and "improvements".`,
            },
          ],
          true
        );
        return safeParseJson(text);
      } else {
        const genAI = getGeminiClient(key);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction:
            "You are an elite code debugger. Analyze the provided code for runtime bugs, syntax errors, security vulnerabilities, or logical flaws. Return a JSON object containing 'fixedCode', 'bugExplanation', and 'improvements' as fields. Ensure you fix all discovered bugs in the fixedCode.",
          generationConfig: { responseMimeType: 'application/json' },
        });

        const response = await model.generateContent(
          `Please debug the following ${
            language || 'programming language'
          } code:\n\n\`\`\`\n${code}\n\`\`\``
        );
        const text = response.response.text() || '{}';
        return safeParseJson(text);
      }
    } catch (err: any) {
      console.error('Error in debugCode:', err);
      throw new Error(`AI Debugger failed: ${err.message || err}`);
    }
  },

  /**
   * Analyzes a code snippet for complexity, quality, and metrics (visualization).
   */
  analyzeCode: async (
    code: string,
    language?: string
  ): Promise<{
    timeComplexity: string;
    spaceComplexity: string;
    codeQuality: string;
    suggestions: string[];
    complexityMetrics: { metric: string; value: number }[];
  }> => {
    try {
      const { key, isGroq } = getApiKey();
      const promptText = `Analyze this ${
        language || 'programming language'
      } code snippet:\n\n\`\`\`\n${code}\n\`\`\`\nReturn a valid JSON object with timeComplexity, spaceComplexity, codeQuality, suggestions, and complexityMetrics keys.`;

      if (isGroq) {
        const groq = getGroqClient(key);
        const text = await callGroqWithFallback(
          groq,
          [
            {
              role: 'system',
              content: `You are an expert static code analysis tool. Analyze the provided code snippet.
Calculate the Time Complexity and Space Complexity. Assess the overall code quality.
Generate 5 scores on a scale of 0 to 100 for the following metrics:
1. "Readability" (how clear and easy to read the code is)
2. "Efficiency" (how optimized it is regarding time/space complexity)
3. "Security" (absence of vulnerabilities or unsafe patterns)
4. "Maintainability" (how modular, clear, and extensible it is)
5. "Best Practices" (usage of proper naming, conventions, error handling)

Return the output as a structured JSON object with the following fields:
- timeComplexity (string, e.g. "O(N log N)")
- spaceComplexity (string, e.g. "O(1)")
- codeQuality (string summary phrase)
- suggestions (array of string suggestions)
- complexityMetrics (array of objects with 'metric' (string) and 'value' (number) fields for Readability, Efficiency, Security, Maintainability, and Best Practices).`,
            },
            { role: 'user', content: promptText },
          ],
          true
        );
        return safeParseJson(text);
      } else {
        const genAI = getGeminiClient(key);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: `You are an expert static code analysis tool. Analyze the provided code snippet.
Calculate the Time Complexity and Space Complexity. Assess the overall code quality.
Generate 5 scores on a scale of 0 to 100 for the following metrics:
1. "Readability" (how clear and easy to read the code is)
2. "Efficiency" (how optimized it is regarding time/space complexity)
3. "Security" (absence of vulnerabilities or unsafe patterns)
4. "Maintainability" (how modular, clear, and extensible it is)
5. "Best Practices" (usage of proper naming, conventions, error handling)

Return the output as a structured JSON object with the following fields:
- timeComplexity (string, e.g. "O(N log N)")
- spaceComplexity (string, e.g. "O(1)")
- codeQuality (string summary phrase)
- suggestions (array of string suggestions)
- complexityMetrics (array of objects with 'metric' (string) and 'value' (number) fields for Readability, Efficiency, Security, Maintainability, and Best Practices).`,
          generationConfig: { responseMimeType: 'application/json' },
        });

        const response = await model.generateContent(promptText);
        const text = response.response.text() || '{}';
        return safeParseJson(text);
      }
    } catch (err: any) {
      console.error('Error in analyzeCode:', err);
      throw new Error(`AI Code Analyzer failed: ${err.message || err}`);
    }
  },

  /**
   * Generates a complete scaffolding/project folder structure and downloadable ZIP details.
   */
  generateProject: async (
    prompt: string,
    framework: 'react' | 'express' | 'fullstack'
  ): Promise<{
    title: string;
    readme: string;
    files: { path: string; content: string }[];
  }> => {
    try {
      const { key, isGroq } = getApiKey();
      const frameworkDesc =
        framework === 'react'
          ? 'Vite React application'
          : framework === 'express'
          ? 'Node.js Express backend'
          : 'Full-stack (Vite React + Express backend)';

      const promptMsg = `Scaffold a fully working template/project for: "${prompt}" using the "${frameworkDesc}" architecture. Return a valid JSON object with "title", "readme", and "files".`;

      if (isGroq) {
        const groq = getGroqClient(key);
        const text = await callGroqWithFallback(
          groq,
          [
            {
              role: 'system',
              content: `You are an elite scaffolding agent. Given a requirement and framework, construct a complete mini-project structure.
Generate a valid JSON output with:
- "title": A slug-safe title for the project
- "readme": An extensive, professional README.md explaining how to install and run the project
- "files": An array of objects, each containing:
  - "path": The file path (e.g., "package.json", "src/App.jsx", "server/index.js")
  - "content": The code content for this file

Ensure the package.json has scripts matching the framework. All code must be fully written, no dummy '// code here' placeholders. Make it authentic and high quality.`,
            },
            { role: 'user', content: promptMsg },
          ],
          true
        );
        return safeParseJson(text);
      } else {
        const genAI = getGeminiClient(key);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: `You are an elite scaffolding agent. Given a requirement and framework, construct a complete mini-project structure.
Generate a valid JSON output with:
- "title": A slug-safe title for the project
- "readme": An extensive, professional README.md explaining how to install and run the project
- "files": An array of objects, each containing:
  - "path": The file path (e.g., "package.json", "src/App.jsx", "server/index.js")
  - "content": The code content for this file

Ensure the package.json has scripts matching the framework. All code must be fully written, no dummy '// code here' placeholders. Make it authentic and high quality.`,
          generationConfig: { responseMimeType: 'application/json' },
        });

        const response = await model.generateContent(promptMsg);
        const text = response.response.text() || '{}';
        return safeParseJson(text);
      }
    } catch (err: any) {
      console.error('Error in generateProject:', err);
      throw new Error(`AI Project Scaffolder failed: ${err.message || err}`);
    }
  },

  /**
   * Conversational chatbot response for general developer support and coding inquiries.
   */
  chatbotResponse: async (
    messages: { role: 'user' | 'model'; content: string }[]
  ): Promise<{ reply: string }> => {
    try {
      const { key, isGroq } = getApiKey();

      if (isGroq) {
        const groq = getGroqClient(key);
        const groqMessages = [
          {
            role: 'system' as const,
            content:
              'You are a senior full-stack AI development companion. You write production-grade code, help troubleshoot runtime bugs, explain architectural concepts, and provide crisp, precise recommendations. Use Markdown to format code, headings, lists, and key terms beautifully.',
          },
          ...messages.map((m) => ({
            role: m.role === 'model' ? ('assistant' as const) : ('user' as const),
            content: m.content,
          })),
        ];

        const text = await callGroqWithFallback(groq, groqMessages, false);
        return { reply: text };
      } else {
        const genAI = getGeminiClient(key);
        const history = messages.slice(0, -1).map((msg) => ({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        }));

        const lastMessage = messages[messages.length - 1];
        const prompt = lastMessage ? lastMessage.content : '';

        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction:
            'You are a senior full-stack AI development companion. You write production-grade code, help troubleshoot runtime bugs, explain architectural concepts, and provide crisp, precise recommendations. Use Markdown to format code, headings, lists, and key terms beautifully.',
        });

        const chat = model.startChat({
          history: history,
        });

        const response = await chat.sendMessage(prompt);
        return { reply: response.response.text() || '' };
      }
    } catch (err: any) {
      console.error('Error in chatbotResponse:', err);
      throw new Error(`Chat agent failed: ${err.message || err}`);
    }
  },
};
