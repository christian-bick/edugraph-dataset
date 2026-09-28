import { describe, expect, it } from 'vitest';
import { validationFailed, validationReportPath, vqaReviewReport } from './validation-report.ts';
import type {VqaCacheEntry} from './vqa-cache.ts';

describe('validationReportPath', () => {
    it('preserves a timestamped full validation report outside the generated dataset', () => {
        expect(validationReportPath('/repo', 'dataset-ccss', {
            generatedAt: new Date('2026-08-16T12:34:56.789Z')
        }).replace(/\\/g, '/')).toMatch(
            /\/repo\/temp\/validation-reports\/dataset-ccss\/2026-08-16T12-34-56-789Z__full\.md$/
        );
    });

    it('preserves timestamped scoped reports without clobbering prior runs', () => {
        expect(validationReportPath('/repo', 'dataset-ccss', {
            generator: 'writing',
            view: 'numbers/numbers-write-standard',
            generatedAt: new Date('2026-08-16T12:34:56.789Z')
        }).replace(/\\/g, '/')).toMatch(
            /\/repo\/temp\/validation-reports\/dataset-ccss\/2026-08-16T12-34-56-789Z__generator=writing__view=numbers-numbers-write-standard\.md$/
        );
    });

    it('honors an explicit relative report path', () => {
        expect(validationReportPath('/repo', 'dataset-ccss', {
            reportPath: 'temp/custom-report.md'
        }).replace(/\\/g, '/')).toMatch(/\/repo\/temp\/custom-report\.md$/);
    });
});

describe('validationFailed', () => {
    it('fails normal validation for failed or uncached samples', () => {
        expect(validationFailed({ failed: 1, uncached: 0 }, false)).toBe(true);
        expect(validationFailed({ failed: 0, uncached: 1 }, false)).toBe(true);
        expect(validationFailed({ failed: 0, uncached: 0 }, false)).toBe(false);
    });

    it('allows an explicit report-only run to exit successfully', () => {
        expect(validationFailed({ failed: 1, uncached: 2 }, true)).toBe(false);
    });
});

describe('vqaReviewReport', () => {
    const sample = (levels: boolean[], uncertain = false): VqaCacheEntry => {
        const stages = levels.map((pass, i) => ({thinking_level: i === 0 ? 'LOW' : 'HIGH',
            evaluation: {pass, reasoning: '', label_checks: [{label: 'Base10',
                verdict: uncertain ? 'uncertain' : 'defendable', evidence: 'An example | with\nnewlines'}]}}));
        return {sample_key: 'sample', evaluation: stages.at(-1)!.evaluation, review: {stages}} as VqaCacheEntry;
    };
    it('distinguishes LOW, HIGH, pending and historical results and exposes uncertain evidence', () => {
        const {review: _review, ...legacy} = sample([true]);
        const report = vqaReviewReport([sample([true]), sample([false, true], true),
            sample([false, false]), sample([false]), legacy]);
        for (const category of ['LOW passed', 'HIGH passed after LOW failure', 'HIGH failed after LOW failure',
            'HIGH pending', 'Historical records without stage provenance', 'Final evaluations with uncertain labels']) {
            expect(report).toContain(`| ${category} | 1 |`);
        }
        expect(report).toContain('| sample | HIGH | Base10 | An example \\| with newlines |');
    });
    it('handles no uncertainty and historical uncertain results', () => {
        expect(vqaReviewReport([])).toContain('None.');
        const {review: _review, ...legacy} = sample([true], true);
        expect(vqaReviewReport([legacy])).toContain('| sample | Historical | Base10 |');
    });
});
