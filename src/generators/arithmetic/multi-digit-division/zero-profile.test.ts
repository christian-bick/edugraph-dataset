import {Area, Scope} from 'edugraph-ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import * as random from '../../../lib/random.ts';
import {extractConfig} from '../../../lib/utils.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import {MultiDigitDivisionGenerator} from './generator.ts';
import {MultiDigitDivisionGeneratorSchema, spec} from './spec.ts';
import {partialQuotientHasZero, resolvePartialQuotientZero} from './zero-profile.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

afterEach(() => vi.restoreAllMocks());
const generator = new MultiDigitDivisionGenerator();
const plan = (labels: string[]) => planModelCompatibility({id: 'partial-zero', labels},
    {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema: generator.schema, spec},
    {viewId: 'partial-zero-test', generalLabels: [], schema: {}, spec: {viewId: 'partial-zero-test', generalLabels: []}});

describe('preselected partial-quotient zero mathematics', () => {
    it('distinguishes zero coefficients, chunks and exact remainders from positive whole magnitudes', () => {
        expect(partialQuotientHasZero({dividend: 11, divisor: 3, quotient: 3, remainder: 2})).toBe(false);
        expect(partialQuotientHasZero({dividend: 12, divisor: 3, quotient: 4, remainder: 0})).toBe(true);
        expect(partialQuotientHasZero({dividend: 110, divisor: 23, quotient: 4, remainder: 18})).toBe(true);
        expect(partialQuotientHasZero({dividend: 232, divisor: 20, quotient: 11, remainder: 12})).toBe(true);
        expect(partialQuotientHasZero({dividend: 221, divisor: 22, quotient: 10, remainder: 1})).toBe(true);
        expect(resolvePartialQuotientZero([])).toBeUndefined();
        expect(resolvePartialQuotientZero([Scope.NumbersWithZero])).toBe(true);
        expect(resolvePartialQuotientZero([Scope.NumbersWithoutZero])).toBe(false);
        expect(resolvePartialQuotientZero([Scope.SingleDigitDivisor])).toBe(false);
        expect(resolvePartialQuotientZero([Scope.NumbersWithZero, Scope.NumbersWithoutZero])).toBeUndefined();
    });

    it.each([
        [Scope.TwoDigitDividend, 2], [Scope.ThreeDigitDividend, 3], [Scope.FourDigitDividend, 4]
    ] as const)('makes both zero profiles matching-capable and executable for %s', (width, digits) => {
        for (const zero of [false, true]) {
            const label = zero ? Scope.NumbersWithZero : Scope.NumbersWithoutZero;
            const labels = [Area.DivisionPartialQuotients, Scope.TwoDigitDivisor, width, label];
            const result = plan(labels);
            expect(result.supported).toBe(true);
            if (!result.supported) continue;
            for (let seed = 0; seed < 64; seed++) {
                random.setSeed(seed);
                const direct = extractConfig(MultiDigitDivisionGeneratorSchema, labels);
                expect(direct.config).toMatchObject({divisorDigits: 2, dividendDigits: digits, requireZero: zero});
                expect(direct.resolvedLabels.filter(candidate => candidate === label)).toHaveLength(1);
                const directProblem = generator.generate(direct.config);
                expect(directProblem).not.toBeNull();
                expect(partialQuotientHasZero(directProblem!.data)).toBe(zero);
                const planned = resolvePlannedConfigurations({generatorSchema: generator.schema, viewSchema: {},
                    plan: result.plan, sampleKey: 'partial-zero#multi-digit-division#partial-zero-test#train#question#inst:0',
                    seed, attempt: 1});
                const problem = generator.generate(planned.generatorConfig);
                expect(problem).not.toBeNull();
                expect(partialQuotientHasZero(problem!.data)).toBe(zero);
            }
        }
    });

    it('requires a valid profile and preserves the legacy single-digit domain', () => {
        expect(() => generator.generate({divisorDigits: 2, dividendDigits: 2})).toThrow('requireZero');
        expect(() => generator.generate({divisorDigits: 1, dividendDigits: 2, requireZero: true, range: createCanonicalNumericRange(100)})).toThrow('feasible');
        expect(() => generator.generate({divisorDigits: 2, dividendDigits: 2, requireZero: 'zero', range: createCanonicalNumericRange(100)} as never)).toThrow('profile');
        expect(plan([Scope.SingleDigitDivisor, Scope.TwoDigitDividend, Scope.NumbersWithZero]).supported).toBe(false);
        expect(plan([Scope.SingleDigitDivisor, Scope.TwoDigitDividend]).supported).toBe(true);
        expect(plan([Scope.TwoDigitDivisor, Scope.TwoDigitDividend, Scope.NumbersWithZero, Scope.NumbersWithoutZero]).supported).toBe(false);
    });

    it('selects admitted mathematics even at the first weighted position without rejection retries', () => {
        const draw = vi.spyOn(random, 'random').mockReturnValue(0);
        const problem = generator.generate({divisorDigits: 2, dividendDigits: 2, requireZero: false, range: createCanonicalNumericRange(100)});
        expect(problem).not.toBeNull();
        expect(partialQuotientHasZero(problem!.data)).toBe(false);
        expect(draw).toHaveBeenCalledTimes(1);
    });
});
