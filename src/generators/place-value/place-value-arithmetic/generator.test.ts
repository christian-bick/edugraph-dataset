import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {PlaceValueArithmeticProblem} from '../../../types/problems.ts';
import {PlaceValueArithmeticGenerator} from './generator.ts';
import {PlaceValueArithmeticGeneratorConfig} from './spec.ts';

const generalConfig = (overrides: Partial<PlaceValueArithmeticGeneratorConfig> = {}): PlaceValueArithmeticGeneratorConfig => ({
    operation: Area.Addition,
    requireRegrouping: false,
    requireSingleDigitSmallest: false,
    requireTwoDigitLargest: false,
    requireMultipleOf10: false,
    requireZero: false,
    range: {min: 0, max: 1000},
    ...overrides
});

const expectExactEvidence = (data: PlaceValueArithmeticProblem): void => {
    const [left, right] = data.operands;
    expect(data.answer).toBe(data.operation === 'addition'
        ? data.num1 + data.num2
        : data.num1 - data.num2);
    expect(data).not.toHaveProperty('equation');
    expect(data.regrouping).not.toHaveProperty('statement');
    expect(data.strategySteps.every(step =>
        !('equation' in step) && !('explanation' in step)
    )).toBe(true);
    expect(data.strategySteps).toHaveLength(3);

    if (data.regrouping.kind === 'compose-ten') {
        const onesTotal = left.ones + right.ones;
        const remainingOnes = onesTotal - 10;
        expect(data.operation).toBe('addition');
        expect(data.regrouping).toEqual({
            kind: 'compose-ten',
            onesBefore: onesTotal,
            onesAfter: remainingOnes,
            tensExchanged: 1
        });
        expect(data.strategySteps.map(step => [step.kind, step.place])).toEqual([
            ['combine-ones', 'ones'],
            ['compose-ten', 'ones'],
            ['result', 'result']
        ]);
        return;
    }

    if (data.regrouping.kind === 'decompose-ten') {
        const availableOnes = left.ones + 10;
        expect(data.operation).toBe('subtraction');
        expect(left.tens).toBeGreaterThan(0);
        expect(data.regrouping).toEqual({
            kind: 'decompose-ten',
            onesBefore: left.ones,
            onesAfter: availableOnes,
            tensExchanged: 1
        });
        expect(data.strategySteps.map(step => [step.kind, step.place])).toEqual([
            ['decompose-ten', 'tens'],
            ['subtract-ones', 'ones'],
            ['result', 'result']
        ]);
        return;
    }

    expect(data.regrouping.tensExchanged).toBe(0);
    if (data.operation === 'addition') {
        const onesTotal = left.ones + right.ones;
        expect(data.regrouping.onesBefore).toBe(onesTotal);
        expect(data.regrouping.onesAfter).toBe(data.result.ones);
        expect(data.strategySteps.map(step => step.kind)).toEqual([
            'combine-ones', 'combine-tens', 'result'
        ]);
    } else {
        expect(data.regrouping.onesBefore).toBe(left.ones);
        expect(data.regrouping.onesAfter).toBe(data.result.ones);
        expect(data.strategySteps.map(step => step.kind)).toEqual([
            'subtract-ones', 'subtract-tens', 'result'
        ]);
    }
};

