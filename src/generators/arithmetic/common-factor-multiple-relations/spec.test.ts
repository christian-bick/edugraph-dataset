import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {CommonFactorMultipleRelationsGenerator} from './generator.ts';
import {CommonFactorMultipleRelationsGeneratorSchema, spec} from './spec.ts';

const invariants = [Scope.IntegerNumbers, Scope.NumbersWithoutNegatives];

describe('common factor/multiple capability ownership', () => {
    it('keeps only invariant number properties general and configures the real Area', () => {
        expect(spec.generalLabels).toEqual(invariants);
        expect(CommonFactorMultipleRelationsGeneratorSchema.operation[1]([Area.GreatestCommonDivisor])).toBe('gcd');
        expect(CommonFactorMultipleRelationsGeneratorSchema.operation[1]([Area.LeastCommonMultiple])).toBe('lcm');
        expect(() => CommonFactorMultipleRelationsGeneratorSchema.operation[1]([Area.GreatestCommonDivisor, Area.LeastCommonMultiple])).toThrow('Ambiguous');
    });

    it.each([[Area.GreatestCommonDivisor, 100], [Area.LeastCommonMultiple, 12]] as const)(
        'resolves the exact Grade6 Area %s and preserves its input bound', (area, maximum) => {
            for (let seed = 0; seed < 25; seed++) {
                setSeed(seed);
                const problem = generateWithLabels(new CommonFactorMultipleRelationsGenerator(), [...invariants, area, Ability.ProcedureExecution])!;
                expect(problem.labels).toEqual([area]);
                expect(problem.data.kind).toBe('common-factor-multiple-relations');
                expect(Math.max(...problem.data.inputs)).toBeLessThanOrEqual(maximum);
                if (area === Area.GreatestCommonDivisor) expect(problem.data.gcd.kind).toBe('defined');
                expect(problem.data).not.toHaveProperty('operation');
            }
        });

    it('does not choose the mathematical relation from the requested learner Ability', () => {
        for (const area of [Area.GreatestCommonDivisor, Area.LeastCommonMultiple]) {
            setSeed(418);
            const first = generateWithLabels(new CommonFactorMultipleRelationsGenerator(), [...invariants, area, Ability.ProcedureExecution]);
            setSeed(418);
            expect(generateWithLabels(new CommonFactorMultipleRelationsGenerator(), [...invariants, area, Ability.Interpretation])).toEqual(first);
        }
    });
});
