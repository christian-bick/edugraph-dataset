import 'dotenv/config';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { findLeafModules } from './module-resolver.ts';
import {
    buildVqaValidationContext,
    computeImageSha256,
    VqaLabelCheck,
    VqaLabelDefinition,
    VqaCacheEntry,
    VqaCacheManager
} from './vqa-cache.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const GENERATORS_ROOT = resolve(PROJECT_ROOT, 'src', 'generators');
const VIEWS_ROOT = resolve(PROJECT_ROOT, 'src', 'visuals', 'views');

export function resolveTreeChecklists(rootDir: string, moduleId: string): string[] {
    const paths: string[] = [];

    // 1. Root checklist.md
    const rootChecklist = resolve(rootDir, 'checklist.md');
    if (existsSync(rootChecklist)) paths.push(rootChecklist);

    // 2. Discover leaf modules
    const modules = findLeafModules(rootDir);
    const mod = modules.find(m => m.id === moduleId);

    // 3. Category checklist.md
    if (mod && mod.category) {
        const categoryChecklist = resolve(rootDir, mod.category, 'checklist.md');
        if (existsSync(categoryChecklist)) paths.push(categoryChecklist);
    }

    // 4. Leaf checklist.md
    const leafChecklist = mod
        ? resolve(mod.absolutePath, 'checklist.md')
        : resolve(rootDir, moduleId, 'checklist.md');
    if (existsSync(leafChecklist)) paths.push(leafChecklist);

    return paths;
}

export function getChecklistPaths(moduleName: string, viewId: string): string[] {
    return [
        ...resolveTreeChecklists(GENERATORS_ROOT, moduleName),
        ...resolveTreeChecklists(VIEWS_ROOT, viewId)
    ];
}

export function initVqaModel(apiKey?: string) {
    const key = apiKey !== undefined ? apiKey : process.env.GEMINI_API_KEY;
    if (!key) return null;

    const genAI = new GoogleGenerativeAI(key);
    return genAI.getGenerativeModel({
        model: 'gemini-3.5-flash',
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    pass: { type: SchemaType.BOOLEAN },
                    general_checks: {
                        type: SchemaType.OBJECT,
                        properties: {
                            no_overlaps: { type: SchemaType.BOOLEAN },
                            no_placeholders: { type: SchemaType.BOOLEAN },
                            sane_padding: { type: SchemaType.BOOLEAN }
                        },
                        required: ['no_overlaps', 'no_placeholders', 'sane_padding']
                    },
                    coloring_pass: { type: SchemaType.BOOLEAN },
                    layout_pass: { type: SchemaType.BOOLEAN },
                    label_checks: {
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                label: { type: SchemaType.STRING },
                                verdict: {
                                    type: SchemaType.STRING,
                                    format: 'enum',
                                    enum: ['defendable', 'uncertain', 'not_defendable']
                                },
                                evidence: { type: SchemaType.STRING }
                            },
                            required: ['label', 'verdict', 'evidence']
                        }
                    },
                    reasoning: { type: SchemaType.STRING }
                },
                required: ['pass', 'general_checks', 'label_checks', 'reasoning']
            }
        }
    });
}

export interface EvaluateSampleVqaInput {
    imagePath: string;
    sampleKey: string;
    targetId: string;
    generatorId: string;
    viewId: string;
    modeName: string;
    instanceIdx: number;
    attempt: number;
    seed: number;
    fileName: string;
    labels: readonly string[];
    apiKey?: string;
    cacheManager?: VqaCacheManager;
}

export interface EvaluateSampleVqaResult {
    entry: VqaCacheEntry;
    isLiveEvaluated: boolean;
}

function formatLabelDefinitions(labelDefinitions: readonly VqaLabelDefinition[]): string {
    return labelDefinitions
        .map(({ label, definition: labelDefinition }) => `- ${label}: ${labelDefinition}`)
        .join('\n');
}

