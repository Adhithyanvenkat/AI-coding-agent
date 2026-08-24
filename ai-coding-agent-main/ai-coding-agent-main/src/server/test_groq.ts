import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const match = envContent.match(/GROQ_API_KEY=["']?([^"'\r\n]+)/);
const key = match ? match[1] : '';

const groq = new Groq({ apiKey: key });

async function testModel(modelId: string) {
  try {
    console.log(`Testing model: ${modelId}...`);
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a code assistant. Return a JSON object with key "code".' },
        { role: 'user', content: 'Write hello world in javascript' }
      ],
      model: modelId,
      response_format: { type: 'json_object' }
    });
    console.log(`SUCCESS [${modelId}]:`, completion.choices[0]?.message?.content);
  } catch (err: any) {
    console.error(`FAILED [${modelId}]:`, err.message);
  }
}

async function main() {
  await testModel('qwen/qwen3.6-27b');
  await testModel('groq/compound');
  await testModel('openai/gpt-oss-20b');
}

main();
