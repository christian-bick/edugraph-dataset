import 'dotenv/config';
import { readdirSync, existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const DATASET_ROOT = resolve(PROJECT_ROOT, 'out', 'dataset', 'train');
const GENERATORS_ROOT = resolve(PROJECT_ROOT, 'src', 'generators');

if (!process.env.GEMINI_API_KEY) {
    console.error('Missing GEMINI_API_KEY in environment variables or .env file.');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
    model: "gemini-3.5-flash",
    generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
    }
});

function fileToGenerativePart(path: string, mimeType: string) {
    return {
        inlineData: {
            data: Buffer.from(readFileSync(path)).toString("base64"),
            mimeType
        },
    };
}

async function validateModule(moduleName: string) {
    const moduleDir = resolve(DATASET_ROOT, moduleName);
    if (!existsSync(moduleDir)) {
        console.warn(`Module output directory not found: ${moduleDir}. Skipping.`);
        return;
    }

    const checklistPath = resolve(GENERATORS_ROOT, moduleName, 'checklist.md');
    const globalChecklistPath = resolve(GENERATORS_ROOT, 'global-checklist.md');
    
    let checklist = readFileSync(globalChecklistPath, 'utf-8') + '\n\n';
    if (existsSync(checklistPath)) {
        checklist += readFileSync(checklistPath, 'utf-8');
    }

    const files = readdirSync(moduleDir).filter(f => f.includes('_mode-Q.png'));
    if (files.length === 0) {
        console.warn(`No Question images found for ${moduleName}. Skipping.`);
        return;
    }

    const randomQFile = files[Math.floor(Math.random() * files.length)];
    const randomAFile = randomQFile.replace('_mode-Q.png', '_mode-A.png');
    
    const qPath = resolve(moduleDir, randomQFile);
    const aPath = resolve(moduleDir, randomAFile);

    console.log(`\nEvaluating [${moduleName}] sample: ${randomQFile}...`);
    
    const qImage = fileToGenerativePart(qPath, "image/png");
    const aImage = fileToGenerativePart(aPath, "image/png");

    const prompt = `
You are a senior Visual QA Engineer. Evaluate these two math exercise images:
Image 1: Question Mode (_mode-Q)
Image 2: Answer Mode (_mode-A)
Module: "${moduleName}"

STRICT CHECKLIST:
${checklist}

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
        console.log(`Reasoning: ${parsed.reasoning}`);

    } catch (error) {
        console.error(`🚨 Error validating ${moduleName}:`, error);
    }
}

async function main() {
    const args = process.argv.slice(2);
    const targetModule = args.find(a => !a.startsWith('--'));

    console.log('--- Starting Automated Modular VQA ---');

    if (targetModule) {
        await validateModule(targetModule);
    } else {
        const allModules = readdirSync(DATASET_ROOT, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name);
            
        for (const moduleName of allModules) {
            await validateModule(moduleName);
        }
    }
    console.log('\nValidation Complete.');
}

main().catch(console.error);