function validateLabelChecks(
    rawChecks: unknown,
    labelDefinitions: readonly VqaLabelDefinition[]
): VqaLabelCheck[] {
    if (!Array.isArray(rawChecks)) {
        throw new Error('Invalid VQA response: label_checks must be an array');
    }

    const expected = labelDefinitions.map(item => item.label).sort();
    const checks = rawChecks as VqaLabelCheck[];
    const actual = checks.map(item => item?.label).sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Invalid VQA response: expected label checks for [${expected.join(', ')}], received [${actual.join(', ')}]`);
    }

    const validVerdicts = new Set(['defendable', 'uncertain', 'not_defendable']);
    for (const check of checks) {
        if (!validVerdicts.has(check.verdict) || typeof check.evidence !== 'string') {
            throw new Error(`Invalid VQA response for label "${check.label}"`);
        }
    }
    return checks;
}

export async function evaluateSampleVqa(input: EvaluateSampleVqaInput): Promise<EvaluateSampleVqaResult | null> {
    const {
        imagePath,
        sampleKey,
        targetId,
        generatorId,
        viewId,
        modeName,
        instanceIdx,
        attempt,
        seed,
        fileName,
        labels,
        apiKey,
        cacheManager
    } = input;

    if (!existsSync(imagePath)) return null;

    const imageBuffer = readFileSync(imagePath);
    const imageSha256 = computeImageSha256(imageBuffer);
    const checklistPaths = getChecklistPaths(generatorId, viewId);

    let checklistText = '';
    for (const p of checklistPaths) {
        checklistText += readFileSync(p, 'utf-8') + '\n\n';
    }

    const validationContext = buildVqaValidationContext(imageSha256, checklistPaths, labels);
    const valCacheKey = validationContext.validationCacheKey;

    // If cache manager is provided and already has this exact cache key, return cached entry
    if (cacheManager) {
        const cached = cacheManager.get(valCacheKey);
        if (cached) {
            return { entry: cached, isLiveEvaluated: false };
        }
    }

    const model = initVqaModel(apiKey);
    if (!model) {
        return null;
    }

    const isSolution = modeName === 'solution';
    const prompt = `
You are a senior Visual QA Engineer. Evaluate this math exercise image:
Mode: "${isSolution ? 'Solution Mode (_mode-S)' : 'Question Mode (_mode-Q)'}"
Module: "${generatorId}"
View ID: "${viewId}"

CHECKLIST:
${checklistText}

ONTOLOGY LABELS:
${formatLabelDefinitions(validationContext.labelDefinitions)}

For every ontology label, judge whether it is reasonably supported by visual inspection and straightforward mathematical reasoning from the image. A label does not need to be uniquely determined. Use "uncertain" when the evidence is indirect, ambiguous, or you are unsure; uncertainty passes validation. Use "not_defendable" only when the image clearly contradicts the definition or clearly lacks a feature required by it.

IMPORTANT: If pass is true, all general checks pass, and no label is "not_defendable", set "reasoning" to "" (empty string). Only provide a non-empty reasoning string when validation fails.

Respond only in the provided JSON schema.
`;

    const imagePart = { inlineData: { data: imageBuffer.toString('base64'), mimeType: 'image/png' } };
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);
    parsed.label_checks = validateLabelChecks(parsed.label_checks, validationContext.labelDefinitions);
    if (parsed.label_checks.some((check: VqaLabelCheck) => check.verdict === 'not_defendable')) {
        parsed.pass = false;
        if (!parsed.reasoning) {
            const rejected = parsed.label_checks
                .filter((check: VqaLabelCheck) => check.verdict === 'not_defendable')
                .map((check: VqaLabelCheck) => `${check.label}: ${check.evidence}`)
                .join('; ');
            parsed.reasoning = `Labels not defendable: ${rejected}`;
        }
    }

    if (parsed.pass && parsed.general_checks?.no_overlaps && parsed.general_checks?.no_placeholders && parsed.general_checks?.sane_padding) {
        parsed.reasoning = '';
    }

    const entry: VqaCacheEntry = {
        validation_cache_key: valCacheKey,
        sample_key: sampleKey,
        target_id: targetId,
        generator: generatorId,
        view: viewId,
        mode: modeName,
        instance: instanceIdx,
        attempt,
        seed,
        file_name: fileName,
        image_sha256: imageSha256,
        checklist_hash: validationContext.checklistHash,
        label_context_hash: validationContext.labelContextHash,
        validation_context_hash: validationContext.validationContextHash,
        validated_at: new Date().toISOString(),
        evaluation: parsed
    };

    if (cacheManager) {
        cacheManager.set(entry);
    }

    return { entry, isLiveEvaluated: true };
}
