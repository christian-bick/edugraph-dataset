import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {
    DecimalComparisonOperand,
    DecimalComparisonProblem,
    TenthsHundredthsGridModel
} from '../../../types/problems.ts';
import {DecimalComparisonGenerator} from './generator.ts';
import {DecimalComparisonGeneratorConfig} from './spec.ts';

const generator = new DecimalComparisonGenerator();

const configs = {
    greater: {
        comparisonKind: Area.NumericInequality,
        relation: Scope.Greater
    },
    equal: {
        comparisonKind: Area.NumericEquality,
        relation: Scope.Equal
    },
    less: {
        comparisonKind: Area.NumericInequality,
        relation: Scope.Less
    }
} as const satisfies Record<DecimalComparisonProblem['relation'], DecimalComparisonGeneratorConfig>;

const expectGrid = (model: TenthsHundredthsGridModel, shadedCount: number): void => {
    expect(model).toMatchObject({
        display: `${shadedCount}/100`,
        rows: 10,
        columns: 10,
        partCount: 100,
        shadedCount,
        groups: []
    });
    expect(model.cells).toHaveLength(100);
    model.cells.forEach((cell, index) => {
        expect(cell).toEqual({
            index,
            row: index % 10,
            column: Math.floor(index / 10),
            tenthGroupIndex: Math.floor(index / 10),
            xPercent: Math.floor(index / 10) * 10,
            yPercent: (index % 10) * 10,
            widthPercent: 10,
            heightPercent: 10,
            shaded: index < shadedCount,
            source: null
        });
    });
};

const expectOperand = (operand: DecimalComparisonOperand): void => {
    const normalized = operand.normalizedHundredths;
    const tenthsDigit = Math.floor(normalized / 10);
    const hundredthsDigit = normalized % 10;
    expect(normalized).toBeGreaterThan(0);
    expect(normalized).toBeLessThan(100);
    expect(operand.normalizedHundredthsNotation)
        .toBe(`0.${String(normalized).padStart(2, '0')}`);
    expect(operand.wholeDigit).toBe(0);
    expect(operand.tenthsDigit).toBe(tenthsDigit);
    expect(operand.placeValueRow).toEqual({
        ones: '0',
        tenths: String(tenthsDigit),
        hundredths: String(hundredthsDigit)
    });
    if (operand.precision === 'tenths') {
        expect(normalized % 10).toBe(0);
        expect(operand.hundredthsDigit).toBeNull();
        expect(operand.decimalNotation).toBe(`0.${tenthsDigit}`);
    } else {
        expect(operand.hundredthsDigit).toBe(hundredthsDigit);
        expect(operand.decimalNotation).toBe(operand.normalizedHundredthsNotation);
    }
    expectGrid(operand.model, normalized);
};

const expectExactProblem = (problem: DecimalComparisonProblem): void => {
    expect(problem.task).toBe('compare-decimals');
    expect(problem.sharedWhole).toBe(1);
    expect(problem.left.role).toBe('left');
    expect(problem.right.role).toBe('right');
    expectOperand(problem.left);
    expectOperand(problem.right);
    expect(new Set([problem.left.precision, problem.right.precision]))
        .toEqual(new Set(['tenths', 'hundredths']));

    const difference = problem.left.normalizedHundredths
        - problem.right.normalizedHundredths;
    const expectedRelation = difference > 0 ? 'greater' : difference < 0 ? 'less' : 'equal';
    const expectedSymbol = difference > 0 ? '>' : difference < 0 ? '<' : '=';
    const expectedPlace = difference === 0
        ? 'equal'
        : problem.left.tenthsDigit === problem.right.tenthsDigit
            ? 'hundredths'
            : 'tenths';
    expect(problem.relation).toBe(expectedRelation);
    expect(problem.symbol).toBe(expectedSymbol);
    expect(problem.firstDecidingPlace).toBe(expectedPlace);

    if (expectedPlace === 'equal') {
        expect(problem.left.decimalNotation).not.toBe(problem.right.decimalNotation);
        expect(problem.left.normalizedHundredths).toBe(problem.right.normalizedHundredths);
        expect(problem.left.model).toEqual(problem.right.model);
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
            comparisonKind: Area.NumericEquality
        })).toThrow('Equal requires NumericEquality');
        expect(() => generator.generate({
            ...configs.equal,
            comparisonKind: Area.NumericInequality
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
                observed.add(`${problem.left.decimalNotation}|${problem.right.decimalNotation}`);
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
