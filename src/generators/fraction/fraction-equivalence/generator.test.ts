import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {
    FractionParts,
    ProperFractionEquivalenceProblem
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
    usesEqualShares: true,
    usesImproperFractions: false,
    usesIntegerNumbers: false
});

const wholeConfig: FractionEquivalenceGeneratorConfig = {
    taskAbilities: [Ability.Formalization],
    usesEqualShares: false,
    usesImproperFractions: true,
    usesIntegerNumbers: true
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

    it('covers every supported scale factor and varies the generated pair', () => {
        const scaleFactors = new Set<number>();
        const equations = new Set<string>();

        for (let seed = 0; seed < 200; seed++) {
            setSeed(seed);
            const problem = generator.generate(properConfig([
                Ability.ConceptDerivation
            ])).data;
            if (problem.task === 'represent-whole-as-fraction') throw new Error('Expected proper-fraction mode.');
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
