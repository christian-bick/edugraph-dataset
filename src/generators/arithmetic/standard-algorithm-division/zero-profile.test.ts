import {Area, Scope} from 'edugraph-ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import * as random from '../../../lib/random.ts';
import {extractConfig} from '../../../lib/utils.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import {buildStandardDivisionProblem, StandardAlgorithmDivisionGenerator} from './generator.ts';
import {StandardAlgorithmDivisionGeneratorSchema, spec} from './spec.ts';
import {standardDivisionHasZero} from './zero-profile.ts';

afterEach(() => vi.restoreAllMocks());
const generator = new StandardAlgorithmDivisionGenerator();
const plan = (labels: string[]) => planModelCompatibility({id: 'standard-zero', labels},
    {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema: generator.schema, spec},
    {viewId: 'standard-zero-test', generalLabels: [], schema: {}, spec: {viewId: 'standard-zero-test', generalLabels: []}});

describe('preselected standard-division zero mathematics', () => {
    it('checks required work while excluding the hidden initial remainder', () => {
        expect(standardDivisionHasZero(buildStandardDivisionProblem(22, 3))).toBe(false);
        expect(standardDivisionHasZero(buildStandardDivisionProblem(21, 2))).toBe(true);
        expect(standardDivisionHasZero(buildStandardDivisionProblem(37, 125))).toBe(true);
        expect(standardDivisionHasZero(buildStandardDivisionProblem(1005, 5))).toBe(true);
        expect(standardDivisionHasZero(buildStandardDivisionProblem(33, 2))).toBe(false);
    });

    it.each([[102, 7], [241, 20], [213, 11], [1234, 111]])(
        'does not treat zero digits in nonzero division quantities as numerical zero: %i / %i',
        (dividend, divisor) => {
            const data = buildStandardDivisionProblem(dividend, divisor);
            expect(data.quotient).toBeGreaterThan(0);
            expect(data.remainder).toBeGreaterThan(0);
            expect(data.steps.every(step => step.partialDividend > 0 && step.product > 0
                && step.remainder > 0)).toBe(true);
            expect(standardDivisionHasZero(data)).toBe(false);
        }
    );

    it('retains a required intermediate zero with positive operands, quotient and final remainder', () => {
        const data = buildStandardDivisionProblem(65, 3);
        expect([data.dividend, data.divisor, data.quotient, data.remainder]).toEqual([65, 3, 21, 2]);
        expect(data.steps.map(step => [step.partialDividend, step.product, step.remainder]))
            .toEqual([[6, 6, 0], [5, 3, 2]]);
        expect(standardDivisionHasZero(data)).toBe(true);
    });

    it('admits a zero-containing numeral directly into the numerical-zero-absence profile', () => {
        const draw = vi.spyOn(random, 'random')
            .mockReturnValueOnce(6.25 / 9)
            .mockReturnValueOnce(92.25 / 9990);
        const result = generator.generate({range: {min: 0, max: 10000}, divisorDigits: 1, requireZero: false});
        expect(result?.data).toEqual(buildStandardDivisionProblem(102, 7));
        expect(draw).toHaveBeenCalledTimes(2);
    });

    it('rejects a digit-only zero witness for the numerical-zero-presence profile', () => {
        const draw = vi.spyOn(random, 'random')
            .mockReturnValueOnce(6.25 / 9)
            .mockReturnValueOnce(0.9)
            .mockReturnValueOnce(92.25 / 9990)
            .mockReturnValueOnce(2.25 / 9)
            .mockReturnValueOnce(0.1)
            .mockReturnValueOnce(2.25 / 9990);
        const result = generator.generate({range: {min: 0, max: 10000}, divisorDigits: 1, requireZero: true});
        expect(result?.data).toEqual(buildStandardDivisionProblem(12, 3));
        expect(draw).toHaveBeenCalledTimes(6);
    });

    it.each([Scope.SingleDigitDivisor, Scope.TwoDigitDivisor, Scope.ThreeDigitDivisor])(
        'makes both profiles matching-capable and executable for %s', width => {
            for (const zero of [false, true]) {
                const label = zero ? Scope.NumbersWithZero : Scope.NumbersWithoutZero;
                const labels = [Area.DivisionStandardAlgorithm, Scope.NumbersSmaller10000, width, label];
                const result = plan(labels);
                expect(result.supported).toBe(true);
                if (!result.supported) continue;
                for (let seed = 0; seed < 64; seed++) {
                    random.setSeed(seed);
                    const direct = extractConfig(StandardAlgorithmDivisionGeneratorSchema, labels);
                    expect(direct.config.requireZero).toBe(zero);
                    expect(direct.resolvedLabels).toContain(label);
                    const directProblem = generator.generate(direct.config);
                    expect(directProblem).not.toBeNull();
                    expect(standardDivisionHasZero(directProblem!.data)).toBe(zero);
                    const planned = resolvePlannedConfigurations({generatorSchema: generator.schema, viewSchema: {},
                        plan: result.plan, sampleKey: 'standard-zero#standard-algorithm-division#standard-zero-test#train#question#inst:0',
                        seed, attempt: 1});
                    const problem = generator.generate(planned.generatorConfig);
                    expect(problem).not.toBeNull();
                    expect(standardDivisionHasZero(problem!.data)).toBe(zero);
                }
            }
        });

    it('requires a declared boolean before sampling', () => {
        const config = {range: {min: 0, max: 10000}, divisorDigits: 1 as const};
        expect(() => generator.generate(config)).toThrow('requireZero');
        expect(() => generator.generate({...config, requireZero: 'zero'} as never)).toThrow('profile');
        expect(plan([Scope.NumbersWithZero, Scope.NumbersWithoutZero]).supported).toBe(false);
    });

    it('terminates a zero-only random source for a zero-free request', () => {
        const draw = vi.spyOn(random, 'random').mockReturnValue(0);
        expect(generator.generate({range: {min: 0, max: 10000}, divisorDigits: 1, requireZero: false})).toBeNull();
        expect(draw).toHaveBeenCalledTimes(4096 * 2);
    });
});
