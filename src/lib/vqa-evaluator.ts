import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { findLeafModules } from './module-resolver.ts';
import {
    buildVqaValidationContext,
    computeImageSha256,
    type VqaLabelCheck,
    type VqaLabelDefinition,
    type VqaCacheEntry,
    VqaCacheManager
} from './vqa-cache.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const VIEWS_ROOT = resolve(PROJECT_ROOT, 'src', 'visuals', 'views');
const VQA_MODEL = 'gemini-3.5-flash';
const VQA_SYSTEM_INSTRUCTION = `You are a senior Visual QA engineer evaluating one rendered math-exercise image.
Use only visible evidence and the evaluation context supplied by the user. Apply every rule in the combined checklist.
Return only JSON matching the provided response schema.
If validation passes, set "reasoning" to an empty string. Provide non-empty reasoning only when validation fails.`;
const VQA_GENERAL_CHECK_NAMES = [
    'no_overlaps',
    'no_placeholders',
    'sane_padding',
    'task_identifiable',
    'mode_valid',
    'text_minimal',
    'math_coherent'
] as const;
const VQA_RESPONSE_SCHEMA = {
    type: 'object',
    properties: {
        pass: { type: 'boolean' },
        general_checks: {
            type: 'object',
            properties: {
                no_overlaps: { type: 'boolean' },
                no_placeholders: { type: 'boolean' },
                sane_padding: { type: 'boolean' },
                task_identifiable: { type: 'boolean' },
                mode_valid: { type: 'boolean' },
                text_minimal: { type: 'boolean' },
                math_coherent: { type: 'boolean' }
            },
            required: [...VQA_GENERAL_CHECK_NAMES]
        },
        label_checks: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    label: { type: 'string' },
                    verdict: {
                        type: 'string',
                        enum: ['defendable', 'uncertain', 'not_defendable']
                    },
                    evidence: { type: 'string' }
                },
                required: ['label', 'verdict', 'evidence']
            }
        },
        reasoning: { type: 'string' }
    },
    required: ['pass', 'general_checks', 'label_checks', 'reasoning']
};

export function resolveViewChecklistPaths(viewsRoot: string, viewId: string): string[] {
    const rootChecklist = resolve(viewsRoot, 'checklist.md');
    if (!existsSync(rootChecklist)) {
        throw new Error(`Missing global view checklist: ${rootChecklist}`);
    }

    const viewModule = findLeafModules(viewsRoot).find(module => module.id === viewId);
    if (!viewModule) {
        throw new Error(`Cannot resolve checklist for unknown view: ${viewId}`);
    }

    const leafChecklist = resolve(viewModule.absolutePath, 'checklist.md');
    if (!existsSync(leafChecklist)) {
        throw new Error(`Missing checklist for view "${viewId}": ${leafChecklist}`);
    }

    return [rootChecklist, leafChecklist];
}

export function getChecklistPaths(viewId: string): string[] {
    return resolveViewChecklistPaths(VIEWS_ROOT, viewId);
}

export function initVqaClient(apiKey?: string) {
    const key = apiKey !== undefined ? apiKey : process.env.GEMINI_API_KEY;
    if (!key) return null;

    return new GoogleGenAI({ apiKey: key });
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

export interface VqaPromptPartsInput {
    generatorId: string;
    viewId: string;
    modeName: string;
    labelDefinitions: readonly VqaLabelDefinition[];
    globalChecklist: string;
    viewChecklist: string;
}

export interface VqaPromptParts {
    systemInstruction: string;
    userPrompt: string;
}

export function buildVqaPromptParts(input: VqaPromptPartsInput): VqaPromptParts {
    const {
        generatorId,
        viewId,
        modeName,
        labelDefinitions,
        globalChecklist,
        viewChecklist
    } = input;
    const isSolution = modeName === 'solution';
    const userPrompt = `# Evaluation context

- Mode: ${isSolution ? 'Solution Mode (`_mode-S`)' : 'Question Mode (`_mode-Q`)'}
- Generator: \`${generatorId}\`
- View: \`${viewId}\`

## Ontology labels

${formatLabelDefinitions(labelDefinitions)}

# Combined Visual QA Checklist

The global and view-specific sections below are concatenated into one checklist. Apply every rule in both sections.

---

## Part 1 — Global checklist

<global-checklist>
${globalChecklist.trim()}
</global-checklist>

---

## Part 2 — View-specific checklist: \`${viewId}\`

<view-specific-checklist>
${viewChecklist.trim()}
</view-specific-checklist>`;

    return { systemInstruction: VQA_SYSTEM_INSTRUCTION, userPrompt };
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
    const checklistPaths = getChecklistPaths(viewId);

    const [globalChecklistPath, viewChecklistPath] = checklistPaths;
    const globalChecklist = readFileSync(globalChecklistPath, 'utf-8');
    const viewChecklist = readFileSync(viewChecklistPath, 'utf-8');

    const validationContext = buildVqaValidationContext(imageSha256, checklistPaths, labels);
    const valCacheKey = validationContext.validationCacheKey;

    // If cache manager is provided and already has this exact cache key, return cached entry
    if (cacheManager) {
        const cached = cacheManager.get(valCacheKey);
        if (cached) {
            return { entry: cached, isLiveEvaluated: false };
        }
    }

    const client = initVqaClient(apiKey);
    if (!client) {
        return null;
    }

    const promptParts = buildVqaPromptParts({
        generatorId,
        viewId,
        modeName,
        labelDefinitions: validationContext.labelDefinitions,
        globalChecklist,
        viewChecklist
    });

    const imagePart = { inlineData: { data: imageBuffer.toString('base64'), mimeType: 'image/png' } };
    const response = await client.models.generateContent({
        model: VQA_MODEL,
        contents: [promptParts.userPrompt, imagePart],
        config: {
            systemInstruction: promptParts.systemInstruction,
            responseMimeType: 'application/json',
            responseJsonSchema: VQA_RESPONSE_SCHEMA
        }
    });
    const responseText = response.text;
    if (!responseText) {
        throw new Error('Invalid VQA response: Gemini returned no text');
    }
    const parsed = JSON.parse(responseText);
    parsed.label_checks = validateLabelChecks(parsed.label_checks, validationContext.labelDefinitions);
    const failedGeneralChecks = VQA_GENERAL_CHECK_NAMES
        .filter(name => parsed.general_checks?.[name] !== true);
    if (failedGeneralChecks.length > 0) {
        parsed.pass = false;
        if (!parsed.reasoning) {
            parsed.reasoning = `General checks failed: ${failedGeneralChecks.join(', ')}`;
        }
    }

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

    if (parsed.pass && failedGeneralChecks.length === 0) {
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
