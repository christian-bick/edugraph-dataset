import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {
    FractionParts,
    FractionScalingProblem,
    ProperFractionEquivalenceProblem,
    TenthsHundredthsGridModel,
    TenthsToHundredthsProblem
} from '../../../types/problems.ts';
import {FractionEquivalenceGenerator} from './generator.ts';
import {FractionEquivalenceGeneratorConfig} from './spec.ts';

const denominators = [2, 3, 4, 6, 8] as const satisfies readonly FractionParts[];

const expectCoherentPair = (problem: ProperFractionEquivalenceProblem) => {
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
    expect(problem.explanation).toContain(problem.first.notation);
    expect(problem.explanation).toContain(problem.second.notation);
    expect(problem.explanation).toContain(String(problem.scaleFactor));
};

const properConfig = (
    taskAbilities: FractionEquivalenceGeneratorConfig['taskAbilities']
): FractionEquivalenceGeneratorConfig => ({
    taskAbilities,
    usesMultiplication: false,
    usesEqualShares: true,
    usesImproperFractions: false,
    usesIntegerNumbers: false
});

const wholeConfig: FractionEquivalenceGeneratorConfig = {
    taskAbilities: [Ability.Formalization],
    usesMultiplication: false,
    usesEqualShares: false,
    usesImproperFractions: true,
    usesIntegerNumbers: true
};

const scalingConfig: FractionEquivalenceGeneratorConfig = {
    ...properConfig([Ability.Formalization, Ability.ProcedureUnderstanding]),
    usesMultiplication: true
};

const tenthsConfig: FractionEquivalenceGeneratorConfig = {
    ...properConfig([Ability.Formalization]),
    usesMultiplication: true
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
    expect(problem.questionPrompt).toBe(
        'Complete the equivalent fraction by expressing the tenths as hundredths.'
    );
    expect(problem.questionEquation).toBe(`${n}/10 = ?/100`);
    expect(problem.solutionEquation).toBe(`${n}/10 = (${n} × 10)/(10 × 10) = ${n * 10}/100`);
    expect(problem.answer).toBe(String(n * 10));
    expect(problem.answerStatement).toBe(`${n}/10 is equivalent to ${n * 10}/100.`);
    expectGrid(problem.models.tenths);
    expectGrid(problem.models.hundredths);
};

const expectScalingProblem = (problem: FractionScalingProblem) => {
    expectCoherentPair({
        ...problem,
        task: 'generate-equivalence',
        equation: `${problem.first.notation} = ${problem.second.notation}`
    });
    expect(problem.sharedWhole).toBe(1);
    expect(problem.numeratorScale).toEqual({
        from: problem.first.numerator,
        factor: problem.scaleFactor,
        result: problem.second.numerator,
        equation: `${problem.first.numerator} × ${problem.scaleFactor} = ${problem.second.numerator}`
    });
    expect(problem.denominatorScale).toEqual({
        from: problem.first.denominator,
        factor: problem.scaleFactor,
        result: problem.second.denominator,
        equation: `${problem.first.denominator} × ${problem.scaleFactor} = ${problem.second.denominator}`
    });
    expect(problem.questionEquation).toBe(
        `${problem.first.notation} = ?/${problem.second.denominator}`
    );
    expect(problem.scalingEquation).toBe(
        `${problem.first.notation} = (${problem.first.numerator} × ${problem.scaleFactor})/(${problem.first.denominator} × ${problem.scaleFactor}) = ${problem.second.notation}`
    );
    expect(problem.firstUnitPart).toBe(`1/${problem.first.denominator}`);
    expect(problem.secondUnitPart).toBe(`1/${problem.second.denominator}`);
    expect(problem.barModel).toEqual({
        first: {
            partCount: problem.first.denominator,
            shadedCount: problem.first.numerator
        },
        second: {
            partCount: problem.second.denominator,
            shadedCount: problem.second.numerator
        }
    });

    const {firstTicks, secondTicks, firstPoint, secondPoint, coLocatedXPercent}
        = problem.numberLineModel;
    expect(firstTicks.map(tick => tick.index)).toEqual(
        Array.from({length: problem.first.denominator + 1}, (_, index) => index)
    );
    expect(secondTicks.map(tick => tick.index)).toEqual(
        Array.from({length: problem.second.denominator + 1}, (_, index) => index)
    );
    for (const [ticks, denominator] of [
        [firstTicks, problem.first.denominator],
        [secondTicks, problem.second.denominator]
    ] as const) {
        for (const tick of ticks) {
            expect(tick.xPercent).toBeCloseTo(tick.index / denominator * 100, 10);
            expect(tick.label).toBe(tick.index === 0 ? '0' : tick.index === denominator ? '1' : '');
        }
    }
    expect(firstPoint).toEqual({
        tickIndex: problem.first.numerator,
        xPercent: coLocatedXPercent,
        label: problem.first.notation
    });
    expect(secondPoint).toEqual({
        tickIndex: problem.second.numerator,
        xPercent: coLocatedXPercent,
        label: problem.second.notation
    });
    expect(firstTicks[firstPoint.tickIndex].xPercent).toBeCloseTo(coLocatedXPercent, 10);
    expect(secondTicks[secondPoint.tickIndex].xPercent).toBeCloseTo(coLocatedXPercent, 10);
    expect(problem.relation).toBe('equal');
    expect(problem.answer).toBe(String(problem.second.numerator));
    expect(problem.answerStatement).toBe(
        `${problem.first.notation} = ${problem.second.notation}.`
    );
    const sizePhrase = {2: 'one-half', 3: 'one-third', 4: 'one-fourth'}[problem.scaleFactor];
    expect(problem.explanation).toBe(
        `Multiplying the numerator and denominator of ${problem.first.notation} by ${problem.scaleFactor} makes ${problem.scaleFactor} times as many equal parts. Each new part is ${sizePhrase} as large, so ${problem.second.notation} shades the same amount as ${problem.first.notation}.`
    );
};

