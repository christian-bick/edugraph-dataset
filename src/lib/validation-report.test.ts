import { describe, expect, it } from 'vitest';
import { validationFailed, validationReportPath } from './validation-report.ts';

describe('validationReportPath', () => {
    it('reserves the canonical report for unfiltered validation', () => {
        expect(validationReportPath('/repo', 'dataset-ccss', {}).replace(/\\/g, '/'))
            .toMatch(/\/repo\/out\/dataset-ccss\/validation-report\.md$/);
    });

    it('uses deterministic scoped report names', () => {
        expect(validationReportPath('/repo', 'dataset-ccss', {
            generator: 'writing',
            view: 'numbers/numbers-write-standard'
        }).replace(/\\/g, '/')).toMatch(
            /\/repo\/out\/dataset-ccss\/validation-reports\/generator=writing__view=numbers-numbers-write-standard\.md$/
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
