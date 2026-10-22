import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {FractionDivisionRelationsGenerator} from './generator.ts';
import {spec} from './spec.ts';

const profiles = [
    [[Scope.FractionDividend, Scope.FractionDivisor], 'fraction-by-fraction'],
    [[Scope.FractionDividend, Scope.IntegerDivisor], 'fraction-by-integer'],
    [[Scope.IntegerDividend, Scope.FractionDivisor], 'integer-by-fraction']
] as const;

describe('fraction-division-relations capabilities', () => {
    it('owns division and its nonnegative domain without a learner action', () => {
        expect(spec.generalLabels).toEqual([Area.Division, Scope.NumbersWithoutNegatives]);
    });

    it.each(profiles)('resolves the exact original operand bundle %s', (labels, operandProfile) => {
        const problem = generateWithLabels(new FractionDivisionRelationsGenerator(), [
            Area.Division, Scope.NumbersWithoutNegatives, ...labels, Ability.ProcedureExecution
        ])!;
        expect(problem.data.operandProfile).toBe(operandProfile);
        expect(new Set(problem.labels)).toEqual(new Set(labels));
        expect(problem.data).not.toHaveProperty('equationWitness');
        expect(problem.data).not.toHaveProperty('multiplicationWitness');
    });

    it.each(profiles)('selects the mathematical witnesses for %s when requested', (labels) => {
        for (const [mathematicalLabel, field] of [
            [Area.Equation, 'equationWitness'], [Area.Multiplication, 'multiplicationWitness']
        ] as const) {
            const problem = generateWithLabels(new FractionDivisionRelationsGenerator(), [...labels, mathematicalLabel])!;
            expect(problem.data[field]).toBeDefined();
            expect(new Set(problem.labels)).toEqual(new Set([...labels, mathematicalLabel]));
        }
    });

    it('supports both optional witnesses as one conjunction', () => {
        const labels = [Scope.FractionDividend, Scope.FractionDivisor, Area.Equation, Area.Multiplication];
        const problem = generateWithLabels(new FractionDivisionRelationsGenerator(), labels)!;
        expect(problem.data.equationWitness).toBeDefined();
        expect(problem.data.multiplicationWitness).toBeDefined();
        expect(new Set(problem.labels)).toEqual(new Set(labels));
    });

    it('rejects conflicting original role bundles', () => {
        for (const labels of [
            [Scope.FractionDividend, Scope.IntegerDividend, Scope.FractionDivisor],
            [Scope.IntegerDividend, Scope.IntegerDivisor],
            [Scope.FractionDividend, Scope.FractionDivisor, Scope.IntegerDivisor]
        ]) {
            expect(() => generateWithLabels(new FractionDivisionRelationsGenerator(), labels)).toThrow();
        }
    });

    it('is independent of the leaf Ability and contains no selected unknown', () => {
        const labels = [Area.Division, Scope.NumbersWithoutNegatives, Scope.IntegerDividend, Scope.FractionDivisor];
        setSeed(93);
        const execution = generateWithLabels(new FractionDivisionRelationsGenerator(), [...labels, Ability.ProcedureExecution]);
        setSeed(93);
        expect(generateWithLabels(new FractionDivisionRelationsGenerator(), [...labels, Ability.TextualArticulation])).toEqual(execution);
        expect(execution!.data).not.toHaveProperty('unknown');
        expect(execution!.data).not.toHaveProperty('prompt');
    });
});
