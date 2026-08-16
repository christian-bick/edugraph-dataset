import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {FractionEquivalenceProblem, FractionParts} from '../../../types/problems.ts';
import {FractionEquivalenceGenerator} from './generator.ts';
import {FractionEquivalenceGeneratorConfig} from './spec.ts';

const denominators = [2, 3, 4, 6, 8] as const satisfies readonly FractionParts[];

const expectCoherentPair = (problem: FractionEquivalenceProblem) => {
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

describe('FractionEquivalenceGenerator', () => {
    const generator = new FractionEquivalenceGenerator();

    it('strictly validates the exact task-ability modes', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(() => generator.generate({taskAbilities: []})).toThrow();
        expect(() => generator.generate(
            {taskAbilities: Ability.ConceptDerivation} as unknown as FractionEquivalenceGeneratorConfig
        )).toThrow('must be an array');
        expect(() => generator.generate({
            taskAbilities: [Ability.Formalization]
        })).toThrow('taskAbilities must select');
        expect(() => generator.generate({
            taskAbilities: [Ability.ConceptDerivation, Ability.ProcedureUnderstanding]
        })).toThrow('taskAbilities must select');
    });

    it('recognizes proper equivalent fractions', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const problem = generator.generate({
                taskAbilities: [Ability.ConceptDerivation]
            }).data;

            expectCoherentPair(problem);
            expect(problem.task).toBe('recognize-equivalence');
            expect(problem.answer).toBe('equivalent');
        }
    });

    it('generates and explains proper equivalent fractions', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const problem = generator.generate({
                taskAbilities: [Ability.Formalization, Ability.ProcedureUnderstanding]
            }).data;

            expectCoherentPair(problem);
            expect(problem.task).toBe('generate-equivalence');
            expect(problem.answer).toBe(problem.second.notation);
        }
    });

    it('covers every supported scale factor and varies the generated pair', () => {
        const scaleFactors = new Set<number>();
        const equations = new Set<string>();

        for (let seed = 0; seed < 200; seed++) {
            setSeed(seed);
            const problem = generator.generate({
                taskAbilities: [Ability.ConceptDerivation]
            }).data;
            scaleFactors.add(problem.scaleFactor);
            equations.add(problem.equation);
        }

        expect(scaleFactors).toEqual(new Set([2, 3, 4]));
        expect(equations.size).toBeGreaterThan(3);
    });

    it('is deterministic for the same repository seed', () => {
        const config: FractionEquivalenceGeneratorConfig = {
            taskAbilities: [Ability.Formalization, Ability.ProcedureUnderstanding]
        };
        setSeed('fraction-equivalence');
        const first = generator.generate(config);
        setSeed('fraction-equivalence');
        const second = generator.generate(config);

        expect(second).toEqual(first);
    });
});
