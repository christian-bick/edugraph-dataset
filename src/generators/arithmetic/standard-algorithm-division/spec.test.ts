import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {StandardAlgorithmDivisionGenerator} from './generator.ts';
import {spec} from './spec.ts';

const mathematicalLabels = [
    Area.DivisionStandardAlgorithm, Scope.IntegerNumbers, Scope.Base10,
    Scope.NumbersWithoutNegatives, Scope.MultipleDigitDividend
];

describe('standard-algorithm-division capability resolution', () => {
    it('owns the reviewed whole-number standard-division mathematics', () => {
        expect(spec.generalLabels).toEqual(mathematicalLabels);
    });

    it('resolves the real Grade 6 target with no magnitude or divisor-width label', () => {
        const problem = generateWithLabels(new StandardAlgorithmDivisionGenerator(), [
            ...mathematicalLabels, Scope.ArabicNumerals, Ability.ProcedureExecution
        ])!;
        expect(problem.data.kind).toBe('whole-number-standard-division');
        expect(problem.data.dividend).toBeGreaterThanOrEqual(10);
        expect(problem.data.dividend).toBeLessThan(100000);
        expect(problem.data.divisor).toBeGreaterThanOrEqual(1);
        expect(problem.data.divisor).toBeLessThan(1000);
    });

    it.each([
        [Scope.SingleDigitDivisor, 1], [Scope.TwoDigitDivisor, 2], [Scope.ThreeDigitDivisor, 3]
    ] as const)('resolves the exact mathematical divisor-width capability %s', (label, digits) => {
        const problem = generateWithLabels(new StandardAlgorithmDivisionGenerator(), [...mathematicalLabels, label])!;
        expect(String(problem.data.divisor)).toHaveLength(digits);
        expect(problem.labels).toContain(label);
    });

    it.each([[Scope.NumbersSmaller10000, 10000], [Scope.NumbersSmaller100000, 100000]] as const)(
        'resolves the true magnitude capability %s', (label, bound) => {
            const problem = generateWithLabels(new StandardAlgorithmDivisionGenerator(), [...mathematicalLabels, label])!;
            expect(problem.data.dividend).toBeLessThan(bound);
            expect(problem.data.divisor).toBeLessThan(bound);
            expect(problem.labels).toContain(label);
        }
    );

    it('keeps the canonical division independent of the requested learner action', () => {
        setSeed(481);
        const execution = generateWithLabels(new StandardAlgorithmDivisionGenerator(), [
            ...mathematicalLabels, Ability.ProcedureExecution
        ]);
        setSeed(481);
        expect(generateWithLabels(new StandardAlgorithmDivisionGenerator(), [
            ...mathematicalLabels, Ability.ProcedureUnderstanding
        ])).toEqual(execution);
    });
});
