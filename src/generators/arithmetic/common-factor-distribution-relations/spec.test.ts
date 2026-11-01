import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {CommonFactorDistributionRelationsGenerator} from './generator.ts';
import {spec, CommonFactorDistributionRelationsGeneratorSchema as schema} from './spec.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';

const mathematics = [Area.GreatestCommonDivisor, Area.DistributiveLaw,
    Scope.IntegerNumbers, Scope.NumbersWithoutNegatives];

describe('full common-factor distribution schema ownership', () => {
    it('owns exactly the reviewed GCD/distributive mathematics', () => {
        expect(spec.generalLabels).toEqual(mathematics);
    });

    it('resolves the real full-extraction target without a global magnitude label', () => {
        const problem = generateWithLabels(new CommonFactorDistributionRelationsGenerator(), [
            ...mathematics, Ability.ProcedureExecution
        ])!;
        expect(problem.data.kind).toBe('full-common-factor-distribution');
        expect(problem.data.sum).toBeLessThanOrEqual(200);
        expect(problem.data.gcd).toBeGreaterThan(1);
        expect(problem.labels).toHaveLength(1);
        expect(problem.labels[0]).toContain('NumbersSmaller');
    });

    it('resolves all six canonical bands identically through both configuration paths', () => {
        expect(schema.range[2]).toHaveLength(6);
        for (const labels of schema.range[2]) {
            const direct = extractConfig(schema, labels);
            expect(resolveSchemaChoices(schema, labels, {range: labels})).toEqual(direct);
        }
    });

    it.each([[Scope.NumbersSmaller100, 100], [Scope.NumbersSmaller1000, 1000]] as const)(
        'resolves the genuine whole-task magnitude capability %s', (label, max) => {
            const problem = generateWithLabels(new CommonFactorDistributionRelationsGenerator(), [...mathematics, label])!;
            expect(problem.data.sum).toBeLessThanOrEqual(max);
            expect(problem.labels).toEqual([label]);
        }
    );

    it('keeps the canonical relation independent of the requested learner action', () => {
        setSeed(731);
        const first = generateWithLabels(new CommonFactorDistributionRelationsGenerator(), [...mathematics, Ability.ProcedureExecution]);
        setSeed(731);
        expect(generateWithLabels(new CommonFactorDistributionRelationsGenerator(), [...mathematics, Ability.ProcedureUnderstanding])).toEqual(first);
    });
});
