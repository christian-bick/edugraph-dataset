import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {
    FractionParts,
    ProperFractionEquivalenceProblem,
    TenthsHundredthsGridModel,
    TenthsToHundredthsProblem
} from '../../../types/problems.ts';
import {FractionEquivalenceGenerator} from './generator.ts';
import {FractionEquivalenceGeneratorConfig} from './spec.ts';

const denominators = [2, 3, 4, 6, 8] as const satisfies readonly FractionParts[];

const properConfig: FractionEquivalenceGeneratorConfig = {
    usesMultiplication: false,
    usesEqualShares: true,
    usesImproperFractions: false,
    usesIntegerNumbers: false
};

const wholeConfig: FractionEquivalenceGeneratorConfig = {
    usesMultiplication: false,
    usesEqualShares: false,
    usesImproperFractions: true,
    usesIntegerNumbers: true
};

const multiplicationConfig: FractionEquivalenceGeneratorConfig = {
    ...properConfig,
    usesMultiplication: true
};

const expectCoherentPair = (problem: ProperFractionEquivalenceProblem) => {
    expect(problem.task).toBe('relate-equivalent-fractions');
    expect(denominators).toContain(problem.first.denominator);
    expect(denominators).toContain(problem.second.denominator);
    expect(problem.first.numerator).toBeGreaterThan(0);
    expect(problem.first.numerator).toBeLessThan(problem.first.denominator);
    expect(problem.second.numerator).toBeGreaterThan(0);
    expect(problem.second.numerator).toBeLessThan(problem.second.denominator);
    expect(problem.scaleFactor).toBeGreaterThanOrEqual(2);
    expect(problem.scaleFactor).toBeLessThanOrEqual(4);
    expect(problem.second.numerator).toBe(problem.first.numerator * problem.scaleFactor);
    expect(problem.second.denominator).toBe(problem.first.denominator * problem.scaleFactor);
    expect(problem.second.denominator).toBeLessThanOrEqual(8);
    expect(problem.first.notation).toBe(`${problem.first.numerator}/${problem.first.denominator}`);
    expect(problem.second.notation).toBe(`${problem.second.numerator}/${problem.second.denominator}`);
    expect(problem.relation).toBe('equal');
    expect(problem.equation).toBe(`${problem.first.notation} = ${problem.second.notation}`);
};

const expectGrid = (model: TenthsHundredthsGridModel): void => {
    expect(model.cells).toHaveLength(model.partCount);
    expect(model.cells.filter(cell => cell.shaded)).toHaveLength(model.shadedCount);
    expect(model.groups).toEqual([]);
    model.cells.forEach((cell, index) => {
        expect(cell.index).toBe(index);
        expect(cell.widthPercent).toBe(10);
        expect(cell.shaded).toBe(index < model.shadedCount);
        expect(cell.source).toBeNull();
        if (model.partCount === 10) {
            expect(cell).toMatchObject({row: 0, column: index, tenthGroupIndex: index});
            expect(cell.xPercent).toBe(index * 10);
            expect(cell.yPercent).toBe(0);
            expect(cell.heightPercent).toBe(100);
        } else {
            expect(cell.column).toBe(Math.floor(index / 10));
            expect(cell.row).toBe(index % 10);
            expect(cell.tenthGroupIndex).toBe(cell.column);
            expect(cell.xPercent).toBe(cell.column * 10);
            expect(cell.yPercent).toBe(cell.row * 10);
            expect(cell.heightPercent).toBe(10);
        }
    });
};

const expectTenthsProblem = (problem: TenthsToHundredthsProblem): void => {
    const n = problem.tenths.numerator;
    expect(problem.task).toBe('tenths-to-hundredths');
    expect(n).toBeGreaterThanOrEqual(1);
    expect(n).toBeLessThanOrEqual(10);
    expect(problem.hundredths.numerator).toBe(n * 10);
    expect(problem.tenths).toEqual({numerator: n, denominator: 10, notation: `${n}/10`});
    expect(problem.hundredths).toEqual({
        numerator: n * 10,
        denominator: 100,
        notation: `${n * 10}/100`
    });
    expect(problem.numeratorScale).toEqual({
        from: n,
        factor: 10,
        result: n * 10,
        equation: `${n} × 10 = ${n * 10}`
    });
    expect(problem.denominatorScale).toEqual({
        from: 10,
        factor: 10,
        result: 100,
        equation: '10 × 10 = 100'
    });
    expect(problem.relation).toBe('equal');
    expect(problem.equation).toBe(`${n}/10 = ${n * 10}/100`);
    expectGrid(problem.models.tenths);
    expectGrid(problem.models.hundredths);
};

