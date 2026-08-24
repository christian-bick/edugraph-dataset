import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {DecimalComparisonOperand, DecimalComparisonProblem} from '../../../types/problems.ts';
import {DecimalComparisonGenerator} from './generator.ts';
import {DecimalComparisonGeneratorConfig} from './spec.ts';

const generator = new DecimalComparisonGenerator();

const configs = {
    greater: {
        comparisonKind: 'inequality',
        relation: 'greater'
    },
    equal: {
        comparisonKind: 'equality',
        relation: 'equal'
    },
    less: {
        comparisonKind: 'inequality',
        relation: 'less'
    }
} as const satisfies Record<DecimalComparisonProblem['relation'], DecimalComparisonGeneratorConfig>;

const decimalNotation = (operand: DecimalComparisonOperand): string =>
    operand.precision === 'tenths'
        ? `0.${operand.tenthsDigit}`
        : `0.${String(operand.normalizedHundredths).padStart(2, '0')}`;

const expectOperand = (operand: DecimalComparisonOperand): void => {
    const normalized = operand.normalizedHundredths;
    const tenthsDigit = Math.floor(normalized / 10);
    const hundredthsDigit = normalized % 10;
    expect(normalized).toBeGreaterThan(0);
    expect(normalized).toBeLessThan(100);
    expect(operand.wholeDigit).toBe(0);
    expect(operand.tenthsDigit).toBe(tenthsDigit);
    if (operand.precision === 'tenths') {
        expect(normalized % 10).toBe(0);
        expect(operand.hundredthsDigit).toBeNull();
    } else {
        expect(operand.hundredthsDigit).toBe(hundredthsDigit);
    }
    expect(operand).not.toHaveProperty('model');
};

const expectExactProblem = (problem: DecimalComparisonProblem): void => {
    expect(problem.task).toBe('compare-decimals');
    expect(problem.sharedWhole).toBe(1);
    expect(problem).not.toHaveProperty('symbol');
    expect(problem.left).not.toHaveProperty('role');
    expect(problem.left).not.toHaveProperty('decimalNotation');
    expect(problem.left).not.toHaveProperty('normalizedHundredthsNotation');
    expect(problem.left).not.toHaveProperty('placeValueRow');
    expect(problem.right).not.toHaveProperty('role');
    expect(problem.right).not.toHaveProperty('decimalNotation');
    expect(problem.right).not.toHaveProperty('normalizedHundredthsNotation');
    expect(problem.right).not.toHaveProperty('placeValueRow');
    expectOperand(problem.left);
    expectOperand(problem.right);
    expect(new Set([problem.left.precision, problem.right.precision]))
        .toEqual(new Set(['tenths', 'hundredths']));

    const difference = problem.left.normalizedHundredths
        - problem.right.normalizedHundredths;
    const expectedRelation = difference > 0 ? 'greater' : difference < 0 ? 'less' : 'equal';
    const expectedPlace = difference === 0
        ? 'equal'
        : problem.left.tenthsDigit === problem.right.tenthsDigit
            ? 'hundredths'
            : 'tenths';
    expect(problem.relation).toBe(expectedRelation);
    expect(problem.firstDecidingPlace).toBe(expectedPlace);

    if (expectedPlace === 'equal') {
        expect(decimalNotation(problem.left)).not.toBe(decimalNotation(problem.right));
        expect(problem.left.normalizedHundredths).toBe(problem.right.normalizedHundredths);
    }
};

describe('DecimalComparisonGenerator', () => {
    it('validates the exact relation and comparison-area combination', () => {
        expect(() => generator.generate({} as never)).toThrow('comparisonKind');
        expect(() => generator.generate({
            ...configs.greater,
            relation: 'unsupported'
        } as never)).toThrow('Greater, Equal, or Less');
        expect(() => generator.generate({
            ...configs.greater,
            comparisonKind: 'equality'
        })).toThrow('Equal requires NumericEquality');
        expect(() => generator.generate({
            ...configs.equal,
            comparisonKind: 'inequality'
        })).toThrow('Equal requires NumericEquality');
        expect(() => generator.generate({
            ...configs.less,
            unexpected: true
        } as never)).toThrow('unexpected');
    });

    it.each(Object.entries(configs))('generates exact %s comparisons', (relation, config) => {
        const orientations = new Set<string>();
        const decidingPlaces = new Set<string>();
        for (let seed = 0; seed < 250; seed++) {
            setSeed(`decimal-comparison-${relation}-${seed}`);
            const problem = generator.generate(config).data;
            expectExactProblem(problem);
            expect(problem.relation).toBe(relation);
            orientations.add(`${problem.left.precision}-${problem.right.precision}`);
            decidingPlaces.add(problem.firstDecidingPlace);
            if (relation !== 'equal') {
                const hundredths = problem.left.precision === 'hundredths'
                    ? problem.left
                    : problem.right;
                expect(hundredths.normalizedHundredths % 10).not.toBe(0);
            }
        }
        expect(orientations).toEqual(new Set(['tenths-hundredths', 'hundredths-tenths']));
        expect(decidingPlaces).toEqual(relation === 'equal'
            ? new Set(['equal'])
            : new Set(['tenths', 'hundredths']));
    });

    it('covers leading-zero, same-tenths, near-one, and trailing-zero equality stress cases', () => {
        const observed = new Set<string>();
        for (const relation of ['greater', 'equal', 'less'] as const) {
            for (let seed = 0; seed < 5_000; seed++) {
                setSeed(`decimal-comparison-stress-${relation}-${seed}`);
                const problem = generator.generate(configs[relation]).data;
                observed.add(`${decimalNotation(problem.left)}|${decimalNotation(problem.right)}`);
            }
        }
        expect(observed).toContain('0.1|0.09');
        expect(observed).toContain('0.09|0.1');
        expect(observed).toContain('0.9|0.91');
        expect(observed).toContain('0.91|0.9');
        expect([...observed].some(pair => pair.includes('0.99'))).toBe(true);
        expect(observed).toContain('0.5|0.50');
        expect(observed).toContain('0.50|0.5');
    });

    it('is deterministic for the same repository seed', () => {
        setSeed('decimal-comparison-determinism');
        const first = generator.generate(configs.greater);
        setSeed('decimal-comparison-determinism');
        expect(generator.generate(configs.greater)).toEqual(first);
    });
});
