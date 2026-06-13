import 'dotenv/config';
import { readdirSync, existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

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

// Schema for constrained output
const responseSchema = {
    type: SchemaType.OBJECT,
    properties: {
        pass: { type: SchemaType.BOOLEAN },
        general_checks: {
            type: SchemaType.OBJECT,
            properties: {
                no_overlaps: { type: SchemaType.BOOLEAN },
                no_placeholders: { type: SchemaType.BOOLEAN },
                sane_padding: { type: SchemaType.BOOLEAN },
            },
            required: ["no_overlaps", "no_placeholders", "sane_padding"]
        },
        coloring_pass: { type: SchemaType.BOOLEAN },
        layout_pass: { type: SchemaType.BOOLEAN },
        reasoning: { type: SchemaType.STRING },
    },
    required: ["pass", "general_checks", "coloring_pass", "layout_pass", "reasoning"]
};

const model = genAI.getGenerativeModel({ 
    model: "gemini-3.5-flash", // Using the 2026-era high-performance model requested by the user
    generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
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
You are a senior Visual QA Engineer. Evaluate these two math exercise images:
Image 1: Question Mode (_mode-Q)
Image 2: Answer Mode (_mode-A)
Module Type: "${sample.module}"

STRICT CHECKLIST:
1. General UI Integrity:
   - NO overlapping components (e.g. text on top of borders, symbols colliding).
   - NO broken text placeholders (strictly search for: "NaN", "undefined", "null", "[object]").
   - Sane Panning/Padding: Comfortable whitespace around elements, nothing clipped at the edges.
2. Global Coloring:
   - Question Mode MUST NOT contain any green.
   - Answer Mode MUST contain forestgreen highlighting ONLY the specific solution element.
3. Operations (Boxes & Vertical): 
   - The task part must be empty in Q and green in A. 
   - Numbers and symbols must be centered in their respective boxes.
4. Measure Length:
   - Normal: Rectangle is SteelBlue. Box text empty in Q, green in A.
   - Reverse: Box text black. Rectangle hidden in Q, green in A.
5. Counting Inc/Dec:
   - Layout is horizontal. Indicator sits LEFT of the answer box.
   - Indicator is an up/down triangle with a bold white "1" clearly visible inside.
6. Numbers Order:
   - Layout is horizontal. Arrow reflects direction: ↗ (ascending) or ↘ (descending).
7. Numbers Write:
   - Order MUST BE: Ten-frame (left) -> Number Label (middle) -> Writing Boxes (right).
   - Ten-frame MUST be pre-filled with blue dots in BOTH modes.
8. Time Analog:
   - Normal: Hands black. Digital box empty in Q, green in A.
   - Reverse: Digital box text black. Clock hands hidden in Q, green in A.

Respond only in the provided JSON schema.
`;

        try {
            const result = await model.generateContent([prompt, qImage, aImage]);
            const responseText = result.response.text();
            
            const parsed = JSON.parse(responseText);
            const status = parsed.pass ? '✅ PASS' : '❌ FAIL';
            console.log(`${status}`);
            console.log(`- Overlaps: ${parsed.general_checks.no_overlaps ? 'None' : 'DETECTED'}`);
            console.log(`- Placeholders: ${parsed.general_checks.no_placeholders ? 'None' : 'DETECTED'}`);
            console.log(`- Padding: ${parsed.general_checks.sane_padding ? 'Good' : 'BAD'}`);
            console.log(`- Coloring: ${parsed.coloring_pass ? 'Correct' : 'INCORRECT'}`);
            console.log(`- Layout: ${parsed.layout_pass ? 'Correct' : 'INCORRECT'}`);
            console.log(`Reasoning: ${parsed.reasoning}\n`);

        } catch (error) {
            console.error(`🚨 Error calling Gemini API for ${sample.module}:`, error, '\n');
        }
    }
}

validateSamples().then(() => console.log('Validation complete.'));
