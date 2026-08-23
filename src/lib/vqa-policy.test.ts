import {describe, expect, it} from 'vitest';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {
    applyVqaValidationPolicy,
    readVqaSystemInstruction,
    validationPolicyInputHash
} from './vqa-policy.ts';

describe('VQA validation policy', () => {
    it('loads the dedicated system instruction asset', () => {
        expect(readVqaSystemInstruction()).toContain('senior Visual QA engineer');
        expect(readVqaSystemInstruction()).toContain('Return only JSON');
    });

    it('changes automatic identity only when the authored prompt changes', () => {
        const root = mkdtempSync(resolve(tmpdir(), 'edugraph-vqa-policy-'));
        const promptPath = resolve(root, 'src', 'validation', 'vqa', 'system-instruction.md');
        const policyPath = resolve(root, 'src', 'lib', 'vqa-policy.ts');
        mkdirSync(resolve(root, 'src', 'validation', 'vqa'), {recursive: true});
        mkdirSync(resolve(root, 'src', 'lib'), {recursive: true});
        try {
            writeFileSync(promptPath, 'policy prompt');
            writeFileSync(policyPath, 'policy code');
            const initial = validationPolicyInputHash(root);

            writeFileSync(promptPath, 'changed policy prompt');
            expect(validationPolicyInputHash(root)).not.toBe(initial);

            const changedPrompt = validationPolicyInputHash(root);
            writeFileSync(policyPath, 'changed policy code');
            expect(validationPolicyInputHash(root)).toBe(changedPrompt);
        } finally {
            rmSync(root, {recursive: true, force: true});
        }
    });

    it('enforces general checks and label defendability', () => {
        const definitions = [{
            iri: 'http://edugraph.io/edu/Addition',
            label: 'Addition',
            definition: 'Addition.'
        }];
        const result = applyVqaValidationPolicy({
            pass: true,
            general_checks: {
                no_overlaps: true,
                no_placeholders: false,
                sane_padding: true,
                task_identifiable: true,
                mode_valid: true,
                text_minimal: true,
                math_coherent: true
            },
            label_checks: [{
                label: 'Addition',
                verdict: 'not_defendable',
                evidence: 'No addition is visible.'
            }],
            reasoning: ''
        }, definitions);

        expect(result.pass).toBe(false);
        expect(result.reasoning).toContain('no_placeholders');
    });
});
