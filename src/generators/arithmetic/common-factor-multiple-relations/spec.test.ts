import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {CommonFactorMultipleRelationsGenerator} from './generator.ts';
import {CommonFactorMultipleRelationsGeneratorSchema, spec} from './spec.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';

const invariants = [Scope.IntegerNumbers, Scope.NumbersWithoutNegatives];

describe('common factor/multiple capability ownership', () => {
    it('keeps only invariant number properties general and configures the real Area', () => {
        expect(spec.generalLabels).toEqual(invariants);
        expect(extractConfig(CommonFactorMultipleRelationsGeneratorSchema, [Area.GreatestCommonDivisor]).config.profile!.operation).toBe('gcd');
        expect(extractConfig(CommonFactorMultipleRelationsGeneratorSchema, [Area.LeastCommonMultiple]).config.profile!.operation).toBe('lcm');
        expect(() => extractConfig(CommonFactorMultipleRelationsGeneratorSchema, [Area.GreatestCommonDivisor, Area.LeastCommonMultiple])).toThrow();
    });

    it('resolves all ten correlated choices identically through direct and planned configuration', () => {
        const schema = CommonFactorMultipleRelationsGeneratorSchema;
        expect(schema.profile[2]).toHaveLength(10);
        for (const labels of schema.profile[2]) {
            const direct = extractConfig(schema, [...labels]);
            const planned = resolveSchemaChoices(schema, labels, {profile: labels});
            expect(planned.config).toEqual(direct.config);
            expect(new Set(planned.resolvedLabels)).toEqual(new Set(direct.resolvedLabels));
        }
    });

    it.each([[Area.GreatestCommonDivisor, 100], [Area.LeastCommonMultiple, 12]] as const)(
        'resolves the exact Grade6 Area %s and preserves its input bound', (area, maximum) => {
            for (let seed = 0; seed < 25; seed++) {
                setSeed(seed);
                const problem = generateWithLabels(new CommonFactorMultipleRelationsGenerator(), [...invariants, area, Ability.ProcedureExecution])!;
                expect(problem.labels).toContain(area);
                expect(problem.labels.some(label => label.includes('NumbersSmaller'))).toBe(true);
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