describe('PlaceValueArithmeticGenerator', () => {
    const generator = new PlaceValueArithmeticGenerator();

    it('strictly validates every configuration field', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(() => generator.generate({operation: Area.Addition} as never)).toThrow();
        expect(() => generator.generate(generalConfig({operation: 'unsupported' as never}))).toThrow();
    });

    it.each([
        ['without regrouping', false],
        ['with explicit regrouping', true]
    ] as const)('generates two-digit plus single-digit %s within 100', (_name, requireRegrouping) => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const data = generator.generate(generalConfig({
                requireRegrouping,
                requireSingleDigitSmallest: true,
                requireTwoDigitLargest: true,
                range: {min: 0, max: 100}
            }))!.data;
            expect(data.operandProfile).toBe('two-digit-single-digit');
            expect(data.num1).toBeGreaterThanOrEqual(10);
            expect(data.num1).toBeLessThan(100);
            expect(data.num2).toBeGreaterThanOrEqual(1);
            expect(data.num2).toBeLessThan(10);
            expect(data.answer).toBeLessThan(100);
            expect(data.num1 % 10 + data.num2 % 10 >= 10).toBe(requireRegrouping);
            expect(data.regrouping.kind).toBe(requireRegrouping ? 'compose-ten' : 'none');
            expectExactEvidence(data);
        }
    });

    it('generates two-digit plus a multiple of 10 without regrouping', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const data = generator.generate(generalConfig({
                requireTwoDigitLargest: true,
                requireMultipleOf10: true,
                range: {min: 0, max: 100}
            }))!.data;
            expect(data.operandProfile).toBe('two-digit-multiple-of-ten');
            expect(data.num1).toBeGreaterThanOrEqual(10);
            expect(data.num1).toBeLessThan(100);
            expect(data.num2 % 10).toBe(0);
            expect(data.answer).toBeLessThan(100);
            expect(data.regrouping.kind).toBe('none');
            expectExactEvidence(data);
        }
    });

    it.each([
        ['positive', false],
        ['zero', true]
    ] as const)('subtracts multiples of 10 with a %s result', (_name, requireZero) => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const data = generator.generate(generalConfig({
                operation: Area.Subtraction,
                requireMultipleOf10: true,
                requireZero,
                range: {min: 0, max: 100}
            }))!.data;
            expect(data.operandProfile).toBe('multiples-of-ten');
            expect(data.num1 % 10).toBe(0);
            expect(data.num2 % 10).toBe(0);
            expect(data.answer % 10).toBe(0);
            expect(data.answer === 0).toBe(requireZero);
            expect(data.regrouping.kind).toBe('none');
            expectExactEvidence(data);
        }
    });

    it.each([Area.Addition, Area.Subtraction] as const)('preserves general Grade 2/3 regrouping for %s', operation => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const data = generator.generate(generalConfig({
                operation,
                requireRegrouping: true
            }))!.data;
            expect(data.operandProfile).toBe('general');
            expect(data.regrouping.kind).toBe(
                operation === Area.Addition ? 'compose-ten' : 'decompose-ten'
            );
            expect(data.answer).toBeGreaterThan(0);
            expect(data.answer).toBeLessThan(1000);
            if (operation === Area.Subtraction) {
                const [left, right] = data.operands;
                const adjustedLeftTens = left.tens - (left.ones < right.ones ? 1 : 0);
                expect(adjustedLeftTens).toBeGreaterThanOrEqual(right.tens);
                expect(left.hundreds).toBeGreaterThanOrEqual(right.hundreds);
            }
            expectExactEvidence(data);
        }
    });

    it('never hides a tens- or hundreds-place borrow behind ones regrouping', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(`no-hidden-borrow-${seed}`);
            const data = generator.generate(generalConfig({
                operation: Area.Subtraction,
                requireRegrouping: true
            }))!.data;
            const [left, right] = data.operands;
            const adjustedLeftTens = left.tens - 1;

            expect(data.regrouping.kind).toBe('decompose-ten');
            expect(adjustedLeftTens).toBeGreaterThanOrEqual(right.tens);
            expect(left.hundreds).toBeGreaterThanOrEqual(right.hundreds);
            expectExactEvidence(data);
        }
    });

    it('returns null for impossible or contradictory profiles', () => {
        expect(generator.generate(generalConfig({
            requireSingleDigitSmallest: true,
            requireTwoDigitLargest: true,
            requireMultipleOf10: true
        }))).toBeNull();
        expect(generator.generate(generalConfig({
            requireSingleDigitSmallest: true,
            requireTwoDigitLargest: true,
            range: {min: 0, max: 10}
        }))).toBeNull();
        expect(generator.generate(generalConfig({
            operation: Area.Addition,
            requireZero: true
        }))).toBeNull();
        expect(generator.generate(generalConfig({
            operation: Area.Subtraction,
            requireRegrouping: true,
            requireZero: true
        }))).toBeNull();
    });
});
