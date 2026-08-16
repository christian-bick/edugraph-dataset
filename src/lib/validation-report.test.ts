import { describe, expect, it } from 'vitest';
import { validationFailed, validationReportPath } from './validation-report.ts';

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
