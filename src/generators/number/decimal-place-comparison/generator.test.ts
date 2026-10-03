import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {
    DecimalPlaceComparisonOperand,
    DecimalPlaceComparisonPlace,
    DecimalPlaceComparisonProblem
} from '../../../types/problems.ts';
import {
    createDecimalPlaceComparison,
    DecimalPlaceComparisonGenerator
} from './generator.ts';
import type {DecimalPlaceComparisonGeneratorConfig} from './spec.ts';

const generator = new DecimalPlaceComparisonGenerator();
const PLACES: readonly DecimalPlaceComparisonPlace[] = [
    'hundreds', 'tens', 'ones', 'tenths', 'hundredths', 'thousandths'
];
const configs = {
    greater: {comparisonKind: 'inequality', relation: 'greater'},
    equal: {comparisonKind: 'equality', relation: 'equal'},
    less: {comparisonKind: 'inequality', relation: 'less'}
} as const satisfies Record<DecimalPlaceComparisonProblem['relation'],
    DecimalPlaceComparisonGeneratorConfig>;

const input = (
    wholePart: number,
    fractionalDigits: readonly [number, number, number],
    displayPrecision: 1 | 2 | 3
) => ({wholePart, fractionalDigits, displayPrecision});

const digitsOf = (operand: DecimalPlaceComparisonOperand): number[] => [
    ...operand.wholeDigits, ...operand.fractionalDigits
];

const expectOperand = (operand: DecimalPlaceComparisonOperand): void => {
    const [tenths, hundredths, thousandths] = operand.fractionalDigits;
    expect(operand.wholePart).toBeGreaterThanOrEqual(0);
    expect(operand.wholePart).toBeLessThanOrEqual(999);
    expect(operand.wholeDigits).toEqual([
        Math.floor(operand.wholePart / 100),
        Math.floor(operand.wholePart / 10) % 10,
        operand.wholePart % 10
    ]);
    expect(operand.fractionalDigits).toHaveLength(3);
    expect(operand.fractionalDigits.every(digit => Number.isInteger(digit)
        && digit >= 0 && digit <= 9)).toBe(true);
    expect(operand.fractionalDigits.slice(operand.displayPrecision)
        .every(digit => digit === 0)).toBe(true);
    expect(operand.displayNumeral).toBe(
        `${operand.wholePart}.${operand.fractionalDigits
            .slice(0, operand.displayPrecision).join('')}`
    );
    expect(operand.valueInThousandths).toBe(
        operand.wholePart * 1000 + tenths * 100 + hundredths * 10 + thousandths
    );
};

const expectExactProblem = (problem: DecimalPlaceComparisonProblem): void => {
    expect(problem.kind).toBe('decimal-place-comparison');
    expect(problem.base).toBe(10);
    expectOperand(problem.left);
    expectOperand(problem.right);
    expect(problem).not.toHaveProperty('prompt');
    expect(problem).not.toHaveProperty('unknown');
    const leftDigits = digitsOf(problem.left);
    const rightDigits = digitsOf(problem.right);
    const decidingIndex = leftDigits.findIndex((digit, index) => digit !== rightDigits[index]);
    const difference = problem.left.valueInThousandths - problem.right.valueInThousandths;

    if (difference === 0) {
        expect(decidingIndex).toBe(-1);
        expect(problem.relation).toBe('equal');
        expect(problem.witness).toEqual({kind: 'all-places-equal', equalPlaces: PLACES});
    } else {
        expect(decidingIndex).toBeGreaterThanOrEqual(0);
        expect(problem.relation).toBe(difference > 0 ? 'greater' : 'less');
        expect(problem.witness).toEqual({
            kind: 'first-difference',
            decidingPlace: PLACES[decidingIndex],
            higherEqualPlaces: PLACES.slice(0, decidingIndex),
            leftDigit: leftDigits[decidingIndex],
            rightDigit: rightDigits[decidingIndex]
        });
        expect(Math.sign(difference)).toBe(Math.sign(
            leftDigits[decidingIndex]! - rightDigits[decidingIndex]!
        ));
    }
};