describe('FractionEquivalenceGenerator', () => {
    const generator = new FractionEquivalenceGenerator();

    it('strictly validates the exact task-ability modes', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(() => generator.generate(properConfig([]))).toThrow();
        expect(() => generator.generate(
            {
                ...properConfig([Ability.ConceptDerivation]),
                taskAbilities: Ability.ConceptDerivation
            } as unknown as FractionEquivalenceGeneratorConfig
        )).toThrow('must be an array');
        expect(() => generator.generate(properConfig([
            Ability.Formalization
        ]))).toThrow('Select EqualShares');
        expect(() => generator.generate(properConfig([
            Ability.ConceptDerivation,
            Ability.ProcedureUnderstanding
        ]))).toThrow('Select EqualShares');
        expect(() => generator.generate({
            ...wholeConfig,
            usesIntegerNumbers: false
        })).toThrow('Select EqualShares');
        expect(() => generator.generate({
            ...properConfig([Ability.ConceptDerivation]),
            usesMultiplication: true
        })).toThrow('Select EqualShares');
        expect(() => generator.generate({
            ...wholeConfig,
            usesMultiplication: true
        })).toThrow('Select EqualShares');
    });

    it('recognizes proper equivalent fractions', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const problem = generator.generate(properConfig([
                Ability.ConceptDerivation
            ])).data;

            expect(problem.task).toBe('recognize-equivalence');
            if (problem.task !== 'recognize-equivalence') throw new Error('Expected recognition mode.');
            expectCoherentPair(problem);
            expect(problem.answer).toBe('equivalent');
        }
    });

    it('generates and explains proper equivalent fractions', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const problem = generator.generate(properConfig([
                Ability.Formalization,
                Ability.ProcedureUnderstanding
            ])).data;

            expect(problem.task).toBe('generate-equivalence');
            if (problem.task !== 'generate-equivalence') throw new Error('Expected generation mode.');
            expectCoherentPair(problem);
            expect(problem.answer).toBe(problem.second.notation);
        }
    });

    it('expresses whole numbers as coherent improper fractions', () => {
        const wholeNumbers = new Set<number>();
        const denominatorsSeen = new Set<number>();

        for (let seed = 0; seed < 200; seed++) {
            setSeed(seed);
            const problem = generator.generate(wholeConfig).data;

            expect(problem.task).toBe('represent-whole-as-fraction');
            if (problem.task !== 'represent-whole-as-fraction') throw new Error('Expected whole-number mode.');
            expect([1, 2, 3]).toContain(problem.wholeNumber);
            expect(denominators).toContain(problem.fraction.denominator);
            expect(problem.fraction.numerator).toBe(problem.wholeNumber * problem.fraction.denominator);
            expect(problem.fraction.notation).toBe(`${problem.fraction.numerator}/${problem.fraction.denominator}`);
            expect(problem.relation).toBe('equal');
            expect(problem.equation).toBe(`${problem.wholeNumber} = ${problem.fraction.notation}`);
            expect(problem.explanation).toContain(problem.fraction.notation);
            expect(problem.explanation).toContain(String(problem.wholeNumber));
            expect(problem.answer).toBe(problem.fraction.notation);
            wholeNumbers.add(problem.wholeNumber);
            denominatorsSeen.add(problem.fraction.denominator);
        }

        expect(wholeNumbers).toEqual(new Set([1, 2, 3]));
        expect(denominatorsSeen).toEqual(new Set(denominators));
    });

    it('scales both fraction terms and supplies exact shared-whole visual models', () => {
        const scaleFactors = new Set<number>();

        for (let seed = 0; seed < 200; seed++) {
            setSeed(`grade4-scaling-${seed}`);
            const problem = generator.generate(scalingConfig).data;
            expect(problem.task).toBe('scale-equivalence');
            if (problem.task !== 'scale-equivalence') {
                throw new Error('Expected Grade 4 scaling mode.');
            }
            expectScalingProblem(problem);
            scaleFactors.add(problem.scaleFactor);
        }

        expect(scaleFactors).toEqual(new Set([2, 3, 4]));
    });

    it('expresses every nonzero tenth as equivalent hundredths with exact grids', () => {
        const seen = new Set<number>();
        for (let seed = 0; seed < 200; seed++) {
            setSeed(`tenths-${seed}`);
            const problem = generator.generate(tenthsConfig).data;
            expect(problem.task).toBe('tenths-to-hundredths');
            if (problem.task !== 'tenths-to-hundredths') throw new Error('Expected tenths mode.');
            expectTenthsProblem(problem);
            seen.add(problem.tenths.numerator);
        }
        expect(seen).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
    });

    it('preserves every legacy payload and random draw for fixed seeds', () => {
        setSeed('legacy-0');
        expect(generator.generate(properConfig([Ability.ConceptDerivation]))).toEqual({
            data: {
                task: 'recognize-equivalence',
                first: {numerator: 1, denominator: 4, notation: '1/4'},
                second: {numerator: 2, denominator: 8, notation: '2/8'},
                scaleFactor: 2,
                relation: 'equal',
                equation: '1/4 = 2/8',
                explanation: '1/4 is equivalent to 2/8 because its numerator and denominator are multiplied by 2.',
                answer: 'equivalent'
            }
        });

        setSeed('legacy-1');
        expect(generator.generate(properConfig([
            Ability.Formalization,
            Ability.ProcedureUnderstanding
        ]))).toEqual({
            data: {
                task: 'generate-equivalence',
                first: {numerator: 3, denominator: 4, notation: '3/4'},
                second: {numerator: 6, denominator: 8, notation: '6/8'},
                scaleFactor: 2,
                relation: 'equal',
                equation: '3/4 = 6/8',
                explanation: '3/4 is equivalent to 6/8 because its numerator and denominator are multiplied by 2.',
                answer: '6/8'
            }
        });

        setSeed('legacy-2');
        expect(generator.generate(wholeConfig)).toEqual({
            data: {
                task: 'represent-whole-as-fraction',
                wholeNumber: 3,
                fraction: {numerator: 12, denominator: 4, notation: '12/4'},
                relation: 'equal',
                equation: '3 = 12/4',
                explanation: '12/4 contains 3 groups of 4/4, so it equals 3.',
                answer: '12/4'
            }
        });
    });

    it('covers every supported scale factor and varies the generated pair', () => {
        const scaleFactors = new Set<number>();
        const equations = new Set<string>();

        for (let seed = 0; seed < 200; seed++) {
            setSeed(seed);
            const problem = generator.generate(properConfig([
                Ability.ConceptDerivation
            ])).data;
            if (problem.task !== 'recognize-equivalence'
                && problem.task !== 'generate-equivalence') {
                throw new Error('Expected legacy proper-fraction mode.');
            }
            scaleFactors.add(problem.scaleFactor);
            equations.add(problem.equation);
        }

        expect(scaleFactors).toEqual(new Set([2, 3, 4]));
        expect(equations.size).toBeGreaterThan(3);
    });

    it('is deterministic for the same repository seed', () => {
        const config = properConfig([
            Ability.Formalization,
            Ability.ProcedureUnderstanding
        ]);
        setSeed('fraction-equivalence');
        const first = generator.generate(config);
        setSeed('fraction-equivalence');
        const second = generator.generate(config);

        expect(second).toEqual(first);
    });
});
