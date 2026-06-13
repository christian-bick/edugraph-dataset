import 'dotenv/config';
import { readdirSync, existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const DATASET_DIR = resolve(PROJECT_ROOT, 'out', 'ml-dataset', 'train');

if (!existsSync(DATASET_DIR)) {
    console.error(`Dataset directory not found: ${DATASET_DIR}`);
    process.exit(1);
}

if (!process.env.GEMINI_API_KEY) {
    console.error('Missing GEMINI_API_KEY in environment variables or .env file. Required for VQA validation.');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// We use 2.5-pro for complex visual reasoning and adherence to strict rules
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-pro",
    generationConfig: {
        responseMimeType: "application/json",
    }
});

// Group files by visual module
const files = readdirSync(DATASET_DIR).filter(f => f.endsWith('.png'));
const moduleMap = new Map<string, string[]>();

for (const file of files) {
    const parts = file.split('_');
    if (parts.length >= 2) {
        let rendererId = parts[1];
        if (!moduleMap.has(rendererId)) {
            moduleMap.set(rendererId, []);
        }
        moduleMap.get(rendererId)!.push(file);
    }
}

console.log('--- Random Sample Selection for Visual Validation ---');

const samples: { module: string, qPath: string, aPath: string, baseName: string }[] = [];

for (const [module, moduleFiles] of moduleMap.entries()) {
    const qFiles = moduleFiles.filter(f => f.includes('_mode-Q.png'));
    if (qFiles.length === 0) continue;
    
    const randomQFile = qFiles[Math.floor(Math.random() * qFiles.length)];
    const baseName = randomQFile.replace('_mode-Q.png', '');
    const expectedAFile = `${baseName}_mode-A.png`;
    
    if (moduleFiles.includes(expectedAFile)) {
        samples.push({
            module: module,
            baseName: baseName,
            qPath: resolve(DATASET_DIR, randomQFile),
            aPath: resolve(DATASET_DIR, expectedAFile)
        });
    }
}

console.log(`Selected ${samples.length} pairs for automated VQA review.\n`);

function fileToGenerativePart(path: string, mimeType: string) {
    return {
        inlineData: {
            data: Buffer.from(readFileSync(path)).toString("base64"),
            mimeType
        },
    };
}

async function validateSamples() {
    for (const sample of samples) {
        console.log(`Evaluating [${sample.module}] pair: ${sample.baseName}...`);
        
        const qImage = fileToGenerativePart(sample.qPath, "image/png");
        const aImage = fileToGenerativePart(sample.aPath, "image/png");

        const prompt = `
You are a strict visual QA engineer. I am providing you with two images:
Image 1 (Question View): The first image provided.
Image 2 (Answer View): The second image provided.

This is a module from a math exercise generator. The module type is: "${sample.module}".

Please evaluate the images strictly against the following checklist:
1. Global Coloring: Question image MUST NOT contain the color green (forestgreen). Answer image MUST contain forestgreen highlighting strictly the missing solution element.
2. If module is 'operations-boxes' or 'operations-vertical': The specific missing blank part must be empty in Q, and filled with green in A.
3. If module is 'measure-length': 
   - Normal mode: Rectangle is colored. Box text is empty in Q, green in A.
   - Reverse mode: Box text is black. Rectangle is hidden in Q, green in A.
4. If module is 'counting-inc-dec': Layout is horizontal. Indicator is to the left of the box, is an up/down triangle with a bold white '1'.
5. If module is 'numbers-order': Layout is horizontal. Connecting arrow explicitly reflects sorting direction (↗ or ↘).
6. If module is 'numbers-write': Order is exactly Ten-frame -> Number Label -> Writing Boxes. Ten-frame must be pre-filled with blue dots (not green).
7. If module is 'time-analog':
   - Normal mode: Hands are black. Digital box is empty in Q, green in A.
   - Reverse mode: Digital box text is black. Clock hands are hidden in Q, green in A.

Respond in pure JSON with this schema:
{
    "pass": boolean,
    "reasoning": "Detailed explanation of what passed or failed, referencing specific elements like color and layout.",
    "questionViewHasGreen": boolean,
    "answerViewHasGreen": boolean
}
`;

        try {
            const result = await model.generateContent([prompt, qImage, aImage]);
            const responseText = result.response.text();
            
            try {
                const parsed = JSON.parse(responseText);
                const status = parsed.pass ? '✅ PASS' : '❌ FAIL';
                console.log(`${status} - Q has Green: ${parsed.questionViewHasGreen}, A has Green: ${parsed.answerViewHasGreen}`);
                console.log(`Reasoning: ${parsed.reasoning}\n`);
            } catch (e) {
                console.log(`⚠️ Invalid JSON returned: ${responseText}\n`);
            }

        } catch (error) {
            console.error(`🚨 Error calling Gemini API for ${sample.module}:`, error, '\n');
        }
    }
}

validateSamples().then(() => console.log('Validation complete.'));