describe('createDecimalPlaceComparison', () => {
    it('finds the thousandths difference in 3.407 < 3.408', () => {
        const problem = createDecimalPlaceComparison(
            input(3, [4, 0, 7], 3), input(3, [4, 0, 8], 3)
        );
        expect(problem).not.toBeNull();
        expectExactProblem(problem!);
        expect(problem).toMatchObject({
            relation: 'less',
            left: {displayNumeral: '3.407', valueInThousandths: 3407},
            right: {displayNumeral: '3.408', valueInThousandths: 3408},
            witness: {
                kind: 'first-difference',
                decidingPlace: 'thousandths',
                higherEqualPlaces: ['hundreds', 'tens', 'ones', 'tenths', 'hundredths'],
                leftDigit: 7, rightDigit: 8
            }
        });
    });

    it('keeps 2.3 and 2.300 equal with independent displayed precision', () => {
        const problem = createDecimalPlaceComparison(
            input(2, [3, 0, 0], 1), input(2, [3, 0, 0], 3)
        );
        expect(problem).not.toBeNull();
        expectExactProblem(problem!);
        expect(problem).toMatchObject({
            relation: 'equal',
            left: {displayNumeral: '2.3', valueInThousandths: 2300},
            right: {displayNumeral: '2.300', valueInThousandths: 2300},
            witness: {kind: 'all-places-equal', equalPlaces: PLACES}
        });
    });

    it('can decide at a whole place while lower fractional digits point the other way', () => {
        const problem = createDecimalPlaceComparison(
            input(103, [0, 0, 1], 3), input(102, [9, 9, 9], 3)
        );
        expect(problem).not.toBeNull();
        expectExactProblem(problem!);
        expect(problem).toMatchObject({
            relation: 'greater',
            witness: {kind: 'first-difference', decidingPlace: 'ones',
                higherEqualPlaces: ['hundreds', 'tens'], leftDigit: 3, rightDigit: 2}
        });
    });

    it('rejects unrepresentable digits, hidden precision, and invalid whole parts', () => {
        const valid = input(2, [3, 0, 0], 1);
        expect(createDecimalPlaceComparison(input(-1, [3, 0, 0], 1), valid)).toBeNull();
        expect(createDecimalPlaceComparison(input(1000, [3, 0, 0], 1), valid)).toBeNull();
        expect(createDecimalPlaceComparison(input(2, [10, 0, 0], 1), valid)).toBeNull();
        expect(createDecimalPlaceComparison(input(2, [3, 1, 0], 1), valid)).toBeNull();
        expect(createDecimalPlaceComparison(input(2, [3, 0, 1], 2), valid)).toBeNull();
        expect(createDecimalPlaceComparison(input(2, [3, 0, 0], 0 as never), valid)).toBeNull();
    });
});

describe('DecimalPlaceComparisonGenerator', () => {
    it('rejects missing, extra, and incompatible relation configuration', () => {
        expect(() => generator.generate({} as never)).toThrow('comparisonKind');
        expect(() => generator.generate({...configs.less, relation: 'invalid'} as never))
            .toThrow('Greater, Equal, or Less');
        expect(() => generator.generate({...configs.greater, comparisonKind: 'equality'}))
            .toThrow('Equal requires NumericEquality');
        expect(() => generator.generate({...configs.equal, comparisonKind: 'inequality'}))
            .toThrow('Equal requires NumericEquality');
        expect(() => generator.generate({...configs.equal, extra: true} as never))
            .toThrow('unexpected field');
    });

    it.each(Object.entries(configs))('samples exact %s cases with nonzero whole parts', (
        relation, config
    ) => {
        const decidingPlaces = new Set<string>();
        const precisionPairs = new Set<string>();
        for (let seed = 0; seed < 300; seed++) {
            setSeed(`decimal-place-comparison-${relation}-${seed}`);
            const problem = generator.generate(config)?.data;
            expect(problem).toBeDefined();
            expectExactProblem(problem!);
            expect(problem!.relation).toBe(relation);
            expect(problem!.left.wholePart).toBeGreaterThan(0);
            expect(problem!.right.wholePart).toBeGreaterThan(0);
            expect(Math.max(problem!.left.displayPrecision,
                problem!.right.displayPrecision)).toBe(3);
            precisionPairs.add(`${problem!.left.displayPrecision}-${problem!.right.displayPrecision}`);
            if (problem!.witness.kind === 'first-difference') {
                decidingPlaces.add(problem!.witness.decidingPlace);
                expect(problem!.left.fractionalDigits[2] !== 0
                    || problem!.right.fractionalDigits[2] !== 0).toBe(true);
            } else {
                expect(problem!.left.displayNumeral).not.toBe(problem!.right.displayNumeral);
                expect(problem!.left.fractionalDigits.some(digit => digit !== 0)).toBe(true);
            }
        }
        if (relation === 'equal') {
            expect(decidingPlaces.size).toBe(0);
            expect(precisionPairs).toEqual(new Set(['1-3', '3-1', '2-3', '3-2']));
        } else {
            expect(decidingPlaces).toEqual(new Set(PLACES));
            expect([...precisionPairs].some(pair => pair !== '3-3')).toBe(true);
        }
    });

    it('replays the same instance from the same seed', () => {
        setSeed('decimal-place-comparison-replay');
        const first = generator.generate(configs.less);
        setSeed('decimal-place-comparison-replay');
        expect(generator.generate(configs.less)).toEqual(first);
    });
});