describe('FractionEquivalenceGenerator', () => {
    const generator = new FractionEquivalenceGenerator();

    it('strictly validates the mathematical mode', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(() => generator.generate({
            ...properConfig,
            usesEqualShares: false
        })).toThrow('Select EqualShares');
        expect(() => generator.generate({
            ...wholeConfig,
            usesIntegerNumbers: false
        })).toThrow('Select EqualShares');
        expect(() => generator.generate({
            ...wholeConfig,
            usesMultiplication: true
        })).toThrow('Select EqualShares');
    });

    it('generates an Ability-neutral proper-fraction equivalence relation', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const problem = generator.generate(properConfig).data;
            if (problem.task !== 'relate-equivalent-fractions') {
                throw new Error('Expected proper-fraction equivalence.');
            }
            expectCoherentPair(problem);
        }
    });

    it('expresses whole numbers as coherent improper fractions', () => {
        const wholeNumbers = new Set<number>();
        const denominatorsSeen = new Set<number>();

        for (let seed = 0; seed < 200; seed++) {
            setSeed(seed);
            const problem = generator.generate(wholeConfig).data;

            if (problem.task !== 'represent-whole-as-fraction') {
                throw new Error('Expected whole-number mode.');
            }
            expect([1, 2, 3]).toContain(problem.wholeNumber);
            expect(denominators).toContain(problem.fraction.denominator);
            expect(problem.fraction.numerator).toBe(
                problem.wholeNumber * problem.fraction.denominator
            );
            expect(problem.fraction.notation).toBe(
                `${problem.fraction.numerator}/${problem.fraction.denominator}`
            );
            expect(problem.relation).toBe('equal');
            expect(problem.equation).toBe(
                `${problem.wholeNumber} = ${problem.fraction.notation}`
            );
            wholeNumbers.add(problem.wholeNumber);
            denominatorsSeen.add(problem.fraction.denominator);
        }

        expect(wholeNumbers).toEqual(new Set([1, 2, 3]));
        expect(denominatorsSeen).toEqual(new Set(denominators));
    });

    it('uses seeded variation across generic and base-ten multiplication models', () => {
        const tasks = new Set<string>();
        const scaleFactors = new Set<number>();
        const tenthsNumerators = new Set<number>();
        for (let seed = 0; seed < 200; seed++) {
            setSeed(`multiplication-${seed}`);
            const problem = generator.generate(multiplicationConfig).data;
            tasks.add(problem.task);
            if (problem.task === 'tenths-to-hundredths') {
                expectTenthsProblem(problem);
                tenthsNumerators.add(problem.tenths.numerator);
            } else if (problem.task === 'relate-equivalent-fractions') {
                expectCoherentPair(problem);
                scaleFactors.add(problem.scaleFactor);
            } else {
                throw new Error('Expected a proper-fraction scaling model.');
            }
        }
        expect(tasks).toEqual(new Set([
            'relate-equivalent-fractions',
            'tenths-to-hundredths'
        ]));
        expect(scaleFactors).toEqual(new Set([2, 3, 4]));
        expect(tenthsNumerators).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
    });

    it('preserves deterministic mathematical draws for fixed seeds', () => {
        setSeed('legacy-0');
        expect(generator.generate(properConfig)).toEqual({
            data: {
                task: 'relate-equivalent-fractions',
                first: {numerator: 1, denominator: 4, notation: '1/4'},
                second: {numerator: 2, denominator: 8, notation: '2/8'},
                scaleFactor: 2,
                relation: 'equal',
                equation: '1/4 = 2/8'
            }
        });

        setSeed('legacy-2');
        expect(generator.generate(wholeConfig)).toEqual({
            data: {
                task: 'represent-whole-as-fraction',
                wholeNumber: 3,
                fraction: {numerator: 12, denominator: 4, notation: '12/4'},
                relation: 'equal',
                equation: '3 = 12/4'
            }
        });
    });

    it('covers every proper-fraction scale factor and varies the relation', () => {
        const scaleFactors = new Set<number>();
        const equations = new Set<string>();

        for (let seed = 0; seed < 200; seed++) {
            setSeed(seed);
            const problem = generator.generate(properConfig).data;
            if (problem.task !== 'relate-equivalent-fractions') {
                throw new Error('Expected proper-fraction mode.');
            }
            scaleFactors.add(problem.scaleFactor);
            equations.add(problem.equation);
        }

        expect(scaleFactors).toEqual(new Set([2, 3, 4]));
        expect(equations.size).toBeGreaterThan(3);
    });

    it('is deterministic for the same repository seed', () => {
        setSeed('fraction-equivalence');
        const first = generator.generate(multiplicationConfig);
        setSeed('fraction-equivalence');
        const second = generator.generate(multiplicationConfig);

        expect(second).toEqual(first);
    });
});
