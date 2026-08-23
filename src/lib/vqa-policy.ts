import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {SourceContentIndex} from './content-identity.ts';
import type {
    VqaCacheEntry,
    VqaLabelCheck,
    VqaLabelDefinition
} from './vqa-cache.ts';

const PROJECT_ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));

export const VQA_GENERAL_CHECK_NAMES = [
    'no_overlaps',
    'no_placeholders',
    'sane_padding',
    'task_identifiable',
    'mode_valid',
    'text_minimal',
    'math_coherent'
] as const;

export const VQA_RESPONSE_SCHEMA = {
    type: 'object',
    properties: {
        pass: {type: 'boolean'},
        general_checks: {
            type: 'object',
            properties: {
                no_overlaps: {type: 'boolean'},
                no_placeholders: {type: 'boolean'},
                sane_padding: {type: 'boolean'},
                task_identifiable: {type: 'boolean'},
                mode_valid: {type: 'boolean'},
                text_minimal: {type: 'boolean'},
                math_coherent: {type: 'boolean'}
            },
            required: [...VQA_GENERAL_CHECK_NAMES]
        },
        label_checks: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    label: {type: 'string'},
                    verdict: {
                        type: 'string',
                        enum: ['defendable', 'uncertain', 'not_defendable']
                    },
                    evidence: {type: 'string'}
                },
                required: ['label', 'verdict', 'evidence']
            }
        },
        reasoning: {type: 'string'}
    },
    required: ['pass', 'general_checks', 'label_checks', 'reasoning']
};

export function vqaSystemInstructionPath(projectRoot = PROJECT_ROOT): string {
    return resolve(projectRoot, 'src', 'validation', 'vqa', 'system-instruction.md');
}

export function readVqaSystemInstruction(projectRoot = PROJECT_ROOT): string {
    return readFileSync(vqaSystemInstructionPath(projectRoot), 'utf-8').trim();
}

export function validationPolicySourcePaths(projectRoot: string): string[] {
    return [vqaSystemInstructionPath(projectRoot)];
}

export function validationPolicyInputHash(
    projectRoot: string,
    sourceIndex = new SourceContentIndex(projectRoot)
): string {
    return sourceIndex.hash(validationPolicySourcePaths(projectRoot));
}

let currentPolicyHash: string | undefined;

export function currentValidationPolicyInputHash(): string {
    currentPolicyHash ??= validationPolicyInputHash(PROJECT_ROOT);
    return currentPolicyHash;
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
        throw new Error(
            `Invalid VQA response: expected label checks for [${expected.join(', ')}], `
            + `received [${actual.join(', ')}]`
        );
    }

    const validVerdicts = new Set(['defendable', 'uncertain', 'not_defendable']);
    for (const check of checks) {
        if (!validVerdicts.has(check.verdict) || typeof check.evidence !== 'string') {
            throw new Error(`Invalid VQA response for label "${check.label}"`);
        }
    }
    return checks;
}

/** Applies the semantic pass/fail policy to a schema-shaped Gemini response. */
export function applyVqaValidationPolicy(
    raw: Record<string, any>,
    labelDefinitions: readonly VqaLabelDefinition[]
): VqaCacheEntry['evaluation'] {
    const parsed = {...raw} as VqaCacheEntry['evaluation'];
    parsed.label_checks = validateLabelChecks(parsed.label_checks, labelDefinitions);
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

    if (parsed.pass && failedGeneralChecks.length === 0) parsed.reasoning = '';
    return parsed;
}
